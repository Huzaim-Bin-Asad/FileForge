import { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="bg-forge relative flex flex-1">
      <div className="bg-grid absolute inset-0 opacity-50" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-stretch gap-10 px-6 py-16 lg:flex-row lg:items-center lg:py-20">
        <div className="flex-1 lg:pr-8">
          <h1 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 max-w-md text-ink-muted">{subtitle}</p>
          )}
          <ul className="mt-8 hidden space-y-3 text-sm text-ink-muted lg:block">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-ember" />
              Convert PDF, Word, Excel, PowerPoint, and more
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-ember" />
              Private in-app processing, no third-party uploads
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-ember" />
              Save conversion history when you sign in
            </li>
          </ul>
        </div>

        <div className="w-full max-w-md lg:ml-auto">
          <div className="border border-line bg-surface-elevated p-7 shadow-sm sm:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
