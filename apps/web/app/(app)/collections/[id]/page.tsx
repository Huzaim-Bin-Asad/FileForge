import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { ChevronLeft, Download, FileText } from "lucide-react";
import { db } from "@/lib/db/client";
import { collections, conversions } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { relativeTime } from "@/lib/dashboard/stats";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";

export const metadata = {
  title: "Collection | FileForge",
};

type Params = { params: Promise<{ id: string }> };

export default async function CollectionDetailPage({ params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/collections");
  }
  const { id } = await params;

  const [collection] = await db
    .select()
    .from(collections)
    .where(and(eq(collections.id, id), eq(collections.userId, user.id)))
    .limit(1);

  if (!collection) {
    notFound();
  }

  const items = await db
    .select({
      id: conversions.id,
      originalFilename: conversions.originalFilename,
      sourceFormat: conversions.sourceFormat,
      targetFormat: conversions.targetFormat,
      createdAt: conversions.createdAt,
      mimeType: conversions.mimeType,
    })
    .from(conversions)
    .where(eq(conversions.collectionId, id))
    .orderBy(desc(conversions.createdAt))
    .limit(100);

  return (
    <WorkspaceShell
      title={collection.name}
      subtitle={`${items.length} ${items.length === 1 ? "conversion" : "conversions"}`}
      action={
        <Link
          href="/collections"
          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface-elevated px-3.5 py-2 text-sm font-medium text-ink transition hover:bg-surface"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          All collections
        </Link>
      }
    >
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface-elevated px-6 py-16 text-center">
          <p className="font-display text-lg font-bold text-ink">Nothing here yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">
            Move an item into this collection from your history.
          </p>
          <Link
            href="/history"
            className="mt-6 inline-flex rounded-xl bg-ember px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ember-deep"
          >
            Go to history
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface-elevated">
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
                {item.mimeType && (
                  <a
                    href={`/api/conversions/${item.id}/download`}
                    aria-label="Download"
                    className="shrink-0 rounded-lg p-1.5 text-ink-muted transition hover:bg-surface hover:text-ink"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </WorkspaceShell>
  );
}
