import AuthShell from "@/components/auth/AuthShell";
import Alert from "@/components/ui/Alert";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata = {
  title: "Reset password | FileForge",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Pick something strong, at least 8 characters."
    >
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <Alert>
          This reset link is missing its token. Request a new one from the
          forgot-password page.
        </Alert>
      )}
    </AuthShell>
  );
}
