import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import WorkspaceTopbar from "@/components/workspace/WorkspaceTopbar";
import { WorkspaceSidebar, WorkspaceTabs } from "@/components/workspace/WorkspaceNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    // Each page also guards with its own next-aware redirect; this is the fallback.
    redirect("/login?next=/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <WorkspaceTopbar email={user.email} />
      <WorkspaceTabs />
      <div className="flex flex-1">
        <WorkspaceSidebar />
        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
