import Link from "next/link";
import { GitBranch, GitPullRequest } from "lucide-react";

import { PrStatusLabel, ReviewStatusBadge } from "@/components/badges";
import { DemoHeader } from "@/components/DemoHeader";
import { FindingsPanel } from "@/components/FindingsPanel";
import { demoFindings, demoPullRequest } from "@/lib/demo-data";

export const metadata = {
  title: "CodeReview Buddy — sample review",
  description: "A read-only walkthrough of a pull request review.",
};

export default function DemoReviewPage() {
  const opened = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(demoPullRequest.openedAt);

  return (
    <div className="min-h-screen">
      <DemoHeader />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <nav className="text-xs text-slate-500">
          <Link href="/demo" className="transition-colors hover:text-slate-300">
            Demo
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-300">{demoPullRequest.repository.fullName}</span>
          <span className="mx-2">/</span>
          <span className="text-slate-300">#{demoPullRequest.number}</span>
        </nav>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold leading-snug tracking-tight text-white">
              {demoPullRequest.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <GitPullRequest className="h-3.5 w-3.5" aria-hidden="true" />
                #{demoPullRequest.number}
              </span>
              <span>by {demoPullRequest.authorLogin}</span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
                {demoPullRequest.headBranch} → {demoPullRequest.baseBranch}
              </span>
              <span>opened {opened}</span>
              <PrStatusLabel status={demoPullRequest.status} />
              <ReviewStatusBadge status={demoPullRequest.reviewStatus} />
            </div>
          </div>

          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
            Sample review
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Files changed" value={demoPullRequest.filesChanged} />
          <Stat
            label="Lines added"
            value={demoPullRequest.linesAdded}
            tone="text-emerald-300"
          />
          <Stat
            label="Lines removed"
            value={demoPullRequest.linesRemoved}
            tone="text-rose-300"
          />
          <Stat label="Findings" value={demoFindings.length} />
        </div>

        <section className="mt-10">
          <FindingsPanel findings={demoFindings} readOnly />
        </section>

        <p className="mt-8 text-xs text-slate-600">
          Sample data only. Sign in to review your own pull requests.
        </p>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "text-white",
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <div className="panel rounded-xl px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}
