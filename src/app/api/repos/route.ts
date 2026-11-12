import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Lists the repositories that have been synced for the signed-in user. */
export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const repositories = await prisma.repository.findMany({
    where: { ownerId: user.id },
    orderBy: [{ stars: "desc" }, { name: "asc" }],
    include: { _count: { select: { pullRequests: true } } },
  });

  return NextResponse.json(
    repositories.map((repository) => ({
      id: repository.id,
      name: repository.name,
      fullName: repository.fullName,
      description: repository.description,
      private: repository.private,
      primaryLanguage: repository.primaryLanguage,
      defaultBranch: repository.defaultBranch,
      stars: repository.stars,
      forks: repository.forks,
      pullRequestCount: repository._count.pullRequests,
      lastSyncedAt: repository.lastSyncedAt,
    })),
  );
}
