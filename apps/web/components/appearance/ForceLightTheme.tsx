"use client";

import { useEffect } from "react";
import { applyAppearanceColors, applyThemeMode } from "@/lib/appearance";

/**
 * Marketing and auth pages always render the default light look, regardless
 * of a dark/custom appearance saved from a signed-in session — nobody is
 * "signed in" as anyone on these pages, so there's no personal preference to
 * honor here. Mounted once in app/(marketing)/layout.tsx.
 */
export default function ForceLightTheme() {
  useEffect(() => {
    applyThemeMode("light");
    applyAppearanceColors(null);
  }, []);

  return null;
}
