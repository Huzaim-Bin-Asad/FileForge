"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";

/** Same confirm-then-submit shape as DeleteAccountForm, but reversible. */
export default function DeactivateAccountForm({ hasPassword }: { hasPassword: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/account/deactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hasPassword ? { password } : { confirmation }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (!confirming) {
    return (
      <Button variant="secondary" onClick={() => setConfirming(true)}>
        Deactivate account
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert>{error}</Alert>}
      <Alert>
        You&apos;ll be signed out on every device and your API keys will stop
        working. Your files and settings are kept — sign in again any time to
        reactivate.
      </Alert>
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
          label="Type DEACTIVATE to confirm"
          autoComplete="off"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          required
        />
      )}
      <div className="flex gap-3">
        <Button type="submit" variant="danger" loading={loading}>
          Deactivate
        </Button>
        <Button type="button" variant="secondary" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
