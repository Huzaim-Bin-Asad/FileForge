import type { ReactNode } from "react";

/**
 * Page header for a workspace page. The surrounding chrome (top bar, sidebar,
 * container) lives in app/(app)/layout.tsx — this is just the title row plus
 * the page's content.
 */
export default function WorkspaceShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1.5 max-w-lg text-sm text-ink-muted">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </header>
      <div className="mt-6 sm:mt-8">{children}</div>
    </div>
  );
}
