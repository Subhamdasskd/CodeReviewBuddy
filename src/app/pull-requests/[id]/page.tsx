import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { GitBranch, GitPullRequest, Sparkles } from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { PrStatusLabel, ReviewStatusBadge } from "@/components/badges";
import { FindingsPanel } from "@/components/FindingsPanel";
import { RunReviewButton } from "@/components/RunReviewButton";
import { getSessionUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { severityWeight } from "@/services/review/types";

export const dynamic = "force-dynamic";

export default async function PullRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();

  if (!user) redirect("/");

  const pullRequest = await prisma.pullRequest.findFirst({
    where: { id, repository: { ownerId: user.id } },
    include: {
      repository: { select: { id: true, fullName: true } },
      findings: true,
    },
  });

  if (!pullRequest) notFound();

  const findings = pullRequest.findings.sort(
    (a, b) =>
      severityWeight(a.severity) - severityWeight(b.severity) ||
      (a.filePath ?? "").localeCompare(b.filePath ?? "") ||
      (a.lineStart ?? 0) - (b.lineStart ?? 0),
  );

  const opened = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(pullRequest.openedAt);

  const aiUsed = findings.some((finding) => finding.rule === "ai/llm");

  return (
    <div className="min-h-screen">
      <AppHeader user={user} />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <nav className="text-xs text-slate-500">
          <Link href="/" className="transition-colors hover:text-slate-300">
            Dashboard
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={`/repositories/${pullRequest.repository.id}`}
            className="transition-colors hover:text-slate-300"
          >
            {pullRequest.repository.fullName}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-300">#{pullRequest.githubPrNumber}</span>
        </nav>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold leading-snug tracking-tight text-white">
              {pullRequest.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <GitPullRequest className="h-3.5 w-3.5" aria-hidden="true" />
                #{pullRequest.githubPrNumber}
              </span>
              <span>by {pullRequest.authorLogin}</span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
                {pullRequest.headBranch} → {pullRequest.baseBranch}
              </span>
              <span>opened {opened}</span>
              <PrStatusLabel status={pullRequest.status} />
              <ReviewStatusBadge status={pullRequest.reviewStatus} />
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <RunReviewButton pullRequestId={pullRequest.id} />
            {aiUsed ? (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-400">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                AI-assisted
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Files changed" value={pullRequest.filesChanged} />
          <Stat label="Lines added" value={pullRequest.linesAdded} tone="text-emerald-300" />
          <Stat label="Lines removed" value={pullRequest.linesRemoved} tone="text-rose-300" />
          <Stat label="Findings" value={findings.length} />
        </div>

        <section className="mt-10">
          <FindingsPanel
            findings={findings.map((finding) => ({
              id: finding.id,
              category: finding.category,
              severity: finding.severity,
              title: finding.title,
              description: finding.description,
              suggestion: finding.suggestion,
              filePath: finding.filePath,
              lineStart: finding.lineStart,
              confidence: finding.confidence,
              isDismissed: finding.isDismissed,
            }))}
            neverReviewed={pullRequest.reviewStatus === "pending"}
          />
        </section>
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
