import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import Card from "@/components/ui/Card";
import ChangePasswordForm from "@/components/auth/ChangePasswordForm";
import DeleteAccountForm from "@/components/auth/DeleteAccountForm";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/profile");
  }

  return (
    <div className="mx-auto w-full max-w-xl flex-1 space-y-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Profile</h1>
        <p className="text-sm text-slate-500">{user.email}</p>
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Change password</h2>
        <ChangePasswordForm />
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Danger zone</h2>
        <DeleteAccountForm />
      </Card>
    </div>
  );
}
