import Card from "@/components/ui/Card";
import SignupForm from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
      <Card className="max-w-md">
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">
          Create your account
        </h1>
        <SignupForm />
      </Card>
    </div>
  );
}
