import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Returns one review finding, scoped to the signed-in user's repositories. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const finding = await prisma.reviewFinding.findFirst({
    where: { id, pullRequest: { repository: { ownerId: user.id } } },
    include: {
      pullRequest: {
        select: {
          id: true,
          githubPrNumber: true,
          title: true,
          repository: { select: { id: true, fullName: true } },
        },
      },
    },
  });

  if (!finding) {
    return NextResponse.json({ error: "Finding not found" }, { status: 404 });
  }

  return NextResponse.json(finding);
}
