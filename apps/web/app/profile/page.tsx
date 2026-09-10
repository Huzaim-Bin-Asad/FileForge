import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import Card from "@/components/ui/Card";
import ChangePasswordForm from "@/components/auth/ChangePasswordForm";
import DeleteAccountForm from "@/components/auth/DeleteAccountForm";

export const metadata = {
  title: "Profile | FileForge",
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
    <div className="bg-forge flex-1">
      <div className="mx-auto w-full max-w-2xl px-6 py-14 sm:py-20">
        <p className="font-mono text-xs font-medium tracking-[0.18em] text-ember uppercase">
          Account
        </p>
        <h1 className="font-display mt-2 text-4xl font-bold tracking-tight text-ink">
          Profile
        </h1>
        <p className="mt-2 text-ink-muted">{user.email}</p>

        <div className="mt-8 flex flex-wrap gap-2">
          {hasPassword && (
            <span className="bg-steel-soft px-3 py-1 text-xs font-medium text-steel">
              Email & password
            </span>
          )}
          {isGoogle && (
            <span className="bg-ember-soft px-3 py-1 text-xs font-medium text-ember-deep">
              Google connected
            </span>
          )}
        </div>

        <div className="mt-10 space-y-6">
          {hasPassword ? (
            <Card>
              <h2 className="font-display mb-1 text-lg font-bold text-ink">
                Change password
              </h2>
              <p className="mb-5 text-sm text-ink-muted">
                Updating your password signs you out everywhere.
              </p>
              <ChangePasswordForm />
            </Card>
          ) : (
            <Card>
              <h2 className="font-display mb-1 text-lg font-bold text-ink">
                Password
              </h2>
              <p className="text-sm text-ink-muted">
                This account signs in with Google and doesn&apos;t have a
                password. Use Continue with Google on the login page.
              </p>
            </Card>
          )}

          <Card className="border-danger/20">
            <h2 className="font-display mb-1 text-lg font-bold text-ink">
              Danger zone
            </h2>
            <p className="mb-5 text-sm text-ink-muted">
              Permanently delete your account and conversion history.
            </p>
            <DeleteAccountForm hasPassword={hasPassword} />
          </Card>
        </div>
      </div>
    </div>
  );
}
