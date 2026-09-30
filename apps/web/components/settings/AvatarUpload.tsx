"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";

export default function AvatarUpload({
  hasAvatar,
  displayName,
}: {
  hasAvatar: boolean;
  displayName: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  // The served URL never changes, so this is what actually busts the cache after a change.
  const [version, setVersion] = useState(0);
  const [visible, setVisible] = useState(hasAvatar);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/account/avatar", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't upload that image.");
        return;
      }
      setVersion((v) => v + 1);
      setVisible(true);
      toast.success("Photo updated");
      router.refresh();
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    setRemoving(true);
    try {
      const res = await fetch("/api/account/avatar", { method: "DELETE" });
      if (!res.ok) {
        toast.error("Couldn't remove your photo.");
        return;
      }
      setVisible(false);
      toast.success("Photo removed");
      router.refresh();
    } finally {
      setRemoving(false);
    }
  }

  const busy = uploading || removing;

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-16 w-16 shrink-0">
        {visible ? (
          // A private, session-authenticated route — next/image's optimizer
          // fetches server-side with no cookie, so it can't serve this.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={version}
            src={`/api/account/avatar?v=${version}`}
            alt=""
            className="h-16 w-16 rounded-2xl object-cover"
          />
        ) : (
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-ember-soft font-display text-2xl font-bold text-ember-deep">
            {displayName[0]!.toUpperCase()}
          </span>
        )}
        {busy && (
          <div className="absolute inset-0 grid place-items-center rounded-2xl bg-ink/40">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink transition hover:bg-steel-soft disabled:opacity-50"
        >
          <Camera className="h-3.5 w-3.5" />
          Change photo
        </button>
        {visible && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-ink-muted transition hover:text-danger disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
