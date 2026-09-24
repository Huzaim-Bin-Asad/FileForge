import { getSessionUser } from "@/lib/auth/session";
import WorkspaceTopbar from "@/components/workspace/WorkspaceTopbar";
import { WorkspaceSidebar, WorkspaceTabs } from "@/components/workspace/WorkspaceNav";
import Toaster from "@/components/ui/Toaster";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return (
    <div className="flex min-h-screen flex-col bg-surface">
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
