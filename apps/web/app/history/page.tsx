import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { conversions } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";

export const metadata = {
  title: "History | FileForge",
};

export default async function HistoryPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/history");
  }

  const items = await db
    .select()
    .from(conversions)
    .where(eq(conversions.userId, user.id))
    .orderBy(desc(conversions.createdAt))
    .limit(50);

  return (
    <div className="bg-forge flex-1">
      <div className="mx-auto w-full max-w-3xl px-6 py-14 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-medium tracking-[0.18em] text-ember uppercase">
              Activity
            </p>
            <h1 className="font-display mt-2 text-4xl font-bold tracking-tight text-ink">
              Conversion history
            </h1>
            <p className="mt-2 max-w-lg text-sm text-ink-muted">
              Your last {items.length === 50 ? "50" : items.length} conversion
              {items.length === 1 ? "" : "s"}. Files aren&apos;t stored, only
              what was converted and when.
            </p>
          </div>
          <Link
            href="/convert"
            className="rounded-md bg-ember px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ember-deep"
          >
            New conversion
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="mt-10 border border-dashed border-line bg-surface-elevated px-6 py-16 text-center">
            <p className="font-display text-lg font-bold text-ink">No conversions yet</p>
            <p className="mt-2 text-sm text-ink-muted">
              Convert a file and it will show up here.
            </p>
            <Link
              href="/convert"
              className="mt-6 inline-flex rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:bg-steel-soft"
            >
              Open converter
            </Link>
          </div>
        ) : (
          <div className="mt-10 overflow-hidden border border-line bg-surface-elevated">
            <ul className="divide-y divide-line">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-4 px-6 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {item.originalFilename}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="shrink-0 bg-ember-soft px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wide text-ember-deep">
                    {item.sourceFormat} → {item.targetFormat}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
