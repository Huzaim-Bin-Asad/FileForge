"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldOff } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";
import { toast } from "@/lib/toast";

type Stage = "idle" | "setup" | "codes" | "disable";

export default function TwoFactorSettings({
  enabled,
  hasPassword,
}: {
  enabled: boolean;
  hasPassword: boolean;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function reset() {
    setStage("idle");
    setSecret("");
    setCode("");
    setPassword("");
    setDisableCode("");
    setError(null);
  }

  async function startSetup() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/account/2fa/setup", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't start setup.");
        return;
      }
      setSecret(data.secret);
      setStage("setup");
    } finally {
      setLoading(false);
    }
  }

  async function confirmSetup(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/account/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setBackupCodes(data.backupCodes);
      setStage("codes");
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/account/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: hasPassword ? password : undefined,
          code: disableCode || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      toast.success("Two-factor authentication turned off");
      reset();
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function finishCodes() {
    reset();
    toast.success("Two-factor authentication is on");
    router.refresh();
  }

  if (stage === "codes") {
    return (
      <div className="space-y-4">
        <Alert variant="success">
          Two-factor authentication is on. Save these backup codes somewhere
          safe — each works once, and they won&apos;t be shown again.
        </Alert>
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-line bg-surface p-4 font-mono text-sm text-ink sm:grid-cols-4">
          {backupCodes.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
        <Button onClick={finishCodes}>Done</Button>
      </div>
    );
  }

  if (stage === "setup") {
    return (
      <form onSubmit={confirmSetup} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <p className="text-sm text-ink-muted">
          In your authenticator app (Google Authenticator, 1Password, Authy,
          etc.), add a new account and enter this code manually:
        </p>
        <p className="rounded-xl border border-line bg-surface px-4 py-3 text-center font-mono text-lg tracking-widest text-ink">
          {secret}
        </p>
        <Input
          label="6-digit code"
          autoComplete="one-time-code"
          inputMode="numeric"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
        <div className="flex gap-3">
          <Button type="submit" loading={loading}>
            Turn on
          </Button>
          <Button type="button" variant="secondary" onClick={reset}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  if (stage === "disable") {
    return (
      <form onSubmit={handleDisable} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        {hasPassword ? (
          <Input
            label="Confirm your password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        ) : (
          <Input
            label="Authentication or backup code"
            value={disableCode}
            onChange={(e) => setDisableCode(e.target.value)}
            required
          />
        )}
        <div className="flex gap-3">
          <Button type="submit" variant="danger" loading={loading}>
            Turn off
          </Button>
          <Button type="button" variant="secondary" onClick={reset}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {enabled ? (
          <ShieldCheck className="h-5 w-5 shrink-0 text-success" />
        ) : (
          <ShieldOff className="h-5 w-5 shrink-0 text-ink-muted" />
        )}
        <div>
          <p className="text-sm font-medium text-ink">
            {enabled ? "Two-factor authentication is on" : "Two-factor authentication is off"}
          </p>
          <p className="text-xs text-ink-muted">
            {enabled
              ? "A code from your authenticator app is required at sign-in."
              : "Add a code from an authenticator app as a second step at sign-in."}
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant={enabled ? "secondary" : "primary"}
        onClick={() => (enabled ? setStage("disable") : startSetup())}
        loading={loading}
      >
        {enabled ? "Turn off" : "Turn on"}
      </Button>
    </div>
  );
}
