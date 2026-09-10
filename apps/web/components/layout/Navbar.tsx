"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth/session";
import Logo from "@/components/layout/Logo";

const links = [
  { label: "How it works", href: "/#workflow" },
  { label: "Tools", href: "/#tools" },
  { label: "API", href: "/#api" },
  { label: "Pricing", href: "/#pricing" },
];

interface NavbarProps {
  user: SessionUser | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    setMenuOpen(false);
    setOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-6 sm:py-3.5">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-ink-muted transition hover:bg-steel-soft hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-ink transition hover:bg-steel-soft"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-ember-soft font-semibold text-ember-deep">
                  {user.email[0]!.toUpperCase()}
                </span>
                <span className="max-w-[140px] truncate">{user.email}</span>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden border border-line bg-surface-elevated py-1 shadow-lg">
                    <Link
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-ink hover:bg-surface"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/convert"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-ink hover:bg-surface"
                    >
                      Convert
                    </Link>
                    <Link
                      href="/history"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-ink hover:bg-surface"
                    >
                      History
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-ink hover:bg-surface"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full px-4 py-2.5 text-left text-sm text-danger hover:bg-danger-soft"
                    >
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-3 py-2 text-sm font-medium text-ink-muted transition hover:text-ink"
              >
                Log in
              </Link>
              <Link
                href="/convert"
                className="bg-brand rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md shadow-ember/20 transition hover:opacity-95"
              >
                Convert
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "grid h-10 w-10 place-items-center rounded-md text-ink md:hidden",
            open && "bg-steel-soft"
          )}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-line bg-surface-elevated px-5 py-4 sm:px-6 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-sm font-medium text-ink transition active:bg-steel-soft"
              >
                {l.label}
              </Link>
            ))}
            <div className="my-2 h-px bg-line" />
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setOpen(false)} className="rounded-md px-3 py-2.5 text-sm font-medium text-ink">
                  Dashboard
                </Link>
                <Link href="/convert" onClick={() => setOpen(false)} className="rounded-md px-3 py-2.5 text-sm font-medium text-ink">
                  Convert
                </Link>
                <Link href="/history" onClick={() => setOpen(false)} className="rounded-md px-3 py-2.5 text-sm font-medium text-ink">
                  History
                </Link>
                <Link href="/profile" onClick={() => setOpen(false)} className="rounded-md px-3 py-2.5 text-sm font-medium text-ink">
                  Profile
                </Link>
                <button onClick={handleLogout} className="rounded-md px-3 py-2.5 text-left text-sm font-medium text-danger">
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="rounded-md px-3 py-2.5 text-sm font-medium text-ink">
                  Log in
                </Link>
                <Link href="/signup" onClick={() => setOpen(false)} className="rounded-md px-3 py-2.5 text-sm font-medium text-ember">
                  Sign up
                </Link>
                <Link href="/convert" onClick={() => setOpen(false)} className="mt-1 rounded-md bg-ember px-3 py-2.5 text-center text-sm font-semibold text-white">
                  Convert
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
