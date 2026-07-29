import Card from "@/components/ui/Card";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
      <Card className="max-w-md">
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-900">
          Forgot your password?
        </h1>
        <p className="mb-6 text-sm text-slate-500">
          Enter your email and we&apos;ll send you a link to reset it.
        </p>
        <ForgotPasswordForm />
      </Card>
    </div>
  );
}
