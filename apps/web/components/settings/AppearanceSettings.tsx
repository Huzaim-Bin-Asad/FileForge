"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Shuffle } from "lucide-react";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { toast } from "@/lib/toast";
import {
  PRESETS,
  applyAppearanceColors,
  applyThemeMode,
  contrastRatio,
  getStoredThemeMode,
  isValidHex,
  randomAppearanceColors,
  setThemeMode,
  type AppearanceColors,
  type AppearancePreset,
  type ThemeMode,
} from "@/lib/appearance";
import { cn } from "@/lib/utils";

function colorsEqual(a: AppearanceColors | null, b: AppearanceColors | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.background === b.background && a.accent === b.accent && a.text === b.text;
}

function PresetSwatch({ preset }: { preset: AppearancePreset }) {
  if (!preset.colors) {
    return (
      <span
        className={cn(
          "block h-8 w-8 rounded-full border border-line",
          preset.key === "dark" ? "bg-[#18140f]" : "bg-white"
        )}
      />
    );
  }
  const { background, accent, text } = preset.colors;
  return (
    <span
      className="block h-8 w-8 rounded-full border border-line"
      style={{
        background: `conic-gradient(${background} 0deg 120deg, ${accent} 120deg 240deg, ${text} 240deg 360deg)`,
      }}
    />
  );
}

const COLOR_FIELDS = ["background", "accent", "text"] as const;

/**
 * Presets, a random-palette generator, and a custom 3-color picker with a
 * contrast check — see lib/appearance.ts for how the colors map onto this
 * app's own tokens and why only three are customizable. Changes preview
 * live across the whole app immediately; nothing is persisted until Save,
 * and both Cancel and simply navigating away revert to the last saved state.
 *
 * The "last saved" value is kept in two places on purpose: `savedColors`
 * (state) is what render reads for the dirty-check and preset highlighting;
 * `savedColorsRef`/`savedThemeModeRef` (refs) are what the unmount cleanup
 * and Cancel read, updated in the same places state is so they never drift.
 * Refs alone would be simpler, but this repo's lint config forbids reading
 * a ref during render — only effects and event handlers may touch `.current`.
 */
