import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Log in | FileForge",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to keep conversion history and manage your account."
    >
      <LoginForm next={next} error={error} />
    </AuthShell>
  );
}
