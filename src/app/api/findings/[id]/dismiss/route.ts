import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Marks a finding as dismissed (or restores it) for the owning user. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const finding = await prisma.reviewFinding.findFirst({
    where: { id, pullRequest: { repository: { ownerId: user.id } } },
    select: { id: true, isDismissed: true },
  });

  if (!finding) {
    return NextResponse.json({ error: "Finding not found" }, { status: 404 });
  }

  let dismissed = !finding.isDismissed;

  try {
    const body = (await request.json()) as { dismissed?: unknown };
    if (typeof body.dismissed === "boolean") dismissed = body.dismissed;
  } catch {
    // No body means "toggle".
  }

  const updated = await prisma.reviewFinding.update({
    where: { id: finding.id },
    data: { isDismissed: dismissed },
    select: { id: true, isDismissed: true },
  });

  return NextResponse.json(updated);
}
