import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { conversions } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import Card from "@/components/ui/Card";

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
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-900">
        Conversion history
      </h1>
      <p className="mb-8 text-sm text-slate-500">
        Your last {items.length === 50 ? "50" : items.length} conversion
        {items.length === 1 ? "" : "s"}. Files themselves aren&apos;t stored —
        only what was converted and when.
      </p>

      {items.length === 0 ? (
        <Card className="text-center text-sm text-slate-500">
          You haven&apos;t converted any files yet.
        </Card>
      ) : (
        <Card className="divide-y divide-slate-100 p-0">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 px-6 py-4"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  {item.originalFilename}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium uppercase text-indigo-700">
                {item.sourceFormat} → {item.targetFormat}
              </span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
