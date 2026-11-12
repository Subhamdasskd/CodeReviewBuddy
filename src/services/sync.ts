import { prisma } from "@/lib/prisma";
import { listRepositories, type GitHubRepository } from "./github/github.services";
import { listPullRequests } from "./github/pull-requests";

const TRANSACTION_CHUNK_SIZE = 50;
const REPOSITORY_LIMIT = 15;
const PULL_REQUESTS_PER_REPO = 20;
const AUTO_REVIEW_LIMIT = 3;

export type SyncResult = {
  repositories: { fetched: number; created: number; updated: number; total: number };
  pullRequests: { fetched: number; created: number; updated: number };
  reviewed: number;
};

function repositoryMetadata(repository: GitHubRepository) {
  return {
    name: repository.name,
    fullName: repository.full_name,
    description: repository.description,
    private: repository.private,
    defaultBranch: repository.default_branch,
    primaryLanguage: repository.language,
    stars: repository.stargazers_count,
    forks: repository.forks_count,
  };
}

async function syncRepositories(userId: string, accessToken: string) {
  const repositories = await listRepositories(accessToken);

  if (repositories.length === 0) {
    return {
      fetched: 0,
      created: 0,
      updated: 0,
      total: await prisma.repository.count({ where: { ownerId: userId } }),
      records: [] as { id: string; fullName: string }[],
    };
  }

  const githubRepoIds = repositories.map((repository) => String(repository.id));
  const existing = await prisma.repository.findMany({
    where: { githubRepoId: { in: githubRepoIds } },
    select: { githubRepoId: true },
  });
  const existingIds = new Set(existing.map((repository) => repository.githubRepoId));

  const operations = repositories.map((repository) => {
    const githubRepoId = String(repository.id);

    return prisma.repository.upsert({
      where: { githubRepoId },
      update: { ...repositoryMetadata(repository), lastSyncedAt: new Date() },
      create: {
        ...repositoryMetadata(repository),
        githubRepoId,
        ownerId: userId,
        lastSyncedAt: new Date(),
      },
    });
  });

  for (let index = 0; index < operations.length; index += TRANSACTION_CHUNK_SIZE) {
    await prisma.$transaction(operations.slice(index, index + TRANSACTION_CHUNK_SIZE));
  }

  const records = await prisma.repository.findMany({
    where: { ownerId: userId, isActive: true },
    select: { id: true, fullName: true },
    orderBy: { stars: "desc" },
    take: REPOSITORY_LIMIT,
  });

  const updated = repositories.filter((repository) =>
    existingIds.has(String(repository.id)),
  ).length;

  return {
    fetched: repositories.length,
    created: repositories.length - updated,
    updated,
    total: await prisma.repository.count({ where: { ownerId: userId } }),
    records,
  };
}

export async function syncPullRequestsForRepository(
  accessToken: string,
  repository: { id: string; fullName: string },
) {
  const pullRequests = await listPullRequests(
    accessToken,
    repository.fullName,
    PULL_REQUESTS_PER_REPO,
  );

  if (pullRequests.length === 0) {
    return { fetched: 0, created: 0, updated: 0 };
  }

  const numbers = pullRequests.map((pullRequest) => pullRequest.number);
  const existing = await prisma.pullRequest.findMany({
    where: { repositoryId: repository.id, githubPrNumber: { in: numbers } },
    select: { githubPrNumber: true },
  });
  const existingNumbers = new Set(existing.map((pullRequest) => pullRequest.githubPrNumber));

  for (const pullRequest of pullRequests) {
    const metadata = {
      title: pullRequest.title,
      body: pullRequest.body,
      authorLogin: pullRequest.user?.login ?? "ghost",
      authorAvatar: pullRequest.user?.avatar_url ?? null,
      baseBranch: pullRequest.base.ref,
      headBranch: pullRequest.head.ref,
      filesChanged: pullRequest.changed_files,
      linesAdded: pullRequest.additions,
      linesRemoved: pullRequest.deletions,
      status: pullRequest.merged_at ? "merged" : pullRequest.state,
      openedAt: new Date(pullRequest.created_at),
    };

    await prisma.pullRequest.upsert({
      where: {
        repositoryId_githubPrNumber: {
          repositoryId: repository.id,
          githubPrNumber: pullRequest.number,
        },
      },
      update: metadata,
      create: {
        ...metadata,
        githubPrNumber: pullRequest.number,
        repositoryId: repository.id,
      },
    });
  }

  const updated = pullRequests.filter((pullRequest) =>
    existingNumbers.has(pullRequest.number),
  ).length;

  return {
    fetched: pullRequests.length,
    created: pullRequests.length - updated,
    updated,
  };
}

/**
 * Imports repositories and their recent pull requests for a user.
 *
 * Repositories are upserted by GitHub id; pull requests by (repository, number),
 * so repeated runs stay idempotent.
 */
export async function syncFromGitHub(
  userId: string,
  accessToken: string,
): Promise<SyncResult> {
  const repositories = await syncRepositories(userId, accessToken);

  let prsFetched = 0;
  let prsCreated = 0;
  let prsUpdated = 0;

  for (const repository of repositories.records) {
    try {
      const result = await syncPullRequestsForRepository(accessToken, repository);
      prsFetched += result.fetched;
      prsCreated += result.created;
      prsUpdated += result.updated;
    } catch {
      // A single repository with restricted access must not fail the whole sync.
    }
  }

  const pending = await prisma.pullRequest.findMany({
    where: {
      repository: { ownerId: userId },
      reviewStatus: { in: ["pending", "failed"] },
    },
    orderBy: { openedAt: "desc" },
    take: AUTO_REVIEW_LIMIT,
    select: { id: true },
  });

  let reviewed = 0;

  for (const pullRequest of pending) {
    try {
      const { reviewStoredPullRequest } = await import("./review/service");
      await reviewStoredPullRequest(pullRequest.id, accessToken);
      reviewed += 1;
    } catch {
      // Leave the PR in its current state; it can be re-triggered manually.
    }
  }

  return {
    repositories: {
      fetched: repositories.fetched,
      created: repositories.created,
      updated: repositories.updated,
      total: repositories.total,
    },
    pullRequests: {
      fetched: prsFetched,
      created: prsCreated,
      updated: prsUpdated,
    },
    reviewed,
  };
}
