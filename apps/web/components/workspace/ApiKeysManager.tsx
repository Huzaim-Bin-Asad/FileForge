"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, KeyRound, Plus, Trash2, TriangleAlert } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { relativeTime } from "@/lib/dashboard/stats";

interface ApiKey {
  id: string;
  name: string;
  masked: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export default function ApiKeysManager({ keys }: { keys: ApiKey[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<ApiKey | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function create() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.error ?? "Something went wrong.");
      setBusy(false);
      return;
    }
    setBusy(false);
    setCreating(false);
    setName("");
    setNewSecret(data.secret);
    router.refresh();
  }

  async function remove() {
    if (!deleting) return;
    setBusy(true);
    await fetch(`/api/keys/${deleting.id}`, { method: "DELETE" });
    setBusy(false);
    setDeleting(null);
    router.refresh();
  }

  async function copySecret() {
    if (!newSecret) return;
    try {
      await navigator.clipboard.writeText(newSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => {
            setName("");
            setError(null);
            setCreating(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-ember px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ember-deep"
        >
          <Plus className="h-4 w-4" strokeWidth={2.4} />
          Generate key
        </button>
      </div>

      {keys.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface-elevated px-6 py-16 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-ember-soft text-ember">
            <KeyRound className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <p className="mt-4 font-display text-lg font-bold text-ink">No keys yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">
            Generate a key to have it ready for when the API ships. You&apos;ll see
            the full value once.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface-elevated">
          <ul className="divide-y divide-line">
            {keys.map((k) => (
              <li key={k.id} className="flex items-center gap-4 px-5 py-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface text-ink-muted">
                  <KeyRound className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{k.name}</p>
                  <p className="truncate font-mono text-xs text-ink-muted">{k.masked}</p>
                </div>
                <span className="hidden shrink-0 text-xs text-ink-muted sm:block">
                  {k.lastUsedAt
                    ? `Used ${relativeTime(new Date(k.lastUsedAt))}`
                    : `Created ${relativeTime(new Date(k.createdAt))}`}
                </span>
                <button
                  onClick={() => setDeleting(k)}
                  aria-label="Revoke key"
                  className="shrink-0 rounded-lg p-1.5 text-ink-muted transition hover:bg-danger-soft hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* create */}
      <Modal open={creating} onClose={() => setCreating(false)} title="Generate API key" size="sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create();
          }}
        >
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Production server"
            maxLength={60}
            className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink transition focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/15"
          />
          {error && <p className="mt-2 text-sm text-danger">{error}</p>}
          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={busy || !name.trim()}
              className="rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-white transition hover:bg-ember-deep disabled:opacity-50"
            >
              Generate
            </button>
          </div>
        </form>
      </Modal>

      {/* show secret once */}
      <Modal
        open={!!newSecret}
        onClose={() => setNewSecret(null)}
        title="Copy your API key"
        description="This is the only time it's shown."
        size="md"
      >
        <div className="flex items-start gap-2 rounded-xl border border-gold/30 bg-gold/10 px-3 py-2.5 text-xs text-ink">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
          Store it somewhere safe now. FileForge only keeps a hash.
        </div>
        <div className="mt-3 flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-lg bg-surface px-3 py-2.5 font-mono text-xs text-ink">
            {newSecret}
          </code>
          <button
            onClick={copySecret}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 py-2.5 text-xs font-medium text-ink transition hover:border-ember/40"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-ember" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Copy
              </>
            )}
          </button>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            onClick={() => setNewSecret(null)}
            className="rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-white transition hover:bg-ember-deep"
          >
            Done
          </button>
        </div>
      </Modal>

      {/* delete */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Revoke API key" size="sm">
        <p className="text-sm text-ink-muted">
          Revoke <span className="font-medium text-ink">{deleting?.name}</span>? Any
          integration using it will stop working. This can&apos;t be undone.
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
            Revoke
          </button>
        </div>
      </Modal>
    </div>
  );
}
