import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";
import { getSessionUser } from "@/lib/auth/session";

export const metadata = {
  title: "Log in | FileForge",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; challenge?: string }>;
}) {
  const { next, error, challenge } = await searchParams;

  // A `challenge` means Google already passed (see google/callback/route.ts)
  // and 2FA is what's left — getSessionUser() is correctly still null here
  // (no session exists until the code is verified), so this redirect only
  // ever fires for an actual signed-in visit, never mid-challenge.
  const user = await getSessionUser();
  if (user) {
    // Same validation LoginForm itself uses post-login — an open `next`
    // must still only ever point back into this app.
    redirect(next && next.startsWith("/") ? next : "/dashboard");
  }

  return (
    <AuthShell
      title={challenge ? "Verify it's you" : "Welcome back"}
      subtitle={
        challenge
          ? "Enter your two-factor code to finish signing in."
          : "Log in to keep conversion history and manage your account."
      }
    >
      <LoginForm next={next} error={error} challenge={challenge} />
    </AuthShell>
  );
}
