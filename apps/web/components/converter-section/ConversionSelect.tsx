"use client";

import {
  CATEGORY_ICONS,
  CONVERSION_OPTIONS,
  type ConversionCategory,
} from "./conversions";

interface ConversionSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export default function ConversionSelect({ value, onChange }: ConversionSelectProps) {
  const categories = Array.from(
    new Set(CONVERSION_OPTIONS.map((option) => option.category))
  );

  return (
    <div>
      <label
        htmlFor="conversion-type"
        className="mb-2 block text-sm font-medium text-slate-700"
      >
        Conversion type
      </label>
      <div className="relative">
        <select
          id="conversion-type"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-3 pr-10 text-slate-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          {categories.map((category) => (
            <optgroup
              key={category}
              label={`${CATEGORY_ICONS[category as ConversionCategory]} ${category}`}
            >
              {CONVERSION_OPTIONS.filter(
                (option) => option.category === category
              ).map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={!option.supported}
                >
                  {option.label}
                  {!option.supported ? " — coming soon" : ""}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
}
