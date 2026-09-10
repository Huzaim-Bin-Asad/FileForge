"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: 0 | 1 | 2 | 3 | 4 | 5;
  variant?: "up" | "left" | "right" | "scale" | "fade";
  /** When true, skip hide/show so nested interactive UI always works. */
  static?: boolean;
}

export default function Reveal({
  children,
  className,
  delay = 0,
  variant = "up",
  static: isStatic = false,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStatic) {
      setVisible(true);
      return;
    }
    const node = ref.current;
    if (!node) return;

    setMounted(true);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isStatic]);

  return (
    <div
      ref={ref}
      className={cn(
        !isStatic && mounted && "reveal",
        !isStatic && mounted && `reveal-${variant}`,
        !isStatic && mounted && visible && "is-visible",
        delay > 0 && `reveal-delay-${delay}`,
        className
      )}
    >
      {children}
    </div>
  );
}
