"use client";

import { useEffect } from "react";
import {
  applyAppearanceColors,
  applyThemeMode,
  getStoredThemeMode,
  APPEARANCE_CACHE_KEY,
  type AppearanceColors,
} from "@/lib/appearance";

/**
 * Applies the signed-in user's saved appearance across the app shell, and
 * refreshes the localStorage cache the root layout's anti-flash script
 * reads on the next load. `colors` is the server-saved palette (or null);
 * theme mode itself is never server-stored — see lib/appearance.ts.
 *
 * This only ever applies the *last saved* state. Live preview while editing
 * (Settings > Appearance) is a separate concern, owned by that page.
 */
export default function AppearanceProvider({ colors }: { colors: AppearanceColors | null }) {
  useEffect(() => {
    // A custom palette always implies light — same rule the Appearance
    // settings page enforces when a colored preset is picked.
    const mode = colors ? "light" : getStoredThemeMode();
    applyThemeMode(mode);
    applyAppearanceColors(colors);
    try {
      if (colors) window.localStorage.setItem(APPEARANCE_CACHE_KEY, JSON.stringify(colors));
      else window.localStorage.removeItem(APPEARANCE_CACHE_KEY);
    } catch {
      // Best-effort cache — a blocked/full localStorage just means next
      // load's anti-flash script has nothing to read, not a functional break.
    }
  }, [colors]);

  return null;
}
