import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { collections, conversions } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";
import HistoryList from "@/components/workspace/HistoryList";

export const metadata = {
  title: "History | FileForge",
};

export default async function HistoryPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/history");
  }

  const [items, userCollections] = await Promise.all([
    db
      .select({
        id: conversions.id,
        originalFilename: conversions.originalFilename,
        sourceFormat: conversions.sourceFormat,
        targetFormat: conversions.targetFormat,
        createdAt: conversions.createdAt,
        collectionId: conversions.collectionId,
        collectionName: collections.name,
      })
      .from(conversions)
      .leftJoin(collections, eq(collections.id, conversions.collectionId))
      .where(eq(conversions.userId, user.id))
      .orderBy(desc(conversions.createdAt))
      .limit(50),
    db
      .select({ id: collections.id, name: collections.name })
      .from(collections)
      .where(eq(collections.userId, user.id))
      .orderBy(desc(collections.createdAt)),
  ]);

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
        <HistoryList
          items={items.map((i) => ({
            id: i.id,
            originalFilename: i.originalFilename,
            sourceFormat: i.sourceFormat,
            targetFormat: i.targetFormat,
            createdAt: i.createdAt.toISOString(),
            collectionId: i.collectionId,
            collectionName: i.collectionName,
          }))}
          collections={userCollections}
        />
      )}
    </WorkspaceShell>
  );
}
