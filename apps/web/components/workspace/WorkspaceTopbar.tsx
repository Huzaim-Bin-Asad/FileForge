"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";

export default function WorkspaceTopbar({ email }: { email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    setOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-surface-elevated px-4 sm:px-6">
      <Link href="/dashboard" className="inline-flex items-center">
        <Image
          src="/onlyLogo.png"
          alt="FileForge"
          width={44}
          height={44}
          priority
          className="h-8 w-8 object-contain"
        />
        <span className="font-display ml-2 text-sm font-bold text-ink">FileForge</span>
      </Link>

      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 text-sm text-ink transition hover:bg-surface"
        >
          <span className="grid h-7 w-7 place-items-center rounded-full bg-ember-soft text-xs font-semibold text-ember-deep">
            {email[0]?.toUpperCase()}
          </span>
          <span className="hidden max-w-[160px] truncate sm:inline">{email}</span>
          <ChevronDown className="h-3.5 w-3.5 text-ink-muted" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-line bg-surface-elevated py-1 shadow-lg">
              <p className="truncate px-4 py-2 text-xs text-ink-muted">{email}</p>
              <div className="my-1 h-px bg-line" />
              <Link
                href="/convert"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-ink hover:bg-surface"
              >
                Converter
              </Link>
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-ink hover:bg-surface"
              >
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-danger hover:bg-danger-soft"
              >
                <LogOut className="h-3.5 w-3.5" />
                Log out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
