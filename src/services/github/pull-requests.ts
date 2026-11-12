import { githubFetch } from "./client";

export type GitHubPullRequest = {
  number: number;
  title: string;
  body: string | null;
  state: string;
  draft: boolean;
  merged_at: string | null;
  user: { login: string; avatar_url: string } | null;
  base: { ref: string };
  head: { ref: string };
  changed_files: number;
  additions: number;
  deletions: number;
  created_at: string;
  updated_at: string;
  html_url: string;
};

export type GitHubPullRequestFile = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
};

/**
 * Lists pull requests for a repository, newest activity first.
 *
 * `fullName` is the owner/name pair GitHub uses, e.g. "vercel/next.js".
 */
export async function listPullRequests(
  accessToken: string,
  fullName: string,
  perPage = 20,
): Promise<GitHubPullRequest[]> {
  return githubFetch<GitHubPullRequest[]>(
    `/repos/${fullName}/pulls?state=all&sort=updated&direction=desc&per_page=${perPage}`,
    accessToken,
  );
}

/**
 * Returns the changed files (with unified diff patches) for one pull request.
 *
 * GitHub caps this endpoint at 3000 files, which is far above what the review
 * engine will process.
 */
export async function listPullRequestFiles(
  accessToken: string,
  fullName: string,
  pullNumber: number,
): Promise<GitHubPullRequestFile[]> {
  return githubFetch<GitHubPullRequestFile[]>(
    `/repos/${fullName}/pulls/${pullNumber}/files?per_page=100`,
    accessToken,
  );
}
