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
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  const user = await getSessionUser();
  if (user) {
    // Same validation LoginForm itself uses post-login — an open `next`
    // must still only ever point back into this app.
    redirect(next && next.startsWith("/") ? next : "/dashboard");
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to keep conversion history and manage your account."
    >
      <LoginForm next={next} error={error} />
    </AuthShell>
  );
}
