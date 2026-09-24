import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Download } from "lucide-react";
import { db } from "@/lib/db/client";
import { collections, conversions } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { CONVERSION_PAIRS, getTargetsForExtension } from "@/lib/converters/catalog";
import { formatLabel } from "@/lib/dashboard/queries";
import { relativeTime } from "@/lib/dashboard/stats";
import ConvertPanel from "@/components/convert/ConvertPanel";
import FormatIcon from "@/components/convert/FormatIcon";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Convert | FileForge",
  description: "Convert PDF, Word, Excel, PowerPoint, Markdown, HTML and more.",
};

/** "PDF → Word, Excel, PowerPoint, …" — one row per input format, derived from the catalog. */
const SUPPORTED = Array.from(new Set(CONVERSION_PAIRS.flatMap((p) => p.extensions)))
  .map((ext) => ({
    ext,
    label: formatLabel(ext),
    targets: getTargetsForExtension(ext).map((t) => t.targetLabel),
  }))
  .sort((a, b) => b.targets.length - a.targets.length);

export default async function ConvertPage() {
  const user = await getSessionUser();

  const [userCollections, recent] = user
    ? await Promise.all([
        db
          .select({ id: collections.id, name: collections.name })
          .from(collections)
          .where(eq(collections.userId, user.id))
          .orderBy(desc(collections.createdAt)),
        db
          .select({
            id: conversions.id,
            originalFilename: conversions.originalFilename,
            sourceFormat: conversions.sourceFormat,
            targetFormat: conversions.targetFormat,
            createdAt: conversions.createdAt,
            mimeType: conversions.mimeType,
          })
          .from(conversions)
          .where(eq(conversions.userId, user.id))
          .orderBy(desc(conversions.createdAt))
          .limit(5),
      ])
    : [[], []];

  return (
    <WorkspaceShell
      title="Convert"
      subtitle={
        user
          ? "Drop a file — FileForge detects its type and offers what it can become. Results are saved to your history."
          : "Drop a file — FileForge detects its type and offers what it can become. Sign in to keep a history."
      }
    >
      <div className="flex flex-col gap-5">
        <ConvertPanel collections={userCollections} />

        {/* Signed out, there's only the formats list — no second column to pair it with. */}
        <div className={cn("grid items-start gap-5", user && "lg:grid-cols-2")}>
          <section className="rounded-2xl border border-line bg-surface-elevated p-5">
            <h2 className="text-sm font-semibold text-ink">Supported formats</h2>
            <dl className="mt-4 flex flex-col gap-3">
              {SUPPORTED.map((s) => (
                <div key={s.ext} className="flex items-center gap-3">
                  <dt className="flex w-24 shrink-0 items-center gap-2 text-xs font-semibold text-ink">
                    <FormatIcon ext={s.ext} size="xs" />
                    {s.label}
                  </dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {s.targets.map((t) => (
                      <span
                        key={t}
                        className="rounded-md bg-surface px-2 py-0.5 text-xs text-ink-muted"
                      >
                        {t}
                      </span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {user ? (
            <section className="rounded-2xl border border-line bg-surface-elevated p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-ink">Recent conversions</h2>
                <Link href="/history" className="text-xs font-medium text-ember-deep hover:underline">
                  View all
                </Link>
              </div>
              {recent.length === 0 ? (
                <p className="mt-4 text-sm text-ink-muted">Nothing yet — your first result will appear here.</p>
              ) : (
                <ul className="mt-4 divide-y divide-line">
                  {recent.map((r) => (
                    <li key={r.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                      <FormatIcon ext={r.targetFormat} size="xs" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-ink">{r.originalFilename}</p>
                        <p className="text-xs text-ink-muted">
                          {formatLabel(r.sourceFormat)} → {formatLabel(r.targetFormat)} ·{" "}
                          {relativeTime(r.createdAt)}
                        </p>
                      </div>
                      {r.mimeType !== null ? (
                        <a
                          href={`/api/conversions/${r.id}/download`}
                          aria-label={`Download ${r.originalFilename}`}
                          className="shrink-0 rounded-lg p-2 text-ink-muted transition hover:bg-surface hover:text-ink"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}
        </div>
      </div>
    </WorkspaceShell>
  );
}
