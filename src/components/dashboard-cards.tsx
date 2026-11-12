import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, GitFork, GitPullRequest, Lock, Star } from "lucide-react";

type StatCardProps = {
  label: string;
  value: number;
  hint: string;
  icon: LucideIcon;
};

export function StatCard({ label, value, hint, icon: Icon }: StatCardProps) {
  return (
    <div className="panel panel-hover group relative overflow-hidden rounded-2xl p-5">
      <div className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-emerald-400/10 blur-2xl transition-colors group-hover:bg-emerald-400/20" />

      <div className="relative flex items-start justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          {label}
        </p>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-400/10">
          <Icon className="h-4 w-4 text-emerald-300" aria-hidden="true" />
        </span>
      </div>

      <p className="relative mt-4 text-4xl font-semibold tabular-nums tracking-tight text-white">
        {value}
      </p>
      <p className="relative mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Java: "#b07219",
  Go: "#00ADD8",
  Rust: "#dea584",
  C: "#555555",
  "C++": "#f34b7d",
  "C#": "#178600",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  "Jupyter Notebook": "#DA5B0B",
  Vue: "#41b883",
  Dart: "#00B4AB",
};

type RepositoryCardProps = {
  href?: string;
  repository: {
    id: string;
    name: string;
    fullName: string;
    description: string | null;
    private: boolean;
    primaryLanguage: string | null;
    stars: number;
    forks: number;
    addedAt: Date;
    pullRequestCount: number;
  };
};

export function RepositoryCard({ repository, href }: RepositoryCardProps) {
  const languageColor = repository.primaryLanguage
    ? (LANGUAGE_COLORS[repository.primaryLanguage] ?? "#94a3b8")
    : null;

  const added = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(repository.addedAt);

  return (
    <Link
      href={href ?? `/repositories/${repository.id}`}
      className="panel panel-hover group flex h-full flex-col rounded-2xl p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 truncate text-sm font-semibold text-white transition-colors group-hover:text-emerald-300">
            {repository.name}
            <ArrowUpRight
              className="h-3.5 w-3.5 shrink-0 text-emerald-400 opacity-0 transition-opacity group-hover:opacity-100"
              aria-hidden="true"
            />
          </h3>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {repository.fullName}
          </p>
        </div>
        {repository.private ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-300">
            <Lock className="h-3 w-3" aria-hidden="true" />
            Private
          </span>
        ) : null}
      </div>

      <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-xs leading-5 text-slate-400">
        {repository.description ?? "No description provided."}
      </p>

      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/5 pt-4 text-[11px] text-slate-500">
        {repository.primaryLanguage ? (
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: languageColor ?? "#94a3b8" }}
              aria-hidden="true"
            />
            {repository.primaryLanguage}
          </span>
        ) : null}

        <span className="inline-flex items-center gap-1">
          <Star className="h-3 w-3" aria-hidden="true" />
          {repository.stars}
        </span>

        <span className="inline-flex items-center gap-1">
          <GitFork className="h-3 w-3" aria-hidden="true" />
          {repository.forks}
        </span>

        <span className="inline-flex items-center gap-1">
          <GitPullRequest className="h-3 w-3" aria-hidden="true" />
          {repository.pullRequestCount}
        </span>

        <span className="ml-auto">{added}</span>
      </div>
    </Link>
  );
}

export function EmptyRepositories() {
  return (
    <div className="panel rounded-2xl border-dashed px-6 py-16 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10">
        <GitPullRequest className="h-5 w-5 text-emerald-300" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-white">No repositories yet</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
        Use <span className="font-medium text-slate-200">Sync from GitHub</span> to
        import them from your GitHub account. Only repositories you can access are
        imported.
      </p>
    </div>
  );
}
