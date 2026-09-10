import AuthShell from "@/components/auth/AuthShell";
import SignupForm from "@/components/auth/SignupForm";

export const metadata = {
  title: "Sign up | FileForge",
};

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Sign up with Google or email, then convert with history saved."
    >
      <SignupForm />
    </AuthShell>
  );
}
