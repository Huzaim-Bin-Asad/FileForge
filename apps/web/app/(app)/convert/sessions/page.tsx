import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { listSessions } from "@/lib/convertSessions";
import SessionList from "@/components/convert/SessionList";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";

export const metadata = {
  title: "Convert sessions | FileForge",
};

export default async function ConvertSessionsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/convert/sessions");

  const sessions = await listSessions(user.id, { limit: 100 });

  return (
    <WorkspaceShell
      title="Sessions"
      subtitle="Each Convert tab is its own session. Pick one up where you left off."
    >
      <section className="rounded-2xl border border-line bg-surface-elevated p-3">
        {sessions.length === 0 ? (
          <p className="p-3 text-sm text-ink-muted">
            No sessions yet — convert a file and it&apos;ll be listed here.
          </p>
        ) : (
          <SessionList sessions={sessions} />
        )}
      </section>
    </WorkspaceShell>
  );
}
