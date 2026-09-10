import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { FileText } from "lucide-react";
import { db } from "@/lib/db/client";
import { conversions } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { relativeTime } from "@/lib/dashboard/stats";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";

export const metadata = {
  title: "History | FileForge",
};

export default async function HistoryPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/history");
  }

  const items = await db
    .select()
    .from(conversions)
    .where(eq(conversions.userId, user.id))
    .orderBy(desc(conversions.createdAt))
    .limit(50);

  return (
    <WorkspaceShell
      title="History"
      subtitle="Files aren't stored, only what was converted and when."
      action={
        <Link
          href="/convert"
          className="rounded-xl bg-ember px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ember-deep"
        >
          New conversion
        </Link>
      }
    >
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface-elevated px-6 py-16 text-center">
          <p className="font-display text-lg font-bold text-ink">No conversions yet</p>
          <p className="mt-2 text-sm text-ink-muted">
            Convert a file and it will show up here.
          </p>
          <Link
            href="/convert"
            className="mt-6 inline-flex rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-steel-soft"
          >
            Open the converter
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface-elevated">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <p className="text-sm font-semibold text-ink">All conversions</p>
            <span className="text-xs text-ink-muted">
              {items.length === 50 ? "Last 50" : `${items.length} total`}
            </span>
          </div>
          <ul className="divide-y divide-line">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-5 py-3.5">
                <FileText className="h-4 w-4 shrink-0 text-ember" strokeWidth={1.7} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">{item.originalFilename}</p>
                  <p className="text-xs text-ink-muted">
                    {relativeTime(new Date(item.createdAt))}
                  </p>
                </div>
                <span className="shrink-0 rounded-md bg-ember-soft px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide text-ember-deep">
                  {item.sourceFormat} → {item.targetFormat}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </WorkspaceShell>
  );
}
