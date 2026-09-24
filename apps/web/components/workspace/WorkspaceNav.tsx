"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  History,
  KeyRound,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/convert", label: "Convert", Icon: ArrowLeftRight },
  { href: "/history", label: "History", Icon: History },
  { href: "/collections", label: "Collections", Icon: FolderOpen },
  { href: "/api-keys", label: "API Keys", Icon: KeyRound },
  { href: "/profile", label: "Settings", Icon: Settings },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Desktop: fixed left rail, collapsible to an icon-only strip. */
export function WorkspaceSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 flex-col border-r border-line bg-surface-elevated transition-[width] duration-200 ease-out lg:flex",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className={cn("flex items-center p-3", collapsed ? "justify-center" : "justify-end")}>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink-muted shadow-sm transition hover:bg-steel-soft hover:text-ink"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          ) : (
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          )}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden px-3 pb-5">
        {nav.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3.5 rounded-xl py-3 text-[15px] transition-colors",
                collapsed ? "justify-center px-0" : "px-4",
                active
                  ? "bg-ember-soft font-semibold text-ember-deep"
                  : "text-ink-muted hover:bg-surface hover:text-ink"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

/** Mobile: horizontal scroll tabs under the top bar. */
export function WorkspaceTabs() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-line bg-surface-elevated px-3 py-2 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {nav.map(({ href, label, Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-ember-soft text-ember-deep"
                : "text-ink-muted hover:text-ink"
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
