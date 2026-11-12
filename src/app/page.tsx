import type { ElementType } from "react";
import { getServerSession } from "next-auth";
import {
  AlertTriangle,
  GitPullRequest,
  Layers,
  ScanSearch,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { AppHeader, Brand } from "@/components/AppHeader";
import { SignInButton, SignInLink } from "@/components/AuthButtons";
import {
  EmptyRepositories,
  RepositoryCard,
  StatCard,
} from "@/components/dashboard-cards";
import { GitHubMark } from "@/components/icons";
import { SyncReposButton } from "@/components/SyncReposButton";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return <Landing />;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, image: true },
  });

  if (!user) {
    return <Landing />;
  }

  const [repositories, pullRequestCount, findingCount, highSeverityCount] =
    await Promise.all([
      prisma.repository.findMany({
        where: { ownerId: user.id },
        orderBy: [{ stars: "desc" }, { name: "asc" }],
        include: { _count: { select: { pullRequests: true } } },
      }),
      prisma.pullRequest.count({
        where: { repository: { ownerId: user.id } },
      }),
      prisma.reviewFinding.count({
        where: { isDismissed: false, pullRequest: { repository: { ownerId: user.id } } },
      }),
      prisma.reviewFinding.count({
        where: {
          isDismissed: false,
          severity: { in: ["critical", "high"] },
          pullRequest: { repository: { ownerId: user.id } },
        },
      }),
    ]);

  const displayName = user.name ?? session.user.name ?? "there";
  const firstName = displayName.split(" ")[0];

  return (
    <div className="min-h-screen">
      <AppHeader
        user={{ name: user.name, email, image: user.image ?? session.user.image ?? null }}
      />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
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
              Welcome back, <span className="text-gradient">{firstName}</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              Sync your GitHub repositories to build the review workspace. Every
              repository you can access is imported in one pass and kept up to date.
            </p>
          </div>

          <SyncReposButton />
        </div>

        <section
          aria-label="Workspace statistics"
          className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <StatCard
            label="Repositories"
            value={repositories.length}
            hint="Synced from GitHub"
            icon={Layers}
          />
          <StatCard
            label="Pull requests"
            value={pullRequestCount}
            hint="Tracked across repositories"
            icon={GitPullRequest}
          />
          <StatCard
            label="Findings"
            value={findingCount}
            hint="From pull request reviews"
            icon={ScanSearch}
          />
          <StatCard
            label="High severity"
            value={highSeverityCount}
            hint="Critical and high findings"
            icon={AlertTriangle}
          />
        </section>

        <section aria-label="Repositories" className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Repositories</h2>
              <p className="mt-1 text-xs text-slate-500">
                {repositories.length === 0
                  ? "Nothing synced yet"
                  : `${repositories.length} connected ${
                      repositories.length === 1 ? "repository" : "repositories"
                    }`}
              </p>
            </div>
            <div className="hidden h-px flex-1 bg-gradient-to-r from-white/10 to-transparent sm:block" />
          </div>

          <div className="mt-4">
            {repositories.length === 0 ? (
              <EmptyRepositories />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {repositories.map((repository) => (
                  <RepositoryCard
                    key={repository.id}
                    repository={{
                      id: repository.id,
                      name: repository.name,
                      fullName: repository.fullName,
                      description: repository.description,
                      private: repository.private,
                      primaryLanguage: repository.primaryLanguage,
                      stars: repository.stars,
                      forks: repository.forks,
                      addedAt: repository.createdAt,
                      pullRequestCount: repository._count.pullRequests,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <p className="mt-10 text-xs text-slate-600">
          Newly synced pull requests are reviewed automatically. Open a repository and
          pick a pull request to see the findings.
        </p>
      </main>
    </div>
  );
}

const LANDING_FEATURES: {
  title: string;
  body: string;
  icon: ElementType;
  status: string;
}[] = [
  {
    title: "Connect in one click",
    body: "Sign in with GitHub. No personal access tokens to paste or rotate.",
    icon: GitHubMark,
    status: "Live",
  },
  {
    title: "Repository sync",
    body: "Import every repository you can access, with language, stars and visibility.",
    icon: Layers,
    status: "Live",
  },
  {
    title: "Review findings",
    body: "Security, bug and style findings on each pull request, with a suggested fix.",
    icon: Sparkles,
    status: "Live",
  },
];

function Landing() {
  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6">
      <header className="flex items-center justify-between py-6">
        <Brand />
        <SignInLink />
      </header>

      <main className="flex flex-1 flex-col justify-center py-14">
        <div className="relative">
          <div className="animate-float-slow pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full bg-emerald-500/20 blur-[90px]" />
          <div className="pointer-events-none absolute right-4 top-6 h-64 w-64 rounded-full bg-cyan-500/15 blur-[90px]" />

          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              GitHub-native code review
            </span>

            <h1 className="mt-7 text-4xl font-semibold leading-[1.06] tracking-tight sm:text-6xl">
              <span className="text-white">Every pull request reviewed</span>
              <span className="text-gradient mt-2 block">
                before your team sees it.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-400">
              CodeReview Buddy connects to your GitHub account, keeps your repositories
              in sync, and turns each review into structured, actionable intelligence
              for the whole team.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <SignInButton />
              <span className="inline-flex items-center gap-2 text-xs text-slate-500">
                <GitPullRequest className="h-3.5 w-3.5" aria-hidden="true" />
                Read-only access · revoke anytime on GitHub
              </span>
            </div>

            <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4 border-t border-white/5 pt-6">
              <div>
                <dt className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                  Review rules
                </dt>
                <dd className="mt-1 font-mono text-sm text-emerald-300">17</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                  Tokens
                </dt>
                <dd className="mt-1 font-mono text-sm text-emerald-300">AES-256</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                  Webhook
                </dt>
                <dd className="mt-1 font-mono text-sm text-emerald-300">HMAC</dd>
              </div>
            </dl>
          </div>
        </div>

        <ul className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {LANDING_FEATURES.map((feature) => {
            const Icon = feature.icon;

            return (
              <li key={feature.title} className="panel panel-hover rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10">
                    <Icon className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      feature.status === "Live"
                        ? "bg-emerald-400/10 text-emerald-300"
                        : "bg-white/5 text-slate-500"
                    }`}
                  >
                    {feature.status}
                  </span>
                </div>
                <h2 className="mt-4 text-sm font-semibold text-white">
                  {feature.title}
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-400">{feature.body}</p>
              </li>
            );
          })}
        </ul>
      </main>

      <footer className="flex items-center justify-between border-t border-white/5 py-6 text-xs text-slate-600">
        <span>CodeReview Buddy</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-700">
          v1.0 · engineering intelligence
        </span>
      </footer>
    </div>
  );
}
