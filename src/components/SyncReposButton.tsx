"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, RefreshCw } from "lucide-react";

type SyncResponse = {
  repositories: { fetched: number; created: number; updated: number; total: number };
  pullRequests: { fetched: number; created: number; updated: number };
  reviewed: number;
  error?: string;
};

export function SyncReposButton() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "syncing" | "done">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sync() {
    setStatus("syncing");
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/github/sync-repos", { method: "POST" });
      const data = (await response.json().catch(() => ({}))) as SyncResponse;

      if (!response.ok) {
        setError(data.error ?? "Sync failed. Please try again.");
        setStatus("idle");
        return;
      }

      const repositories = data.repositories?.fetched ?? 0;
      const pullRequests = data.pullRequests?.fetched ?? 0;
      const reviewed = data.reviewed ?? 0;

      setMessage(
        `Synced ${repositories} ${repositories === 1 ? "repository" : "repositories"} · ` +
          `${pullRequests} PRs · ${reviewed} reviewed`,
      );
      setStatus("done");
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
      setStatus("idle");
    }
  }

  const busy = status === "syncing";

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        type="button"
        onClick={sync}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : status === "done" ? (
          <Check className="h-4 w-4" aria-hidden="true" />
        ) : (
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
        )}
        {busy ? "Syncing…" : status === "done" ? "Synced" : "Sync from GitHub"}
      </button>

      {message ? (
        <p className="text-xs text-slate-400" role="status">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="max-w-xs text-xs text-rose-300 sm:text-right" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
