import { NextResponse } from "next/server";

import { getGitHubToken, getSessionUser } from "@/lib/api-auth";
import { GitHubError } from "@/services/github/client";
import { syncFromGitHub } from "@/services/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Imports the signed-in user's repositories and recent pull requests, then
 * reviews a few PRs that have not been analysed yet.
 */
export async function POST() {
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
    const result = await syncFromGitHub(user.id, accessToken);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof GitHubError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status === 401 ? 401 : 502 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 },
    );
  }
}
