"use client";

import { InputHTMLAttributes, useId } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function Input({ label, error, id, className = "", ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div>
      <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={inputId}
        className={cn(
          "w-full rounded-md border bg-surface-elevated px-4 py-3 text-ink shadow-sm transition placeholder:text-ink-muted/60 focus:outline-none focus:ring-2",
          error
            ? "border-danger focus:border-danger focus:ring-danger/15"
            : "border-line focus:border-ember focus:ring-ember/15",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  );
}
