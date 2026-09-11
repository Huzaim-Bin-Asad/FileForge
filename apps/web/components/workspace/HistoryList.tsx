"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, FileText, FolderInput } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { relativeTime } from "@/lib/dashboard/stats";

interface Item {
  id: string;
  originalFilename: string;
  sourceFormat: string;
  targetFormat: string;
  createdAt: string;
  collectionId: string | null;
  collectionName: string | null;
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

  async function move(collectionId: string | null) {
    if (!moving) return;
    setBusy(true);
    await fetch(`/api/conversions/${moving.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collectionId }),
    });
    setBusy(false);
    setMoving(null);
    router.refresh();
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
          <button
            onClick={() => move(null)}
            disabled={busy}
            className="flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-ink-muted transition hover:bg-surface disabled:opacity-50"
          >
            Not in a collection
            {moving?.collectionId === null && <Check className="h-4 w-4 text-ember" strokeWidth={2.5} />}
          </button>
          {collections.map((c) => (
            <button
              key={c.id}
              onClick={() => move(c.id)}
              disabled={busy}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-ink transition hover:bg-surface disabled:opacity-50"
            >
              {c.name}
              {moving?.collectionId === c.id && <Check className="h-4 w-4 text-ember" strokeWidth={2.5} />}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
