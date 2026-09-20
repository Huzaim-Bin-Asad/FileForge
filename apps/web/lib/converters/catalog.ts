export interface ConversionPair {
  /** Registry key from lib/converters/registry.ts. */
  type: string;
  extensions: [string, string];
  labels: Record<string, string>;
}

export const CONVERSION_PAIRS: ConversionPair[] = [
  { type: "txt-pdf", extensions: ["txt", "pdf"], labels: { txt: "TXT", pdf: "PDF" } },
  { type: "pdf-markdown", extensions: ["pdf", "md"], labels: { pdf: "PDF", md: "Markdown" } },
  { type: "pdf-html", extensions: ["pdf", "html"], labels: { pdf: "PDF", html: "HTML" } },
  { type: "word-markdown", extensions: ["docx", "md"], labels: { docx: "Word", md: "Markdown" } },
  { type: "pdf-word", extensions: ["pdf", "docx"], labels: { pdf: "PDF", docx: "Word" } },
  { type: "pdf-excel", extensions: ["pdf", "xlsx"], labels: { pdf: "PDF", xlsx: "Excel" } },
  {
    type: "pdf-powerpoint",
    extensions: ["pdf", "pptx"],
    labels: { pdf: "PDF", pptx: "PowerPoint" },
  },
  { type: "epub-pdf", extensions: ["epub", "pdf"], labels: { epub: "EPUB", pdf: "PDF" } },
];

/** "htm" is accepted as an input alongside "html" but isn't its own pair. */
const EXTENSION_ALIASES: Record<string, string> = { htm: "html" };

export interface ConversionTarget {
  type: string;
  targetExt: string;
  targetLabel: string;
}

export function normalizeExtension(ext: string): string {
  const lower = ext.toLowerCase();
  return EXTENSION_ALIASES[lower] ?? lower;
}

/** Given an uploaded file's extension, what can it be converted to? */
export function getTargetsForExtension(ext: string): ConversionTarget[] {
  const normalized = normalizeExtension(ext);
  const targets: ConversionTarget[] = [];
  for (const pair of CONVERSION_PAIRS) {
    const idx = pair.extensions.indexOf(normalized);
    if (idx === -1) continue;
    const targetExt = pair.extensions[1 - idx]!;
    targets.push({ type: pair.type, targetExt, targetLabel: pair.labels[targetExt]! });
  }
  return targets;
}

export const ACCEPTED_EXTENSIONS = Array.from(
  new Set(CONVERSION_PAIRS.flatMap((p) => p.extensions).concat(Object.keys(EXTENSION_ALIASES)))
).sort();
