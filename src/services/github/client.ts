const GITHUB_API = "https://api.github.com";

export class GitHubError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "GitHubError";
    this.status = status;
  }
}

export async function githubFetch<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `GitHub request failed with status ${response.status}`;

    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // Keep the status-based message when GitHub returns a non-JSON body.
    }

    throw new GitHubError(message, response.status);
  }

  return (await response.json()) as T;
}
