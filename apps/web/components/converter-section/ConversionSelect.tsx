"use client";

import { useState } from "react";
import { ArrowLeftRight, Check, ChevronDown } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { CONVERSION_OPTIONS, getConversionOption } from "./conversions";

interface ConversionSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export default function ConversionSelect({ value, onChange }: ConversionSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = getConversionOption(value);

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-ink">Conversion type</label>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-surface-elevated px-4 py-3 text-left transition hover:border-ember/40"
      >
        <span className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-ember-soft text-ember">
            <ArrowLeftRight className="h-4 w-4" strokeWidth={2} />
          </span>
          <span className="flex items-center gap-1.5 font-medium text-ink">
            {selected?.from}
            <ArrowLeftRight className="h-3.5 w-3.5 text-ink-muted" strokeWidth={2} />
            {selected?.to}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-ink-muted" />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Choose a conversion"
        description="Every pair runs through the same converter."
        size="lg"
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {CONVERSION_OPTIONS.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex flex-col gap-1 rounded-xl border p-3.5 text-left transition ${
                  active
                    ? "border-ember bg-ember-soft/50"
                    : "border-line bg-surface hover:border-ember/40 hover:bg-surface-elevated"
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                    {option.from}
                    <ArrowLeftRight className="h-3.5 w-3.5 text-ink-muted" strokeWidth={2} />
                    {option.to}
                  </span>
                  {active && <Check className="h-4 w-4 shrink-0 text-ember" strokeWidth={2.5} />}
                </span>
                <span className="text-xs leading-relaxed text-ink-muted">{option.blurb}</span>
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
