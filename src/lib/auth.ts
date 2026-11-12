import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GithubProvider from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";
import { encryptToken } from "@/lib/crypto";
import { NextAuthOptions } from "next-auth";

/**
 * GitHub access tokens are encrypted before they are stored.
 *
 * `signIn` runs on every successful sign-in (refreshing the stored token) and
 * `linkAccount` covers the first time an account is linked.
 */
async function storeEncryptedToken(
  userId: string,
  provider: string,
  accessToken: string,
) {
  await prisma.account.updateMany({
    where: { userId, provider },
    data: { access_token: encryptToken(accessToken) },
  });
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,

      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
    }),
  ],

  session: {
    strategy: "database",
  },

  events: {
    async signIn({ user, account }) {
      if (account?.provider !== "github" || !account.access_token) return;
      await storeEncryptedToken(user.id, "github", account.access_token);
    },

    async linkAccount({ user, account }) {
      if (account.provider !== "github" || !account.access_token) return;
      await storeEncryptedToken(user.id, "github", account.access_token);
    },
  },
};
