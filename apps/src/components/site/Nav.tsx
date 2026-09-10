import { useEffect, useState } from "react";
import { Menu, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { label: "Features", href: "#features" },
  { label: "Tools", href: "#tools" },
  { label: "API", href: "#api" },
  { label: "Pricing", href: "#pricing" },
  { label: "Docs", href: "#faq" },
];

export function Logo() {
  return (
    <a href="#top" className="group flex items-center gap-2.5">
      <span className="bg-brand glow grid h-9 w-9 place-items-center rounded-xl">
        <Zap className="h-4.5 w-4.5 text-primary-foreground" strokeWidth={2.2} />
      </span>
      <span className="font-display text-lg font-semibold tracking-tight">FileForge</span>
    </a>
  );
}

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={cn(
          "mx-auto flex max-w-7xl items-center gap-4 px-5 transition-all duration-500 sm:px-8",
          scrolled ? "py-3" : "py-5",
        )}
      >
        <div
          className={cn(
            "grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-full px-4 py-2.5 transition-all duration-500 lg:grid-cols-[auto_1fr_auto]",
            scrolled ? "glass gradient-border" : "border border-transparent",
          )}
        >
          <div className="flex min-w-0 items-center">
            <Logo />
          </div>

          <nav className="hidden items-center justify-center gap-1 lg:flex">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <a
              href="#pricing"
              className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign In
            </a>
            <a
              href="#upload"
              className="bg-brand animate-gradient-pan rounded-full px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-300 hover:shadow-[var(--shadow-glow)]"
            >
              Get Started
            </a>
          </div>

          <button
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="glass-soft grid h-10 w-10 shrink-0 place-items-center rounded-full lg:hidden"
          >
            {open ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="animate-rise mx-5 sm:mx-8 lg:hidden">
          <div className="glass gradient-border flex flex-col gap-1 rounded-3xl p-3">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#upload"
              onClick={() => setOpen(false)}
              className="bg-brand mt-1 rounded-2xl px-4 py-3 text-center text-sm font-medium text-primary-foreground"
            >
              Get Started
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}