export default function AppearanceSettings({
  initialColors,
}: {
  initialColors: AppearanceColors | null;
}) {
  const router = useRouter();

  const [draftColors, setDraftColors] = useState<AppearanceColors | null>(initialColors);
  const [savedColors, setSavedColors] = useState<AppearanceColors | null>(initialColors);
  const [themeMode, setThemeModeLocal] = useState<ThemeMode>("light");
  const [savedThemeMode, setSavedThemeMode] = useState<ThemeMode>("light");
  const [saving, setSaving] = useState(false);

  const savedColorsRef = useRef(initialColors);
  const savedThemeModeRef = useRef<ThemeMode>("light");

  // Theme mode is client-only (localStorage), so both server and the
  // client's first render use "light" — correcting it once here, after
  // mount, so it never disagrees with what the server actually sent. The
  // setState is deferred a tick (not called synchronously in the effect
  // body) — this repo's lint config flags that regardless of the effect's
  // dependency array; see the identical fix in components/ui/Toaster.tsx.
  useEffect(() => {
    const timer = setTimeout(() => {
      const mode = getStoredThemeMode();
      setThemeModeLocal(mode);
      setSavedThemeMode(mode);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // The actual "leaving without saving reverts" behavior: fires when this
  // tab unmounts (navigated away from, or the window closes) with an
  // unsaved preview still applied. Cancel below runs the same logic
  // on demand instead of waiting for unmount.
  //
  // The ref is seeded synchronously here, not left to the deferred effect
  // above: in dev, Strict Mode runs this cleanup immediately after mount,
  // and with the ref still at its "light" default that forced a dark-mode
  // user into light the moment they opened this tab.
  useEffect(() => {
    savedThemeModeRef.current = getStoredThemeMode();
    return () => {
      applyAppearanceColors(savedColorsRef.current);
      applyThemeMode(savedColorsRef.current ? "light" : savedThemeModeRef.current);
    };
  }, []);

  // A custom palette always implies light — see lib/appearance.ts.
  const draftEffectiveMode: ThemeMode = draftColors ? "light" : themeMode;
  const savedEffectiveMode: ThemeMode = savedColors ? "light" : savedThemeMode;
  const colorsDirty = !colorsEqual(draftColors, savedColors);
  const isDirty = colorsDirty || draftEffectiveMode !== savedEffectiveMode;

  /** Previews only — every choice, Light/Dark included, is persisted on Save. */
  function preview(colors: AppearanceColors | null, mode: ThemeMode) {
    setDraftColors(colors);
    setThemeModeLocal(mode);
    applyAppearanceColors(colors);
    applyThemeMode(colors ? "light" : mode);
  }

  function handleRandom() {
    preview(randomAppearanceColors(), "light");
  }

  function handleCustomChange(key: keyof AppearanceColors, value: string) {
    const base = draftColors ?? randomAppearanceColors();
    preview({ ...base, [key]: value }, "light");
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Colors live on the account; Light/Dark stays per-browser. Only hit
      // the server when the colors themselves changed.
      if (colorsDirty) {
        const res = await fetch("/api/account/appearance", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draftColors ?? { background: null, accent: null, text: null }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(data.error ?? "Couldn't save your appearance.");
          return;
        }
        setSavedColors(draftColors);
        savedColorsRef.current = draftColors;
      }
      setThemeMode(draftEffectiveMode);
      setThemeModeLocal(draftEffectiveMode);
      setSavedThemeMode(draftEffectiveMode);
      savedThemeModeRef.current = draftEffectiveMode;
      toast.success("Appearance saved");
      if (colorsDirty) router.refresh();
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setDraftColors(savedColors);
    setThemeModeLocal(savedThemeModeRef.current);
    applyAppearanceColors(savedColorsRef.current);
    applyThemeMode(savedColorsRef.current ? "light" : savedThemeModeRef.current);
  }

  const textContrast = draftColors ? contrastRatio(draftColors.text, draftColors.background) : null;
  const accentContrast = draftColors ? contrastRatio(draftColors.accent, draftColors.background) : null;

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-sm font-semibold text-ink">Presets</p>
        <div className="flex flex-wrap gap-4">
          {PRESETS.map((preset) => {
            const active = preset.colors
              ? colorsEqual(draftColors, preset.colors)
              : !draftColors && themeMode === preset.theme;
            return (
              <button
                key={preset.key}
                type="button"
                aria-pressed={active}
                onClick={() => preview(preset.colors, preset.theme)}
                className="flex flex-col items-center gap-1.5"
              >
                <span
                  className={cn(
                    "rounded-full p-0.5 ring-2 transition",
                    active ? "ring-ember" : "ring-transparent"
                  )}
                >
                  <PresetSwatch preset={preset} />
                </span>
                <span className="text-[11px] text-ink-muted">{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-line pt-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-ink">Custom</p>
          <Button type="button" variant="secondary" onClick={handleRandom}>
            <Shuffle className="h-3.5 w-3.5" />
            Random
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {COLOR_FIELDS.map((key) => (
            <div key={key}>
              <label className="mb-1.5 block text-xs font-medium capitalize text-ink-muted">
                {key}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label={`${key} color picker`}
                  value={draftColors?.[key] ?? "#ffffff"}
                  onChange={(e) => handleCustomChange(key, e.target.value)}
                  className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-line bg-transparent p-0.5"
                />
                <input
                  type="text"
                  aria-label={`${key} hex value`}
                  value={draftColors?.[key] ?? ""}
                  onChange={(e) => {
                    if (e.target.value === "" || isValidHex(e.target.value)) {
                      handleCustomChange(key, e.target.value);
                    }
                  }}
                  placeholder="#RRGGBB"
                  className="w-full rounded-lg border border-line bg-surface px-3 py-2 font-mono text-sm text-ink focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/15"
                />
              </div>
            </div>
          ))}
        </div>
        {textContrast !== null && textContrast < 4.5 && (
          <div className="mt-3">
            <Alert>
              Low contrast: text against background is {textContrast.toFixed(1)}:1 — WCAG
              recommends at least 4.5:1 for body text.
            </Alert>
          </div>
        )}
        {accentContrast !== null && accentContrast < 1.8 && (
          <div className="mt-3">
            <Alert>Low contrast: the accent color barely stands out against the background.</Alert>
          </div>
        )}
      </div>

      <div className="flex gap-3 border-t border-line pt-5">
        <Button type="button" onClick={handleSave} loading={saving} disabled={!isDirty}>
          Save
        </Button>
        <Button type="button" variant="secondary" onClick={handleCancel} disabled={!isDirty}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
