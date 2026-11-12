"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ScanSearch } from "lucide-react";

export function RunReviewButton({ pullRequestId }: { pullRequestId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/prs/${pullRequestId}/review/trigger`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Review failed");
        return;
      }

      router.refresh();
    } catch {
      setError("Could not reach the server");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <ScanSearch className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {busy ? "Reviewing…" : "Run review"}
      </button>

      {error ? (
        <p className="text-[11px] text-rose-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
