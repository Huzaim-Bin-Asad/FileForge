import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import Card from "@/components/ui/Card";
import ChangePasswordForm from "@/components/auth/ChangePasswordForm";
import SetPasswordForm from "@/components/auth/SetPasswordForm";
import DeleteAccountForm from "@/components/auth/DeleteAccountForm";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";

export const metadata = {
  title: "Settings | FileForge",
};

export default async function ProfilePage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect("/login?next=/profile");
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, sessionUser.id))
    .limit(1);

  if (!user) {
    redirect("/login?next=/profile");
  }

  const hasPassword = Boolean(user.passwordHash);
  const isGoogle = Boolean(user.googleId);

  return (
    <WorkspaceShell title="Settings" subtitle={user.email}>
      <div className="flex flex-wrap gap-2">
        {hasPassword && (
          <span className="rounded-md bg-steel-soft px-3 py-1 text-xs font-medium text-steel">
            Email & password
          </span>
        )}
        {isGoogle && (
          <span className="rounded-md bg-ember-soft px-3 py-1 text-xs font-medium text-ember-deep">
            Google connected
          </span>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {hasPassword ? (
          <Card className="rounded-2xl p-6">
            <h2 className="font-display mb-1 text-base font-bold text-ink">
              Change password
            </h2>
            <p className="mb-5 text-sm text-ink-muted">
              Updating your password signs you out everywhere.
            </p>
            <ChangePasswordForm />
          </Card>
        ) : (
          <Card className="rounded-2xl p-6">
            <h2 className="font-display mb-1 text-base font-bold text-ink">
              Create a password
            </h2>
            <p className="mb-5 text-sm text-ink-muted">
              This account signs in with Google. Add a password to also sign in
              with your email address &mdash; Continue with Google keeps working.
            </p>
            <SetPasswordForm />
          </Card>
        )}

        <Card className="rounded-2xl border-danger/20 p-6">
          <h2 className="font-display mb-1 text-base font-bold text-ink">
            Danger zone
          </h2>
          <p className="mb-5 text-sm text-ink-muted">
            Permanently delete your account and conversion history.
          </p>
          <DeleteAccountForm hasPassword={hasPassword} />
        </Card>
      </div>
    </WorkspaceShell>
  );
}
