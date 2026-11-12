import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { GitFork, GitPullRequest, Lock, Star } from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { PrStatusLabel, ReviewStatusBadge } from "@/components/badges";
import { getSessionUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function RepositoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();

  if (!user) redirect("/");

  const repository = await prisma.repository.findFirst({
    where: { id, ownerId: user.id },
    include: {
      pullRequests: {
        orderBy: { openedAt: "desc" },
        include: { _count: { select: { findings: { where: { isDismissed: false } } } } },
      },
    },
  });

  if (!repository) notFound();

  const totalFindings = repository.pullRequests.reduce(
    (sum, pullRequest) => sum + pullRequest._count.findings,
    0,
  );

  return (
    <div className="min-h-screen">
      <AppHeader user={user} />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <nav className="text-xs text-slate-500">
          <Link href="/" className="transition-colors hover:text-slate-300">
            Dashboard
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-300">{repository.fullName}</span>
        </nav>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-white">
              {repository.fullName}
              {repository.private ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-300">
                  <Lock className="h-3 w-3" aria-hidden="true" />
                  Private
                </span>
              ) : null}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              {repository.description ?? "No description provided."}
            </p>
          </div>

          <dl className="panel flex flex-wrap gap-8 rounded-2xl px-6 py-4 text-xs text-slate-400">
            <div>
              <dt className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                Pull requests
              </dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums text-white">
                {repository.pullRequests.length}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                Findings
              </dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums text-white">
                {totalFindings}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                Stars
              </dt>
              <dd className="mt-1 inline-flex items-center gap-1 text-lg font-semibold tabular-nums text-white">
                <Star className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
                {repository.stars}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                Forks
              </dt>
              <dd className="mt-1 inline-flex items-center gap-1 text-lg font-semibold tabular-nums text-white">
                <GitFork className="h-3.5 w-3.5 text-cyan-300" aria-hidden="true" />
                {repository.forks}
              </dd>
            </div>
          </dl>
        </div>

        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">
            Pull requests
          </h2>

          {repository.pullRequests.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-12 text-center">
              <GitPullRequest
                className="mx-auto h-6 w-6 text-slate-500"
                aria-hidden="true"
              />
              <h3 className="mt-3 text-sm font-semibold text-white">
                No pull requests synced
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
                Go back to the dashboard and run{" "}
                <span className="font-medium text-slate-200">Sync from GitHub</span> to
                import this repository&apos;s recent pull requests.
              </p>
              <Link
                href="/"
                className="mt-5 inline-flex rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-emerald-400/40"
              >
                Back to dashboard
              </Link>
            </div>
          ) : (
            <ul className="panel mt-4 divide-y divide-white/5 overflow-hidden rounded-2xl">
              {repository.pullRequests.map((pullRequest) => (
                <li key={pullRequest.id}>
                  <Link
                    href={`/pull-requests/${pullRequest.id}`}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 transition-colors hover:bg-white/[0.03]"
                  >
                    <span className="font-mono text-xs text-slate-500">
                      #{pullRequest.githubPrNumber}
                    </span>

                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-100">
                      {pullRequest.title}
                    </span>

                    <span className="text-[11px] text-slate-500">
                      {pullRequest.authorLogin}
                    </span>

                    <span className="text-[11px] text-slate-500">
                      {pullRequest.filesChanged > 0 || pullRequest.reviewStatus === "completed" ? (
                        <>
                          {pullRequest.filesChanged} files
                          <span className="ml-2 text-emerald-400">
                            +{pullRequest.linesAdded}
                          </span>
                          <span className="ml-1 text-rose-400">
                            −{pullRequest.linesRemoved}
                          </span>
                        </>
                      ) : (
                        "not reviewed"
                      )}
                    </span>

                    <PrStatusLabel status={pullRequest.status} />

                    <ReviewStatusBadge status={pullRequest.reviewStatus} />

                    <span className="w-16 text-right text-[11px] text-slate-400">
                      {pullRequest._count.findings} findings
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
