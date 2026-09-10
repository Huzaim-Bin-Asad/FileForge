import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Section({
  id,
  className,
  innerClassName,
  children,
}: {
  id?: string;
  className?: string;
  innerClassName?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative flex w-full flex-col justify-center lg:min-h-[100svh]",
        className
      )}
    >
      <div
        className={cn(
          "relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 py-16 sm:px-6 sm:py-20 md:py-24 lg:py-28",
          innerClassName
        )}
      >
        {children}
      </div>
    </section>
  );
}

export function SectionHeading({
  title,
  subtitle,
  align = "left",
  index,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "center" | "left";
  index?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:gap-4",
        align === "center" ? "items-center text-center" : "items-start"
      )}
    >
      {index ? (
        <p className="font-mono text-[11px] font-semibold tracking-[0.2em] text-ember uppercase sm:text-xs sm:tracking-[0.22em]">
          {index}
        </p>
      ) : null}
      <h2 className="font-display max-w-3xl text-[1.75rem] font-bold leading-tight tracking-tight text-ink sm:text-4xl sm:leading-tight lg:text-[3.25rem] lg:leading-[1.1]">
        {title}
      </h2>
      {subtitle ? (
        <p className="max-w-2xl text-[15px] leading-relaxed text-ink-muted sm:text-base lg:text-lg">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
