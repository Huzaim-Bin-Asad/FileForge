/**
 * Small, self-contained mirror of the pairs in lib/converters/registry.ts,
 * used only to attribute a conversion to one of the 8 supported pairs for
 * dashboard stats. Kept separate so the dashboard doesn't pull in every
 * converter implementation just to count usage.
 */
const PAIRS: { key: string; exts: [string, string] }[] = [
  { key: "txt-pdf", exts: ["txt", "pdf"] },
  { key: "pdf-markdown", exts: ["pdf", "md"] },
  { key: "pdf-html", exts: ["pdf", "html"] },
  { key: "word-markdown", exts: ["docx", "md"] },
  { key: "pdf-word", exts: ["pdf", "docx"] },
  { key: "pdf-excel", exts: ["pdf", "xlsx"] },
  { key: "pdf-powerpoint", exts: ["pdf", "pptx"] },
  { key: "epub-pdf", exts: ["epub", "pdf"] },
];

export const SUPPORTED_PAIR_COUNT = PAIRS.length;

export function pairKeyFor(sourceFormat: string, targetFormat: string): string | null {
  const pair = PAIRS.find(
    (p) => p.exts.includes(sourceFormat) && p.exts.includes(targetFormat)
  );
  return pair?.key ?? null;
}

/** Buckets items into `weeks` trailing weekly counts, most recent week last. */
export function bucketWeeklyVolume(
  items: { createdAt: Date | string }[],
  weeks: number
): number[] {
  const now = Date.now();
  const buckets = Array(weeks).fill(0) as number[];
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  for (const item of items) {
    const weeksAgo = Math.floor((now - new Date(item.createdAt).getTime()) / msPerWeek);
    const index = weeks - 1 - weeksAgo;
    if (index >= 0 && index < weeks) buckets[index]++;
  }
  return buckets;
}

/** "0 B", "4.2 KB", "1.3 MB" — for the dashboard's monthly bandwidth figure. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
}

/** "480ms", "3.2s", "1m 05s" — for the dashboard's monthly processing-time figure. */
export function formatDurationMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const totalSeconds = ms / 1000;
  if (totalSeconds < 60) return `${totalSeconds.toFixed(1)}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

export function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "Yesterday";
  if (day < 7) return `${day}d ago`;
  const week = Math.floor(day / 7);
  if (week < 5) return `${week}w ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
