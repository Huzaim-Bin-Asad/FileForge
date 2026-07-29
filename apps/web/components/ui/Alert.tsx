import { ReactNode } from "react";

interface AlertProps {
  variant?: "error" | "success";
  children: ReactNode;
}

const VARIANT_CLASSES: Record<NonNullable<AlertProps["variant"]>, string> = {
  error: "border-red-200 bg-red-50 text-red-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export default function Alert({ variant = "error", children }: AlertProps) {
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${VARIANT_CLASSES[variant]}`}>
      {children}
    </div>
  );
}
