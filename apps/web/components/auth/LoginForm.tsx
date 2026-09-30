"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import Alert from "@/components/ui/Alert";
import GoogleButton from "@/components/auth/GoogleButton";

interface LoginFormProps {
  next?: string;
  error?: string;
  /** Set when Google sign-in already passed but the account has 2FA on — see google/callback/route.ts. Skips straight to the code step. */
  challenge?: string;
}

export default function LoginForm({ next, error: initialError, challenge }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [challengeToken, setChallengeToken] = useState<string | null>(challenge ?? null);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [loading, setLoading] = useState(false);
  const redirectTo = next && next.startsWith("/") ? next : "/dashboard";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      if (data.requires2fa) {
        setChallengeToken(data.challenge);
        return;
      }
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    if (!challengeToken) return;
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge: challengeToken, code }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (challengeToken) {
    return (
      <form onSubmit={handleVerify} className="space-y-5">
        {error && <Alert>{error}</Alert>}
        <Input
          label="Authentication code"
          autoComplete="one-time-code"
          inputMode="numeric"
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoFocus
          required
        />
        <p className="-mt-3 text-xs text-ink-muted">
          Enter the 6-digit code from your authenticator app, or one of your backup codes.
        </p>
        <Button type="submit" loading={loading} className="w-full">
          Verify
        </Button>
        <button
          type="button"
          onClick={() => {
            setChallengeToken(null);
            setCode("");
            setError(null);
          }}
          className="w-full text-center text-sm font-medium text-ink-muted hover:text-ink"
        >
          Back
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-5">
      <GoogleButton next={redirectTo} label="Continue with Google" />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">
          or email
        </span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <Alert>{error}</Alert>}
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <PasswordInput
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-ember hover:text-ember-deep"
          >
            Forgot password?
          </Link>
        </div>
        <Button type="submit" loading={loading} className="w-full">
          Log in
        </Button>
        <p className="text-center text-sm text-ink-muted">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-ember hover:text-ember-deep">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
