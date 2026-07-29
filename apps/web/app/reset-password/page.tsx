import Card from "@/components/ui/Card";
import Alert from "@/components/ui/Alert";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
      <Card className="max-w-md">
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">
          Reset your password
        </h1>
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <Alert>This reset link is missing its token. Request a new one from the forgot-password page.</Alert>
        )}
      </Card>
    </div>
  );
}
