import Link from "next/link";
import { redirect } from "next/navigation";
import { FolderOpen } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";

export const metadata = {
  title: "Collections | FileForge",
};

export default async function CollectionsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/collections");
  }

  return (
    <WorkspaceShell
      title="Collections"
      subtitle="Group related files and reuse the same output settings across a batch."
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
          <FolderOpen className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <p className="mt-4 font-display text-lg font-bold text-ink">Collections are coming</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">
          Batch a set of files under one collection and convert them the same
          way. This ships as the product grows, alongside the API.
        </p>
        <Link
          href="/#pricing"
          className="mt-6 inline-flex rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-steel-soft"
        >
          See what&apos;s on the roadmap
        </Link>
      </div>
    </WorkspaceShell>
  );
}
