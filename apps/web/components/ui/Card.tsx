import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export default function Card({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "w-full border border-line bg-surface-elevated p-8 shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
