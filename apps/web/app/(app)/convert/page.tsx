import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { collections } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { CONVERSION_PAIRS } from "@/lib/converters/catalog";
import ConvertPanel from "@/components/convert/ConvertPanel";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";

export const metadata = {
  title: "Convert | FileForge",
  description: "Convert PDF, Word, Excel, PowerPoint, Markdown, HTML and more.",
};

export default async function ConvertPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const pair = type ? CONVERSION_PAIRS.find((p) => p.type === type) : undefined;
  const user = await getSessionUser();

  const userCollections = user
    ? await db
        .select({ id: collections.id, name: collections.name })
        .from(collections)
        .where(eq(collections.userId, user.id))
        .orderBy(desc(collections.createdAt))
    : [];

  return (
    <WorkspaceShell
      title="Converter"
      subtitle={
        user
          ? "Converted files are saved to your history so you can re-download them later."
          : "Sign in to keep a history of what you converted and re-download it later."
      }
    >
      <div className="max-w-2xl">
        <ConvertPanel collections={userCollections} initialPair={pair} />
      </div>
    </WorkspaceShell>
  );
}
