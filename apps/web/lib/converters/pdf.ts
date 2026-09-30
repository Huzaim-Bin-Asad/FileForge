import { PDFParse } from "pdf-parse";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import type { RenderLine } from "./types";

/**
 * Strips characters that are illegal in XML 1.0 (e.g. NUL bytes that some
 * PDFs' font encodings decode to for glyphs pdf-parse can't map). Left in,
 * these corrupt document.xml when the text is later embedded in a .docx.
 */
export function stripXmlIllegalChars(text: string): string {
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F￾￿]/g, "");
}

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return stripXmlIllegalChars(result.text);
  } finally {
    await parser.destroy();
  }
}

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 56;

/**
 * ASCII stand-ins for common symbols outside WinAnsi, the only encoding the
 * built-in standard fonts support. Smart quotes, dashes, bullets, ellipsis
 * and € are already in WinAnsi, so they don't need entries here.
 */
const WINANSI_FALLBACKS: Record<string, string> = {
  "→": "->",
  "←": "<-",
  "↔": "<->",
  "⇒": "=>",
  "⇐": "<=",
  "↑": "^",
  "↓": "v",
  "≤": "<=",
  "≥": ">=",
  "≠": "!=",
  "≈": "~",
  "−": "-",
  "✓": "v",
  "✔": "v",
  "✗": "x",
  "✘": "x",
  "\t": "    ",
};

/**
 * Makes text drawable with a standard font: known symbols get ASCII
 * stand-ins, anything else the font can't encode becomes "?". Without this,
 * pdf-lib throws on the first unencodable character and the whole
 * conversion fails.
 */
function toEncodable(text: string, supported: Set<number>): string {
  let out = "";
  for (const char of text) {
    const fallback = WINANSI_FALLBACKS[char];
    if (fallback !== undefined) out += fallback;
    else if (supported.has(char.codePointAt(0)!)) out += char;
    else out += "?";
  }
  return out;
}

function wrapLine(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  if (!text) return [""];

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (current && font.widthOfTextAtSize(attempt, size) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = attempt;
    }
  }
  if (current) lines.push(current);

  return lines;
}

export async function renderLinesToPdf(blocks: RenderLine[]): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const maxWidth = PAGE_WIDTH - MARGIN * 2;
  // Helvetica and Helvetica-Bold share the same WinAnsi character set.
  const supported = new Set(regularFont.getCharacterSet());

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  for (const block of blocks) {
    if (block.pageBreakBefore && y < PAGE_HEIGHT - MARGIN) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }

    const size = block.size ?? 11;
    const font = block.bold ? boldFont : regularFont;
    const wrapped = wrapLine(toEncodable(block.text, supported), font, size, maxWidth);

    for (const line of wrapped) {
      if (y < MARGIN + size) {
        page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        y = PAGE_HEIGHT - MARGIN;
      }
      page.drawText(line, { x: MARGIN, y, size, font, color: rgb(0.15, 0.15, 0.15) });
      y -= size * 1.4;
    }
    y -= block.spacingAfter ?? size * 0.6;
  }

  return Buffer.from(await pdfDoc.save());
}

export async function textToPdfBuffer(text: string): Promise<Buffer> {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: RenderLine[] = lines.map((line) => ({ text: line }));
  return renderLinesToPdf(blocks);
}
