import Image from "next/image";
import { File } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZES = { xs: 20, sm: 28, lg: 56 } as const;

/** Matches the 8 extensions in lib/converters/catalog.ts — one icon per format, in public/file_icons. */
const LABELS: Record<string, string> = {
  pdf: "PDF",
  docx: "Word",
  xlsx: "Excel",
  pptx: "PowerPoint",
  md: "Markdown",
  html: "HTML",
  txt: "Text",
  epub: "EPUB",
};

/**
 * A format's real icon (public/file_icons/{ext}.png), keyed by extension.
 * Falls back to a plain glyph for any extension that isn't one of the 8
 * FileForge actually converts — shouldn't happen in practice, since every
 * caller passes an already-normalized, catalog-known extension.
 */
export default function FormatIcon({
  ext,
  size = "sm",
  className,
}: {
  ext: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const px = SIZES[size];
  const label = LABELS[ext] ?? ext.toUpperCase();

  if (!(ext in LABELS)) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-md bg-surface text-ink-muted",
          className
        )}
        style={{ width: px, height: px }}
        title={label}
      >
        <File className="h-1/2 w-1/2" strokeWidth={1.8} />
      </div>
    );
  }

  return (
    <Image
      src={`/file_icons/${ext}.png`}
      alt={`${label} file`}
      width={px}
      height={px}
      className={cn("shrink-0 object-contain", className)}
    />
  );
}
