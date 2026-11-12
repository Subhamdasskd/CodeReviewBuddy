import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { decryptToken } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
};

/** Returns the local user for the current session, or null when signed out. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) return null;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, image: true },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email ?? email,
    name: user.name,
    image: user.image,
  };
}

/**
 * Returns the decrypted GitHub access token for a user.
 *
 * Returns null when the account is not linked or the stored token cannot be
 * decrypted (for example after NEXTAUTH_SECRET changes), which the UI surfaces
 * as "sign in again".
 */
export async function getGitHubToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "github" },
    select: { access_token: true },
  });

  if (!account?.access_token) return null;

  try {
    return decryptToken(account.access_token);
  } catch {
    return null;
  }
}
