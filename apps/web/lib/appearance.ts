/**
 * Personal appearance: Light, Dark, or one colored preset/custom palette.
 * Per-user (there's no "company" concept in this app), stored on `users`
 * (themeBackground/Accent/Text — see lib/db/schema.ts) and applied
 * everywhere the person is signed in.
 *
 * Only three colors are ever customized — background, accent, and text —
 * mapped onto this app's own existing tokens rather than a separate
 * generic set:
 *   background -> --surface (and a lightened/darkened --surface-elevated)
 *   accent     -> --ember (and derived --ember-deep / --ember-soft)
 *   text       -> --ink
 * Every other token (success/danger/steel/etc.) is intentionally left
 * alone — recoloring those from three inputs would mean guessing derived
 * hues with no real anchor, more likely to look wrong than right.
 *
 * Light and Dark are "presets" whose colors are `null`: that means no
 * overrides, use the theme's own built-in tokens (see globals.css's dark
 * block). Every colored preset implies the light theme — a custom palette
 * and Dark are mutually exclusive, enforced by ThemeProvider forcing
 * data-theme="light" whenever a custom color is live.
 */

export type ThemeMode = "light" | "dark";

export interface AppearanceColors {
  background: string;
  accent: string;
  text: string;
}

export interface AppearancePreset {
  key: string;
  label: string;
  theme: ThemeMode;
  /** null for Light/Dark themselves — "use the built-in tokens," not an actual color to preview. */
  colors: AppearanceColors | null;
}

export const PRESETS: AppearancePreset[] = [
  { key: "light", label: "Light", theme: "light", colors: null },
  { key: "dark", label: "Dark", theme: "dark", colors: null },
  { key: "sunset", label: "Sunset", theme: "light", colors: { background: "#fff4ea", accent: "#e8590c", text: "#3b1f0a" } },
  { key: "ocean", label: "Ocean", theme: "light", colors: { background: "#eaf6fb", accent: "#0e7490", text: "#0b2733" } },
  { key: "orchid", label: "Orchid", theme: "light", colors: { background: "#f8eefc", accent: "#9333ea", text: "#2e1a3d" } },
  { key: "forest", label: "Forest", theme: "light", colors: { background: "#eef7ee", accent: "#15803d", text: "#122117" } },
  { key: "rose", label: "Rose", theme: "light", colors: { background: "#fdeef1", accent: "#e11d48", text: "#3a1420" } },
  { key: "amber", label: "Amber", theme: "light", colors: { background: "#fef6e6", accent: "#d97706", text: "#3a2a0d" } },
  { key: "slate", label: "Slate", theme: "light", colors: { background: "#eef1f4", accent: "#334155", text: "#161c24" } },
  { key: "mint", label: "Mint", theme: "light", colors: { background: "#eafaf4", accent: "#0d9488", text: "#0d2a24" } },
  { key: "grape", label: "Grape", theme: "light", colors: { background: "#f3eefc", accent: "#7c3aed", text: "#241a3d" } },
  { key: "sand", label: "Sand", theme: "light", colors: { background: "#f6f1e7", accent: "#a16207", text: "#2e2410" } },
];

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function isValidHex(value: string): boolean {
  return HEX_RE.test(value.trim());
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  const toHex = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two hex colors, from 1 (identical) to 21 (black vs. white). */
export function contrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexToRgb(hexA));
  const lumB = relativeLuminance(hexToRgb(hexB));
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

function hexToHsl(hex: string): [number, number, number] {
  const [r0, g0, b0] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r0, g0, b0);
  const min = Math.min(r0, g0, b0);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r0) h = ((g0 - b0) / d + (g0 < b0 ? 6 : 0)) * 60;
  else if (max === g0) h = ((b0 - r0) / d + 2) * 60;
  else h = ((r0 - g0) / d + 4) * 60;
  return [h, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  const sN = s / 100;
  const lN = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sN * Math.min(lN, 1 - lN);
  const f = (n: number) => lN - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return rgbToHex([255 * f(0), 255 * f(8), 255 * f(4)]);
}

/** Nudges lightness by `deltaPct` (can be negative), keeping hue/saturation. */
export function adjustLightness(hex: string, deltaPct: number): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s, Math.max(0, Math.min(100, l + deltaPct)));
}

const MIN_TEXT_CONTRAST = 4.5; // WCAG AA for normal text
const MIN_ACCENT_CONTRAST = 1.8; // enough that the accent isn't invisible on the background
const MAX_RANDOM_ATTEMPTS = 12;

/** [background, accent, text] hue offsets from a shared random base hue, one row per harmony rule. */
const HARMONY_OFFSETS: [number, number, number][] = [
  [0, 30, -30], // analogous
  [0, 180, 0], // complementary
  [0, 150, -150], // split-complementary
  [0, 120, -120], // triadic
  [0, 0, 0], // monochromatic
];

/**
 * A random, harmony-based palette: pick a base hue, derive the three roles
 * from one of five hue-relationship rules, then check it's actually
 * readable. Retries up to MAX_RANDOM_ATTEMPTS times; if every attempt fails
 * the contrast gates (rare — lightness/saturation are fixed per role
 * specifically to make that unlikely), it returns the last attempt anyway
 * rather than getting stuck.
 */
export function randomAppearanceColors(): AppearanceColors {
  const baseHue = Math.random() * 360;
  let last: AppearanceColors = { background: "#ffffff", accent: "#000000", text: "#000000" };

  for (let attempt = 0; attempt < MAX_RANDOM_ATTEMPTS; attempt++) {
    const [bgOffset, accentOffset, textOffset] =
      HARMONY_OFFSETS[Math.floor(Math.random() * HARMONY_OFFSETS.length)]!;
    const hue = (offset: number) => (baseHue + offset + 360) % 360;

    const background = hslToHex(hue(bgOffset), 35, 95);
    const accent = hslToHex(hue(accentOffset), 65, 45);
    const text = hslToHex(hue(textOffset), 40, 15);
    last = { background, accent, text };

    if (
      contrastRatio(text, background) >= MIN_TEXT_CONTRAST &&
      contrastRatio(accent, background) >= MIN_ACCENT_CONTRAST
    ) {
      return last;
    }
  }
  return last;
}

const OVERRIDE_PROPERTIES = ["--surface", "--surface-elevated", "--ember", "--ember-deep", "--ember-soft", "--ink"];

/** Writes (or clears) the three-color override as inline styles on `<html>`. Client-only. */
export function applyAppearanceColors(colors: AppearanceColors | null): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (!colors) {
    for (const prop of OVERRIDE_PROPERTIES) root.style.removeProperty(prop);
    return;
  }
  const { background, accent, text } = colors;
  root.style.setProperty("--surface", background);
  root.style.setProperty("--surface-elevated", adjustLightness(background, 4));
  root.style.setProperty("--ember", accent);
  root.style.setProperty("--ember-deep", adjustLightness(accent, -12));
  root.style.setProperty("--ember-soft", adjustLightness(accent, 42));
  root.style.setProperty("--ink", text);
}

export const THEME_STORAGE_KEY = "ff-theme";
export const APPEARANCE_CACHE_KEY = "ff-appearance-colors";

export function applyThemeMode(mode: ThemeMode): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", mode);
}

/** Applies the mode immediately AND persists it — Light/Dark is a per-browser choice, never sent to the server. */
export function setThemeMode(mode: ThemeMode): void {
  applyThemeMode(mode);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // A blocked/full localStorage just means this choice won't survive a reload.
  }
}

export function getStoredThemeMode(): ThemeMode {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    // Fall through to the default below.
  }
  return "light";
}
