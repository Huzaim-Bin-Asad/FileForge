"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";
import { toast } from "@/lib/toast";

/**
 * New email -> (password, if the account has one) -> emailed code.
 *
 * The new-email and password fields are deliberately on separate steps: a
 * form holding an email field followed by a password field is exactly what
 * browsers' password managers detect as a login form, so they autofilled
 * the saved sign-in email into "New email" and the password alongside it
 * on page load. The password step instead carries a hidden username field
 * with the *current* email, the pattern password managers use to match a
 * re-authentication prompt to the right saved credential.
 */
export default function EmailChangeForm({
  hasPassword,
  currentEmail,
}: {
  hasPassword: boolean;
  currentEmail: string;
}) {
  const router = useRouter();
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "password" | "confirm">("email");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleEmailStep(e: FormEvent) {
    if (hasPassword) {
      e.preventDefault();
      setError(null);
      setStep("password");
      return;
    }
    return handleRequest(e);
  }

  async function handleRequest(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/account/email/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail, password: hasPassword ? password : undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setStep("confirm");
      toast.success(`Code sent to ${newEmail}`);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/account/email/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      toast.success("Email updated");
      setStep("email");
      setNewEmail("");
      setPassword("");
      setCode("");
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "confirm") {
    return (
      <form onSubmit={handleConfirm} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <p className="text-sm text-ink-muted">
          Enter the code we sent to <span className="font-medium text-ink">{newEmail}</span>.
        </p>
        <Input
          label="Verification code"
          autoComplete="one-time-code"
          inputMode="numeric"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
        <div className="flex gap-3">
          <Button type="submit" loading={loading}>
            Confirm
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setStep("email");
              setPassword("");
              setError(null);
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  if (step === "password") {
    return (
      <form onSubmit={handleRequest} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <p className="text-sm text-ink-muted">
          Confirm it&apos;s you to change your email to{" "}
          <span className="font-medium text-ink">{newEmail}</span>.
        </p>
        <input
          type="text"
          name="username"
          autoComplete="username"
          value={currentEmail}
          readOnly
          hidden
        />
        <Input
          label="Current password"
          type="password"
          name="current-password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          required
        />
        <div className="flex gap-3">
          <Button type="submit" loading={loading}>
            Send verification code
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setStep("email");
              setPassword("");
              setError(null);
            }}
          >
            Back
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleEmailStep} className="space-y-4">
      {error && <Alert>{error}</Alert>}
      <Input
        label="New email"
        type="email"
        name="new-email"
        autoComplete="off"
        value={newEmail}
        onChange={(e) => setNewEmail(e.target.value)}
        required
      />
      <Button type="submit" loading={loading}>
        {hasPassword ? "Continue" : "Send verification code"}
      </Button>
    </form>
  );
}
