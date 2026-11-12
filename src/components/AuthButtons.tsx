"use client";

import { signIn, signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

import { GitHubMark } from "@/components/icons";

export function SignInButton() {
  return (
    <button
      type="button"
      onClick={() => signIn("github", { callbackUrl: "/" })}
      className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-3 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-400"
    >
      <GitHubMark className="h-4 w-4" />
      Continue with GitHub
    </button>
  );
}

export function SignInLink() {
  return (
    <button
      type="button"
      onClick={() => signIn("github", { callbackUrl: "/" })}
      className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:border-emerald-400/40 hover:text-white"
    >
      <GitHubMark className="h-4 w-4" />
      Sign in
    </button>
  );
}

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:border-white/20 hover:text-slate-200"
    >
      <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
      Sign out
    </button>
  );
}
