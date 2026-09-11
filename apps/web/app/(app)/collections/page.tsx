import { redirect } from "next/navigation";
import { count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { collections, conversions } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";
import CollectionsManager from "@/components/workspace/CollectionsManager";

export const metadata = {
  title: "Collections | FileForge",
};

export default async function CollectionsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/collections");
  }

  const rows = await db
    .select({
      id: collections.id,
      name: collections.name,
      createdAt: collections.createdAt,
      itemCount: count(conversions.id),
    })
    .from(collections)
    .leftJoin(conversions, eq(conversions.collectionId, collections.id))
    .where(eq(collections.userId, user.id))
    .groupBy(collections.id)
    .orderBy(desc(collections.createdAt));

  const list = rows.map((r) => ({
    id: r.id,
    name: r.name,
    itemCount: Number(r.itemCount),
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <WorkspaceShell
      title="Collections"
      subtitle="Group related conversions so they're easy to find later."
    >
      <CollectionsManager collections={list} />
    </WorkspaceShell>
  );
}
