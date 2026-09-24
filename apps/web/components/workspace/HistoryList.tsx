"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Download, FileText, FolderInput, FolderMinus, Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { relativeTime } from "@/lib/dashboard/stats";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

interface Item {
  id: string;
  originalFilename: string;
  sourceFormat: string;
  targetFormat: string;
  createdAt: string;
  collectionId: string | null;
  collectionName: string | null;
  hasFile: boolean;
}

interface CollectionRef {
  id: string;
  name: string;
}

export default function HistoryList({
  items,
  collections,
}: {
  items: Item[];
  collections: CollectionRef[];
}) {
  const router = useRouter();
  const [moving, setMoving] = useState<Item | null>(null);
  const [busy, setBusy] = useState(false);
  // Which row is in flight, so only that one shows a spinner — "move(null)"
  // is a real request (remove from collection), so a sentinel string tells
  // it apart from "nothing pending", which null alone can't do here.
  const [pendingId, setPendingId] = useState<string | null>(null);
  const REMOVE = "__remove__";

  async function move(collectionId: string | null) {
    if (!moving) return;
    setBusy(true);
    setPendingId(collectionId ?? REMOVE);
    const res = await fetch(`/api/conversions/${moving.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collectionId }),
    });
    setBusy(false);
    setPendingId(null);

    if (!res.ok) {
      toast.error("Couldn't update the collection. Try again.");
      return; // Leave the modal open so the user can retry.
    }

    setMoving(null);
    router.refresh();
    toast.success(
      collectionId
        ? `Moved to ${collections.find((c) => c.id === collectionId)?.name ?? "collection"}`
        : "Removed from collection"
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface-elevated">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <p className="text-sm font-semibold text-ink">All conversions</p>
        <span className="text-xs text-ink-muted">
          {items.length === 50 ? "Last 50" : `${items.length} total`}
        </span>
      </div>
      <ul className="divide-y divide-line">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 px-5 py-3.5">
            <FileText className="h-4 w-4 shrink-0 text-ember" strokeWidth={1.7} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-ink">{item.originalFilename}</p>
              <p className="flex items-center gap-2 text-xs text-ink-muted">
                {relativeTime(new Date(item.createdAt))}
                {item.collectionName && (
                  <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-medium text-ink-muted">
                    {item.collectionName}
                  </span>
                )}
              </p>
            </div>

            {item.hasFile && (
              <a
                href={`/api/conversions/${item.id}/download`}
                aria-label="Download"
                className="rounded-lg p-1.5 text-ink-muted transition hover:bg-surface hover:text-ink"
              >
                <Download className="h-4 w-4" />
              </a>
            )}

            {collections.length > 0 && (
              <button
                onClick={() => setMoving(item)}
                aria-label="Move to collection"
                className="rounded-lg p-1.5 text-ink-muted transition hover:bg-surface hover:text-ink"
              >
                <FolderInput className="h-4 w-4" />
              </button>
            )}

            <span className="shrink-0 rounded-md bg-ember-soft px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide text-ember-deep">
              {item.sourceFormat} → {item.targetFormat}
            </span>
          </li>
        ))}
      </ul>

      <Modal
        open={!!moving}
        onClose={() => setMoving(null)}
        title="Move to collection"
        description={moving?.originalFilename}
        size="sm"
      >
        <div className="flex flex-col gap-1">
          {collections.map((c) => {
            const active = moving?.collectionId === c.id;
            const pending = pendingId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => move(c.id)}
                disabled={busy}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition disabled:opacity-50",
                  active ? "bg-ember-soft font-medium text-ember-deep" : "text-ink hover:bg-surface"
                )}
              >
                {c.name}
                {pending ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" strokeWidth={2} />
                ) : (
                  active && <Check className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                )}
              </button>
            );
          })}
        </div>

        {/* Only relevant when the file is actually filed somewhere — no
            redundant "not in a collection" row otherwise. */}
        {moving?.collectionId !== null && (
          <div className="mt-2 border-t border-line pt-2">
            <button
              onClick={() => move(null)}
              disabled={busy}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-ink-muted transition hover:bg-danger-soft hover:text-danger disabled:opacity-50"
            >
              {pendingId === REMOVE ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" strokeWidth={2} />
              ) : (
                <FolderMinus className="h-4 w-4 shrink-0" strokeWidth={1.8} />
              )}
              Remove from collection
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
