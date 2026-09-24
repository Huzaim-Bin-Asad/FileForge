import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import SignupForm from "@/components/auth/SignupForm";
import { getSessionUser } from "@/lib/auth/session";

export const metadata = {
  title: "Sign up | FileForge",
};

export default async function SignupPage() {
  const user = await getSessionUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Sign up with Google or email, then convert with history saved."
    >
      <SignupForm />
    </AuthShell>
  );
}
