import type { ReactNode } from "react";
import Link from "next/link";
import {
  FolderOpen,
  History,
  KeyRound,
  LayoutDashboard,
  Settings,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { id: "dashboard", href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "history", href: "/history", label: "History", Icon: History },
  { id: "collections", href: "/collections", label: "Collections", Icon: FolderOpen },
  { id: "api-keys", href: "/api-keys", label: "API Keys", Icon: KeyRound },
  { id: "settings", href: "/profile", label: "Settings", Icon: Settings },
] as const;

export type WorkspaceTab = (typeof nav)[number]["id"];

export default function WorkspaceShell({
  active,
  title,
  subtitle,
  action,
  children,
}: {
  active: WorkspaceTab;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="bg-forge flex-1">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-10 sm:px-6 sm:py-14 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10 lg:py-16">
        <aside className="hidden flex-col gap-0.5 lg:flex">
          <div className="mb-3 flex items-center gap-2.5 px-2 py-1">
            <span className="bg-brand grid h-9 w-9 place-items-center rounded-xl text-white">
              <Zap className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <span className="font-display text-sm font-bold text-ink">Workspace</span>
          </div>
          {nav.map(({ id, href, label, Icon }) => (
            <Link
              key={id}
              href={href}
              aria-current={active === id}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                active === id
                  ? "bg-ember-soft font-medium text-ink"
                  : "text-ink-muted hover:bg-surface-elevated hover:text-ink"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.7} />
              <span>{label}</span>
            </Link>
          ))}
        </aside>

        <div className="min-w-0">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {nav.map(({ id, href, label, Icon }) => (
              <Link
                key={id}
                href={href}
                aria-current={active === id}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  active === id
                    ? "bg-ember-soft text-ember-deep"
                    : "bg-surface-elevated text-ink-muted hover:text-ink"
                )}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.7} />
                {label}
              </Link>
            ))}
          </div>

          <header className="mt-4 flex flex-wrap items-end justify-between gap-4 lg:mt-0">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-2 max-w-lg text-sm text-ink-muted">{subtitle}</p>
              ) : null}
            </div>
            {action}
          </header>

          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
