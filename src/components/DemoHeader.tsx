import Link from "next/link";

import { Brand } from "@/components/AppHeader";
import { SignInLink } from "@/components/AuthButtons";

export function DemoHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#04070e]/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3.5">
        <div className="flex items-center gap-3">
          <Brand />
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
            Demo
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="hidden text-xs text-slate-400 transition-colors hover:text-slate-200 sm:block"
          >
            Back to app
          </Link>
          <SignInLink />
        </div>
      </div>
      <div className="accent-line h-px w-full" />
    </header>
  );
}
