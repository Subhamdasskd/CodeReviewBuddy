import { githubFetch, GitHubError } from "./client";

const PER_PAGE = 100;
const MAX_PAGES = 5;

export { GitHubError };

export type GitHubRepository = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  default_branch: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  html_url: string;
};

/**
 * Fetches the repositories the authenticated user can access.
 *
 * GitHub returns at most 100 repositories per page, so this walks pages until
 * it runs out of results or hits MAX_PAGES.
 */
export async function listRepositories(accessToken: string): Promise<GitHubRepository[]> {
  const repositories: GitHubRepository[] = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const batch = await githubFetch<GitHubRepository[]>(
      `/user/repos?sort=updated&per_page=${PER_PAGE}&page=${page}`,
      accessToken,
    );

    repositories.push(...batch);

    if (batch.length < PER_PAGE) break;
  }

  return repositories;
}
