import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { collections } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import ConverterSection from "@/components/converter-section/ConverterSection";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";

export const metadata = {
  title: "Convert | FileForge",
  description: "Convert PDF, Word, Excel, PowerPoint, Markdown, HTML and more.",
};

export default async function ConvertPage() {
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
      subtitle="Files are processed inside FileForge and never uploaded to another service. Sign in to keep a history of what you converted."
    >
      <div className="max-w-2xl">
        <ConverterSection collections={userCollections} />
      </div>
    </WorkspaceShell>
  );
}
