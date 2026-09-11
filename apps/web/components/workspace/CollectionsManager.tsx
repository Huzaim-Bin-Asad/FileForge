"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderOpen, MoreHorizontal, Plus } from "lucide-react";
import Modal from "@/components/ui/Modal";

interface Collection {
  id: string;
  name: string;
  itemCount: number;
  createdAt: string;
}

export default function CollectionsManager({ initial }: { initial: Collection[] }) {
  const router = useRouter();
  const [collections] = useState(initial);
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<Collection | null>(null);
  const [deleting, setDeleting] = useState<Collection | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName("");
    setError(null);
    setBusy(false);
  }

  async function create() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      setError((await res.json().catch(() => ({})))?.error ?? "Something went wrong.");
      setBusy(false);
      return;
    }
    setCreating(false);
    reset();
    router.refresh();
  }

  async function rename() {
    if (!renaming) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/collections/${renaming.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      setError((await res.json().catch(() => ({})))?.error ?? "Something went wrong.");
      setBusy(false);
      return;
    }
    setRenaming(null);
    reset();
    router.refresh();
  }

  async function remove() {
    if (!deleting) return;
    setBusy(true);
    await fetch(`/api/collections/${deleting.id}`, { method: "DELETE" });
    setDeleting(null);
    reset();
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => {
            reset();
            setCreating(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-ember px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ember-deep"
        >
          <Plus className="h-4 w-4" strokeWidth={2.4} />
          New collection
        </button>
      </div>

      {collections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface-elevated px-6 py-16 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-ember-soft text-ember">
            <FolderOpen className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <p className="mt-4 font-display text-lg font-bold text-ink">No collections yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">
            Create a collection, then file conversions into it from the converter
            or your history.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c) => (
            <div
              key={c.id}
              className="relative rounded-2xl border border-line bg-surface-elevated p-5 transition hover:border-ember/30"
            >
              <div className="flex items-start justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-ember-soft text-ember">
                  <FolderOpen className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <div className="relative">
                  <button
                    onClick={() => setMenuFor(menuFor === c.id ? null : c.id)}
                    aria-label="Collection actions"
                    className="rounded-lg p-1.5 text-ink-muted transition hover:bg-surface hover:text-ink"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {menuFor === c.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} />
                      <div className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-xl border border-line bg-surface-elevated py-1 shadow-lg">
                        <button
                          onClick={() => {
                            setMenuFor(null);
                            reset();
                            setName(c.name);
                            setRenaming(c);
                          }}
                          className="block w-full px-3 py-2 text-left text-sm text-ink hover:bg-surface"
                        >
                          Rename
                        </button>
                        <button
                          onClick={() => {
                            setMenuFor(null);
                            setDeleting(c);
                          }}
                          className="block w-full px-3 py-2 text-left text-sm text-danger hover:bg-danger-soft"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <Link href={`/collections/${c.id}`} className="mt-3 block">
                <p className="truncate font-display text-sm font-bold text-ink">{c.name}</p>
                <p className="mt-1 text-xs text-ink-muted">
                  {c.itemCount} {c.itemCount === 1 ? "conversion" : "conversions"}
                </p>
              </Link>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="New collection"
        size="sm"
      >
        <NameForm
          value={name}
          onChange={setName}
          onSubmit={create}
          busy={busy}
          error={error}
          submitLabel="Create"
        />
      </Modal>

      <Modal
        open={!!renaming}
        onClose={() => setRenaming(null)}
        title="Rename collection"
        size="sm"
      >
        <NameForm
          value={name}
          onChange={setName}
          onSubmit={rename}
          busy={busy}
          error={error}
          submitLabel="Save"
        />
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete collection"
        size="sm"
      >
        <p className="text-sm text-ink-muted">
          Delete <span className="font-medium text-ink">{deleting?.name}</span>? The
          conversions inside stay in your history, they&apos;re just un-filed.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={() => setDeleting(null)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-ink-muted transition hover:text-ink"
          >
            Cancel
          </button>
          <button
            onClick={remove}
            disabled={busy}
            className="rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}

function NameForm({
  value,
  onChange,
  onSubmit,
  busy,
  error,
  submitLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  busy: boolean;
  error: string | null;
  submitLabel: string;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Q3 Reports"
        maxLength={60}
        className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink transition focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/15"
      />
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          disabled={busy || !value.trim()}
          className="rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-white transition hover:bg-ember-deep disabled:opacity-50"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
