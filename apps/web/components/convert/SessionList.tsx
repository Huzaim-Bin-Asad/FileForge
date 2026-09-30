import Link from "next/link";
import { ChevronRight, Layers } from "lucide-react";
import type { SessionSummary } from "@/lib/convertSessions";
import { relativeTime } from "@/lib/dashboard/stats";
import { cn } from "@/lib/utils";

function sessionTitle(s: SessionSummary): string {
  if (!s.firstFilename) return "Untitled session";
  return s.attempts > 1 ? `${s.firstFilename} + ${s.attempts - 1} more` : s.firstFilename;
}

/** Links to /convert/{id} for each session — used on the convert page and /convert/sessions. */
export default function SessionList({
  sessions,
  compact = false,
}: {
  sessions: SessionSummary[];
  compact?: boolean;
}) {
  return (
    <ul className={cn("divide-y divide-line", compact ? "mt-4" : "")}>
      {sessions.map((s) => (
        <li key={s.id}>
          <Link
            href={`/convert/${s.id}`}
            className={cn(
              "group flex items-center gap-3 transition",
              compact ? "py-2.5" : "rounded-xl px-3 py-3 hover:bg-surface"
            )}
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface text-ink-muted">
              <Layers className="h-4 w-4" strokeWidth={1.8} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-ink group-hover:underline">{sessionTitle(s)}</p>
              <p className="text-xs text-ink-muted">
                {s.attempts} {s.attempts === 1 ? "conversion" : "conversions"}
                {s.completed < s.attempts ? ` · ${s.attempts - s.completed} failed` : ""} ·{" "}
                {relativeTime(s.updatedAt)}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" strokeWidth={1.8} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
