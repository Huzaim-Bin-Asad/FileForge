import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { apiKeys } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { maskApiKey } from "@/lib/apiKeys";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";
import ApiKeysManager from "@/components/workspace/ApiKeysManager";

export const metadata = {
  title: "API Keys | FileForge",
};

/**
 * Minimal hand-rolled syntax coloring for the curl examples below — same
 * three hues components/site/ApiSection.tsx uses for its JSON snippet, so
 * the app's two code blocks read as one visual language rather than two.
 */
function Cmd({ children }: { children: React.ReactNode }) {
  return <span className="text-[#7ddea8]">{children}</span>;
}
function Flag({ children }: { children: React.ReactNode }) {
  return <span className="text-[#ff9a6b]">{children}</span>;
}
function Str({ children }: { children: React.ReactNode }) {
  return <span className="text-[#ffd38a]">{children}</span>;
}
function Comment({ children }: { children: React.ReactNode }) {
  return <span className="text-white/40">{children}</span>;
}

export default async function ApiKeysPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/api-keys");
  }

  const rows = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      createdAt: apiKeys.createdAt,
      lastUsedAt: apiKeys.lastUsedAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, user.id))
    .orderBy(desc(apiKeys.createdAt));

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  const keys = rows.map((r) => ({
    id: r.id,
    name: r.name,
    masked: maskApiKey(r.keyPrefix),
    createdAt: r.createdAt.toISOString(),
    lastUsedAt: r.lastUsedAt ? r.lastUsedAt.toISOString() : null,
  }));

  return (
    <WorkspaceShell
      title="API Keys"
      subtitle="Use a key to call the conversion API from your own app or script."
    >
      <div className="flex flex-col gap-6">
        <ApiKeysManager keys={keys} />

        <div className="rounded-2xl border border-line bg-surface-elevated p-5">
          <p className="text-sm font-semibold text-ink">Using it from another app</p>
          <p className="mt-1.5 text-sm text-ink-muted">
            Send the file as multipart form data with your key in the{" "}
            <code className="rounded bg-surface px-1 py-0.5 font-mono text-[13px]">
              Authorization
            </code>{" "}
            header. Conversions run asynchronously: this returns a job id right
            away, and you poll it until the job finishes.
          </p>

          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            1. Submit the file
          </p>
          <pre className="mt-2 overflow-x-auto rounded-xl bg-ink px-4 py-3.5 text-xs leading-relaxed text-white/85">
            <code>
              <Cmd>curl</Cmd> {appUrl}/api/v1/convert \{"\n"}
              {"  "}
              <Flag>-H</Flag> <Str>&quot;Authorization: Bearer ff_live_...&quot;</Str> \{"\n"}
              {"  "}
              <Flag>-F</Flag> <Str>&quot;file=@report.pdf&quot;</Str> \{"\n"}
              {"  "}
              <Flag>-F</Flag> <Str>&quot;conversionType=pdf-word&quot;</Str>
              {"\n"}
              <Comment># → {`{ "job_id": "2f9b1c...", "status": "queued" }`}</Comment>
            </code>
          </pre>

          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            2. Poll until it&apos;s done
          </p>
          <pre className="mt-2 overflow-x-auto rounded-xl bg-ink px-4 py-3.5 text-xs leading-relaxed text-white/85">
            <code>
              <Cmd>curl</Cmd> {appUrl}/api/v1/jobs/2f9b1c... \{"\n"}
              {"  "}
              <Flag>-H</Flag> <Str>&quot;Authorization: Bearer ff_live_...&quot;</Str>
              {"\n"}
              <Comment>
                # → {`{ "status": "completed", "conversion_id": "8a1c..." }`}
              </Comment>
            </code>
          </pre>

          <p className="mt-3 text-xs text-ink-muted">
            <code className="rounded bg-surface px-1 py-0.5 font-mono text-[12px]">
              conversionType
            </code>{" "}
            is a format pair, e.g. <code className="font-mono">pdf-word</code>,{" "}
            <code className="font-mono">pdf-excel</code>, <code className="font-mono">pdf-powerpoint</code>,{" "}
            <code className="font-mono">pdf-html</code>, <code className="font-mono">pdf-markdown</code>,{" "}
            <code className="font-mono">word-markdown</code>, <code className="font-mono">epub-pdf</code>,{" "}
            <code className="font-mono">txt-pdf</code> — the direction is inferred from the uploaded
            file&apos;s extension. Conversions made this way show up in your account&apos;s history too,
            where you can download the result once it&apos;s ready.
          </p>
        </div>
      </div>
    </WorkspaceShell>
  );
}
