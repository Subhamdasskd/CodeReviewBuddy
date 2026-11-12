import Link from "next/link";
import { AlertTriangle, GitPullRequest, Layers, ScanSearch } from "lucide-react";

import { RepositoryCard, StatCard } from "@/components/dashboard-cards";
import { DemoHeader } from "@/components/DemoHeader";
import { demoRepositories, demoStats } from "@/lib/demo-data";

export const metadata = {
  title: "CodeReview Buddy — live demo",
  description: "A read-only walkthrough of the CodeReview Buddy dashboard.",
};

export default function DemoPage() {
  return (
    <div className="min-h-screen">
      <DemoHeader />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="panel rounded-2xl border-emerald-400/20 px-5 py-4">
          <p className="text-xs leading-6 text-slate-300">
            <span className="font-semibold text-emerald-300">Read-only demo.</span>{" "}
            These repositories and findings are sample data. Sign in with GitHub to
            sync your own repositories and run real reviews.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-400">
                Engineering overview
              </p>
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Welcome back, <span className="text-gradient">Priya</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              This is what the workspace looks like once repositories are connected and
              pull requests have been reviewed.
            </p>
          </div>

          <Link
            href="/demo/review"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-400"
          >
            <ScanSearch className="h-4 w-4" aria-hidden="true" />
            Open a sample review
          </Link>
        </div>

        <section
          aria-label="Demo statistics"
          className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <StatCard
            label="Repositories"
            value={demoStats.repositories}
            hint="Synced from GitHub"
            icon={Layers}
          />
          <StatCard
            label="Pull requests"
            value={demoStats.pullRequests}
            hint="Tracked across repositories"
            icon={GitPullRequest}
          />
          <StatCard
            label="Findings"
            value={demoStats.findings}
            hint="From pull request reviews"
            icon={ScanSearch}
          />
          <StatCard
            label="High severity"
            value={demoStats.highSeverity}
            hint="Critical and high findings"
            icon={AlertTriangle}
          />
        </section>

        <section aria-label="Repositories" className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Repositories</h2>
              <p className="mt-1 text-xs text-slate-500">
                {demoRepositories.length} connected repositories
              </p>
            </div>
            <div className="hidden h-px flex-1 bg-gradient-to-r from-white/10 to-transparent sm:block" />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {demoRepositories.map((repository) => (
              <RepositoryCard
                key={repository.id}
                href="/demo/review"
                repository={repository}
              />
            ))}
          </div>
        </section>

        <p className="mt-10 text-xs text-slate-600">
          Sample data only · no GitHub account required.
        </p>
      </main>
    </div>
  );
}
