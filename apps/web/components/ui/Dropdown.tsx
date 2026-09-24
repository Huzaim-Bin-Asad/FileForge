"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  /** Shown on the trigger when `value` matches no option (e.g. "" for "no filter"). */
  placeholder: string;
  /** Visually hidden — announced to screen readers, since the trigger itself carries no visible label. */
  label: string;
  id?: string;
  className?: string;
}

/**
 * A single-select dropdown styled to match the app's inputs, opening in a
 * panel anchored directly under its trigger — used in place of a native
 * `<select>` wherever the option list needs custom rendering (e.g. a check
 * mark on the selected row) or is likely to grow beyond a plain list.
 * Generic and self-contained, so any page can import it.
 */
export default function Dropdown({
  value,
  onChange,
  options,
  placeholder,
  label,
  id,
  className,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const generatedId = useId();
  const baseId = id ?? generatedId;

  const selectedIndex = useMemo(
    () => options.findIndex((o) => o.value === value),
    [options, value]
  );
  const selectedLabel = selectedIndex >= 0 ? options[selectedIndex]!.label : placeholder;

  function close(refocus: boolean) {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  }

  function openAt(index: number) {
    setActiveIndex(Math.max(0, Math.min(index, options.length - 1)));
    setOpen(true);
  }

  // Outside click and Escape both dismiss it — the standard behavior for
  // any floating panel, so a stray click elsewhere never leaves it stuck open.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) close(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close(true);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  function handleTriggerKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openAt(selectedIndex >= 0 ? selectedIndex : 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      openAt(options.length - 1);
    }
  }

  function handleListKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, options.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (options[activeIndex]) onChange(options[activeIndex]!.value);
        close(true);
        break;
      case "Tab":
        close(false);
        break;
    }
  }

  return (
    <div ref={rootRef} className={cn("relative inline-block", className)}>
      <span id={`${baseId}-label`} className="sr-only">
        {label}
      </span>
      <button
        ref={buttonRef}
        type="button"
        id={baseId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${baseId}-label ${baseId}`}
        onClick={() => (open ? close(false) : openAt(selectedIndex >= 0 ? selectedIndex : 0))}
        onKeyDown={handleTriggerKeyDown}
        className="inline-flex w-full items-center justify-between gap-2 rounded-xl border border-line bg-surface-elevated px-3.5 py-3 text-xs font-medium text-ink transition hover:bg-steel-soft focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/15"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-ink-muted transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={`${baseId}-label`}
          aria-activedescendant={options[activeIndex] ? `${baseId}-option-${activeIndex}` : undefined}
          onKeyDown={handleListKeyDown}
          className="absolute left-0 top-[calc(100%+6px)] z-30 w-max min-w-full rounded-xl border border-line bg-surface-elevated py-1.5 shadow-lg outline-none"
        >
          {options.map((o, i) => {
            const selected = o.value === value;
            return (
              <li
                key={o.value}
                id={`${baseId}-option-${i}`}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => {
                  onChange(o.value);
                  close(true);
                }}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 px-3.5 py-2.5 text-xs transition-colors",
                  i === activeIndex
                    ? "bg-ember-soft text-ember-deep"
                    : "text-ink hover:bg-surface"
                )}
              >
                <span className="truncate">{o.label}</span>
                {selected ? <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} /> : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
