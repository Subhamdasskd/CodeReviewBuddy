import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Lists the pull requests stored for one repository. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const repository = await prisma.repository.findFirst({
    where: { id, ownerId: user.id },
    select: { id: true, fullName: true },
  });

  if (!repository) {
    return NextResponse.json({ error: "Repository not found" }, { status: 404 });
  }

  const pullRequests = await prisma.pullRequest.findMany({
    where: { repositoryId: repository.id },
    orderBy: { openedAt: "desc" },
    include: { _count: { select: { findings: { where: { isDismissed: false } } } } },
  });

  return NextResponse.json({
    repository,
    pullRequests: pullRequests.map((pullRequest) => ({
      id: pullRequest.id,
      number: pullRequest.githubPrNumber,
      title: pullRequest.title,
      authorLogin: pullRequest.authorLogin,
      authorAvatar: pullRequest.authorAvatar,
      status: pullRequest.status,
      reviewStatus: pullRequest.reviewStatus,
      filesChanged: pullRequest.filesChanged,
      linesAdded: pullRequest.linesAdded,
      linesRemoved: pullRequest.linesRemoved,
      baseBranch: pullRequest.baseBranch,
      headBranch: pullRequest.headBranch,
      openedAt: pullRequest.openedAt,
      findingCount: pullRequest._count.findings,
    })),
  });
}
