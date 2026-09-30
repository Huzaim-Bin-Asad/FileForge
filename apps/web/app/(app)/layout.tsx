import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import type { AppearanceColors } from "@/lib/appearance";
import WorkspaceTopbar from "@/components/workspace/WorkspaceTopbar";
import { WorkspaceSidebar, WorkspaceTabs } from "@/components/workspace/WorkspaceNav";
import Toaster from "@/components/ui/Toaster";
import AppearanceProvider from "@/components/appearance/AppearanceProvider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  // The lightweight session check above only decodes the access-token
  // cookie — it doesn't carry the theme columns, so a real (small) query is
  // needed to apply a saved custom palette from the very first paint.
  let colors: AppearanceColors | null = null;
  if (user) {
    const [row] = await db
      .select({
        themeBackground: users.themeBackground,
        themeAccent: users.themeAccent,
        themeText: users.themeText,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    if (row?.themeBackground && row.themeAccent && row.themeText) {
      colors = { background: row.themeBackground, accent: row.themeAccent, text: row.themeText };
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {user ? <AppearanceProvider colors={colors} /> : null}
      <WorkspaceTopbar user={user} />
      {user ? <WorkspaceTabs /> : null}
      <div className="flex flex-1">
        {user ? <WorkspaceSidebar /> : null}
        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
            {children}
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
