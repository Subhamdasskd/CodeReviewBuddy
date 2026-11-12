"use client";

import { useState } from "react";
import { Loader2, RotateCcw, X } from "lucide-react";

import { SeverityBadge } from "@/components/badges";

export type FindingItem = {
  id: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  suggestion: string | null;
  filePath: string | null;
  lineStart: number | null;
  confidence: number | null;
  isDismissed: boolean;
};

const SEVERITIES = ["critical", "high", "medium", "low", "info"] as const;

export function FindingsPanel({
  findings,
  neverReviewed = false,
  readOnly = false,
}: {
  findings: FindingItem[];
  neverReviewed?: boolean;
  readOnly?: boolean;
}) {
  const [items, setItems] = useState(findings);
  const [filter, setFilter] = useState<string>("all");
  const [showDismissed, setShowDismissed] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const active = items.filter((item) => !item.isDismissed);
  const dismissedCount = items.length - active.length;

  const visible = items.filter(
    (item) =>
      (filter === "all" || item.severity === filter) &&
      (showDismissed || !item.isDismissed),
  );

  async function toggleDismiss(id: string, dismissed: boolean) {
    setPendingId(id);
    setError(null);

    try {
      const response = await fetch(`/api/findings/${id}/dismiss`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dismissed }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Could not update the finding");
        return;
      }

      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, isDismissed: dismissed } : item)),
      );
    } catch {
      setError("Could not reach the server");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">
          Review findings
        </h2>

        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChip
            label="All"
            count={active.length}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          {SEVERITIES.map((severity) => (
            <FilterChip
              key={severity}
              label={severity}
              count={active.filter((item) => item.severity === severity).length}
              active={filter === severity}
              onClick={() => setFilter(severity)}
            />
          ))}
        </div>
      </div>

      {dismissedCount > 0 ? (
        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-[11px] text-slate-500">
          <input
            type="checkbox"
            checked={showDismissed}
            onChange={(event) => setShowDismissed(event.target.checked)}
            className="h-3 w-3 accent-emerald-500"
          />
          Show dismissed ({dismissedCount})
        </label>
      ) : null}

      {error ? (
        <p className="mt-3 text-xs text-rose-300" role="alert">
          {error}
        </p>
      ) : null}

      {visible.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-12 text-center">
          <h3 className="text-sm font-semibold text-white">
            {neverReviewed
              ? "Not reviewed yet"
              : items.length === 0
                ? "No issues found"
                : "Nothing matches this filter"}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            {neverReviewed
              ? "Run the review to scan this pull request's added lines."
              : items.length === 0
                ? "The rules engine found nothing to flag in the added lines."
                : "Try another severity, or show dismissed findings."}
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {visible.map((finding) => (
            <li
              key={finding.id}
              className={`rounded-xl border p-5 transition-opacity ${
                finding.isDismissed
                  ? "border-white/5 bg-white/[0.01] opacity-60"
                  : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <div className="flex flex-wrap items-center gap-3">
                <SeverityBadge severity={finding.severity} />
                <h3 className="text-sm font-semibold text-white">{finding.title}</h3>
                <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-slate-400">
                  {finding.category}
                </span>
                {finding.confidence !== null ? (
                  <span className="text-[10px] text-slate-500">
                    {Math.round(finding.confidence * 100)}% confidence
                  </span>
                ) : null}

                {!readOnly ? (
                  <button
                    type="button"
                    onClick={() => toggleDismiss(finding.id, !finding.isDismissed)}
                    disabled={pendingId === finding.id}
                    className="ml-auto inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[10px] font-medium text-slate-400 transition-colors hover:border-white/25 hover:text-slate-200 disabled:opacity-50"
                  >
                    {pendingId === finding.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                    ) : finding.isDismissed ? (
                      <RotateCcw className="h-3 w-3" aria-hidden="true" />
                    ) : (
                      <X className="h-3 w-3" aria-hidden="true" />
                    )}
                    {finding.isDismissed ? "Restore" : "Dismiss"}
                  </button>
                ) : null}
              </div>

              {finding.filePath ? (
                <p className="mt-2 font-mono text-[11px] text-slate-400">
                  {finding.filePath}
                  {finding.lineStart ? `:${finding.lineStart}` : ""}
                </p>
              ) : null}

              <p className="mt-2 text-sm leading-6 text-slate-300">{finding.description}</p>

              {finding.suggestion ? (
                <div className="mt-3 rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                    Suggested fix
                  </p>
                  <p className="mt-1 text-xs leading-5 text-emerald-100/90">
                    {finding.suggestion}
                  </p>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize transition-colors ${
        active
          ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300"
          : "border-white/10 text-slate-400 hover:border-white/25 hover:text-slate-200"
      }`}
    >
      {label}
      <span className="tabular-nums">{count}</span>
    </button>
  );
}
