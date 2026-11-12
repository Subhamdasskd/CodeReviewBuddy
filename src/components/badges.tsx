const SEVERITY_STYLES: Record<string, string> = {
  critical: "border-rose-500/40 bg-rose-500/15 text-rose-300",
  high: "border-orange-500/40 bg-orange-500/15 text-orange-300",
  medium: "border-amber-500/40 bg-amber-500/15 text-amber-300",
  low: "border-sky-500/40 bg-sky-500/15 text-sky-300",
  info: "border-slate-500/40 bg-slate-500/15 text-slate-300",
};

export function SeverityBadge({ severity }: { severity: string }) {
  const style = SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.info;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${style}`}
    >
      {severity}
    </span>
  );
}

const REVIEW_STYLES: Record<string, string> = {
  completed: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  analyzing: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  pending: "border-slate-500/40 bg-slate-500/10 text-slate-400",
  failed: "border-rose-500/40 bg-rose-500/10 text-rose-300",
};

export function ReviewStatusBadge({ status }: { status: string }) {
  const style = REVIEW_STYLES[status] ?? REVIEW_STYLES.pending;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${style}`}
    >
      {status === "analyzing" ? (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" aria-hidden="true" />
      ) : null}
      {status}
    </span>
  );
}

const PR_STATUS_STYLES: Record<string, string> = {
  open: "text-emerald-300",
  merged: "text-violet-300",
  closed: "text-slate-400",
};

export function PrStatusLabel({ status }: { status: string }) {
  return (
    <span
      className={`text-[11px] font-medium capitalize ${PR_STATUS_STYLES[status] ?? "text-slate-400"}`}
    >
      {status}
    </span>
  );
}
