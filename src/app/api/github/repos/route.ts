import { NextResponse } from "next/server";

import { getGitHubToken, getSessionUser } from "@/lib/api-auth";
import { GitHubError } from "@/services/github/client";
import { listRepositories } from "@/services/github/github.services";

export const dynamic = "force-dynamic";

/**
 * Lists repositories straight from GitHub for the signed-in user.
 *
 * Use POST /api/github/sync-repos to persist them locally.
 */
export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = await getGitHubToken(user.id);

  if (!accessToken) {
    return NextResponse.json(
      { error: "GitHub account is not linked. Sign in again with GitHub." },
      { status: 400 },
    );
  }

  try {
    const repositories = await listRepositories(accessToken);
    return NextResponse.json(repositories);
  } catch (error) {
    if (error instanceof GitHubError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status === 401 ? 401 : 502 },
      );
    }

    return NextResponse.json({ error: "Could not reach GitHub" }, { status: 502 });
  }
}
