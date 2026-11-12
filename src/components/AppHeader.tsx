import Image from "next/image";
import Link from "next/link";
import { Braces } from "lucide-react";

import { SignOutButton } from "@/components/AuthButtons";

export function Brand() {
  return (
    <Link href="/" className="group flex items-center gap-3">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 shadow-[0_0_26px_-8px_rgba(52,211,153,0.9)]">
        <span className="absolute inset-[1.5px] rounded-[10px] bg-[#05080f]/90" />
        <Braces
          className="relative h-4 w-4 text-emerald-300 transition-colors group-hover:text-emerald-200"
          aria-hidden="true"
        />
      </span>
      <div>
        <p className="text-sm font-semibold tracking-tight text-white">
          CodeReview Buddy
        </p>
        <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
          Engineering intelligence
        </p>
      </div>
    </Link>
  );
}

type AppHeaderProps = {
  user: {
    name: string | null;
    email: string;
    image: string | null;
  };
};

export function AppHeader({ user }: AppHeaderProps) {
  const displayName = user.name ?? user.email;

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#04070e]/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3.5">
        <Brand />

        <div className="flex items-center gap-3">
          {user.image ? (
            <Image
              src={user.image}
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 rounded-full border border-white/15 ring-2 ring-emerald-400/20"
            />
          ) : null}
          <div className="hidden text-right sm:block">
            <p className="text-xs font-semibold text-slate-100">{displayName}</p>
            <p className="text-[11px] text-slate-500">{user.email}</p>
          </div>
          <SignOutButton />
        </div>
      </div>
      <div className="accent-line h-px w-full" />
    </header>
  );
}
