import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { apiKeys } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { maskApiKey } from "@/lib/apiKeys";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";
import ApiKeysManager from "@/components/workspace/ApiKeysManager";

export const metadata = {
  title: "API Keys | FileForge",
};

export default async function ApiKeysPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/api-keys");
  }

  const rows = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      createdAt: apiKeys.createdAt,
      lastUsedAt: apiKeys.lastUsedAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, user.id))
    .orderBy(desc(apiKeys.createdAt));

  const keys = rows.map((r) => ({
    id: r.id,
    name: r.name,
    masked: maskApiKey(r.keyPrefix),
    createdAt: r.createdAt.toISOString(),
    lastUsedAt: r.lastUsedAt ? r.lastUsedAt.toISOString() : null,
  }));

  return (
    <WorkspaceShell
      title="API Keys"
      subtitle="Generate keys now so your integration is ready. The convert endpoint is still in development."
    >
      <ApiKeysManager keys={keys} />
    </WorkspaceShell>
  );
}
