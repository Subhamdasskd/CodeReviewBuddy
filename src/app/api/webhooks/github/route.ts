import { NextResponse } from "next/server";

import { getGitHubToken } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { parsePullRequestEvent, verifySignature } from "@/services/github/webhook";
import { reviewStoredPullRequest } from "@/services/review/service";
import { syncPullRequestsForRepository } from "@/services/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GitHub webhook: reviews a pull request as soon as it is opened or updated.
 *
 * Configure the webhook with content type `application/json`, the events
 * "Pull requests", and a secret matching GITHUB_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "GITHUB_WEBHOOK_SECRET is not configured" },
      { status: 503 },
    );
  }

  const rawBody = await request.text();

  if (!verifySignature(rawBody, request.headers.get("x-hub-signature-256"), secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = request.headers.get("x-github-event");

  if (event === "ping") {
    return NextResponse.json({ ok: true });
  }

  if (event !== "pull_request") {
    return NextResponse.json({ ignored: true, reason: "not a pull_request event" });
  }

  let payload: unknown;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parsePullRequestEvent(payload);

  if (!parsed) {
    return NextResponse.json({ ignored: true, reason: "action not reviewable" });
  }

  const repository = await prisma.repository.findUnique({
    where: { githubRepoId: parsed.repositoryGithubId },
    select: { id: true, fullName: true, ownerId: true },
  });

  if (!repository) {
    return NextResponse.json({ ignored: true, reason: "repository not synced" });
  }

  const accessToken = await getGitHubToken(repository.ownerId);

  if (!accessToken) {
    return NextResponse.json(
      { error: "Repository owner has no usable GitHub token" },
      { status: 400 },
    );
  }

  try {
    await syncPullRequestsForRepository(accessToken, {
      id: repository.id,
      fullName: repository.fullName,
    });

    const pullRequest = await prisma.pullRequest.findUnique({
      where: {
        repositoryId_githubPrNumber: {
          repositoryId: repository.id,
          githubPrNumber: parsed.number,
        },
      },
      select: { id: true },
    });

    if (!pullRequest) {
      return NextResponse.json({ ignored: true, reason: "pull request not found" });
    }

    const result = await reviewStoredPullRequest(pullRequest.id, accessToken);

    return NextResponse.json({
      reviewed: true,
      pullRequestId: pullRequest.id,
      findings: result.summary.total,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Review failed" },
      { status: 502 },
    );
  }
}
