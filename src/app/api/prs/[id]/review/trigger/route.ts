import { NextResponse } from "next/server";

import { getGitHubToken, getSessionUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { reviewStoredPullRequest } from "@/services/review/service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Re-runs the review pipeline for one pull request. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const pullRequest = await prisma.pullRequest.findFirst({
    where: { id, repository: { ownerId: user.id } },
    select: { id: true },
  });

  if (!pullRequest) {
    return NextResponse.json({ error: "Pull request not found" }, { status: 404 });
  }

  const accessToken = await getGitHubToken(user.id);

  if (!accessToken) {
    return NextResponse.json(
      { error: "GitHub account is not linked. Sign in again with GitHub." },
      { status: 400 },
    );
  }

  try {
    const result = await reviewStoredPullRequest(pullRequest.id, accessToken);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Review failed" },
      { status: 502 },
    );
  }
}
