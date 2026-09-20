"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ArrowLeftRight,
  ChevronDown,
  FolderOpen,
  History,
  KeyRound,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CONVERSION_PAIRS } from "@/lib/converters/catalog";

const nav = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/history", label: "History", Icon: History },
  { href: "/collections", label: "Collections", Icon: FolderOpen },
  { href: "/api-keys", label: "API Keys", Icon: KeyRound },
  { href: "/profile", label: "Settings", Icon: Settings },
];

const CONVERTER_TYPES = CONVERSION_PAIRS.map((pair) => ({
  type: pair.type,
  label: `${pair.labels[pair.extensions[0]]} ↔ ${pair.labels[pair.extensions[1]]}`,
}));

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Desktop: fixed left rail. */
export function WorkspaceSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onConverter = pathname === "/convert";
  const activeType = searchParams.get("type");
  const [expanded, setExpanded] = useState(onConverter);

  return (
    <aside className="hidden w-56 shrink-0 flex-col gap-0.5 border-r border-line bg-surface-elevated p-3 lg:flex">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
          onConverter && !activeType
            ? "bg-ember-soft font-medium text-ember-deep"
            : "text-ink-muted hover:bg-surface hover:text-ink"
        )}
      >
        <ArrowLeftRight className="h-4 w-4 shrink-0" strokeWidth={1.8} />
        <span className="flex-1 text-left">Converter</span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 shrink-0 transition-transform", expanded && "rotate-180")}
        />
      </button>

      {expanded && (
        <div className="mb-1 ml-3.5 flex flex-col gap-0.5 border-l border-line pl-3">
          <Link
            href="/convert"
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-xs transition-colors",
              onConverter && !activeType
                ? "font-medium text-ember-deep"
                : "text-ink-muted hover:text-ink"
            )}
          >
            All formats
          </Link>
          {CONVERTER_TYPES.map(({ type, label }) => (
            <Link
              key={type}
              href={`/convert?type=${type}`}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                onConverter && activeType === type
                  ? "font-medium text-ember-deep"
                  : "text-ink-muted hover:text-ink"
              )}
            >
              {label}
            </Link>
          ))}
        </div>
      )}

      {nav.map(({ href, label, Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-ember-soft font-medium text-ember-deep"
                : "text-ink-muted hover:bg-surface hover:text-ink"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
            {label}
          </Link>
        );
      })}
    </aside>
  );
}

const mobileNav = [
  { href: "/convert", label: "Converter", Icon: ArrowLeftRight },
  ...nav,
];

/** Mobile: horizontal scroll tabs under the top bar. */
export function WorkspaceTabs() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-line bg-surface-elevated px-3 py-2 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {mobileNav.map(({ href, label, Icon }) => {
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
