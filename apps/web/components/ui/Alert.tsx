import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AlertProps {
  variant?: "error" | "success";
  children: ReactNode;
}

const VARIANT_CLASSES: Record<NonNullable<AlertProps["variant"]>, string> = {
  error: "border-danger/20 bg-danger-soft text-danger",
  success: "border-success/20 bg-success-soft text-success",
};

export default function Alert({ variant = "error", children }: AlertProps) {
  return (
    <div className={cn("rounded-md border px-4 py-3 text-sm", VARIANT_CLASSES[variant])}>
      {children}
    </div>
  );
}
