import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Section({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={cn("relative mx-auto w-full max-w-7xl px-5 py-24 sm:px-8 lg:py-32", className)}>
      {children}
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="glass-soft inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium tracking-widest text-muted-foreground uppercase">
      <span className="h-1.5 w-1.5 rounded-full bg-brand" />
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "center" | "left";
}) {
  return (
    <div className={cn("flex flex-col gap-5", align === "center" ? "items-center text-center" : "items-start")}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="font-display max-w-3xl text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">{subtitle}</p>
      ) : null}
    </div>
  );
}

export function GlassCard({
  className,
  children,
  hover = true,
}: {
  className?: string;
  children: ReactNode;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "glass gradient-border rounded-3xl",
        hover && "lift",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Blobs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="blob animate-blob top-[-12%] left-[-8%] h-[38rem] w-[38rem] bg-indigo" />
      <div
        className="blob animate-blob top-[14%] right-[-12%] h-[34rem] w-[34rem] bg-violet"
        style={{ animationDelay: "-6s" }}
      />
      <div
        className="blob animate-blob bottom-[-18%] left-[26%] h-[30rem] w-[30rem] bg-cyan"
        style={{ animationDelay: "-11s" }}
      />
    </div>
  );
}
