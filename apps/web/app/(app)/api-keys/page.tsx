import Link from "next/link";
import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";

export const metadata = {
  title: "API Keys | FileForge",
};

export default async function ApiKeysPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/api-keys");
  }

  return (
    <WorkspaceShell
      title="API Keys"
      subtitle="Generate keys and wire FileForge into your own pipeline."
      action={
        <Link
          href="/convert"
          className="rounded-xl bg-ember px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ember-deep"
        >
          New conversion
        </Link>
      }
    >
      <div className="rounded-2xl border border-dashed border-line bg-surface-elevated px-6 py-16 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-ember-soft text-ember">
          <KeyRound className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <p className="mt-4 font-display text-lg font-bold text-ink">API keys are coming</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">
          Idempotency keys, rate limits scoped per key, and usage metering.
          Arrives alongside the API.
        </p>
        <Link
          href="/#api"
          className="mt-6 inline-flex rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-steel-soft"
        >
          Read about the API
        </Link>
      </div>
    </WorkspaceShell>
  );
}
