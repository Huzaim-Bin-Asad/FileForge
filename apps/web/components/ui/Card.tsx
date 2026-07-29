import { HTMLAttributes } from "react";

export default function Card({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`w-full rounded-2xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
