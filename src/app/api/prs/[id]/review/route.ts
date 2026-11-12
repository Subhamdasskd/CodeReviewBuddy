import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { severityWeight } from "@/services/review/types";

export const dynamic = "force-dynamic";

/** Returns one pull request together with its stored review findings. */
export async function GET(
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
    include: {
      repository: { select: { id: true, fullName: true } },
      findings: true,
    },
  });

  if (!pullRequest) {
    return NextResponse.json({ error: "Pull request not found" }, { status: 404 });
  }

  const findings = pullRequest.findings.sort(
    (a, b) =>
      severityWeight(a.severity) - severityWeight(b.severity) ||
      (a.filePath ?? "").localeCompare(b.filePath ?? "") ||
      (a.lineStart ?? 0) - (b.lineStart ?? 0),
  );

  return NextResponse.json({
    pullRequest: {
      id: pullRequest.id,
      number: pullRequest.githubPrNumber,
      title: pullRequest.title,
      body: pullRequest.body,
      authorLogin: pullRequest.authorLogin,
      authorAvatar: pullRequest.authorAvatar,
      status: pullRequest.status,
      reviewStatus: pullRequest.reviewStatus,
      baseBranch: pullRequest.baseBranch,
      headBranch: pullRequest.headBranch,
      filesChanged: pullRequest.filesChanged,
      linesAdded: pullRequest.linesAdded,
      linesRemoved: pullRequest.linesRemoved,
      openedAt: pullRequest.openedAt,
      repository: pullRequest.repository,
    },
    findings,
  });
}
