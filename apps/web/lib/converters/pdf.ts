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

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  for (const block of blocks) {
    if (block.pageBreakBefore && y < PAGE_HEIGHT - MARGIN) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }

    const size = block.size ?? 11;
    const font = block.bold ? boldFont : regularFont;
    const wrapped = wrapLine(block.text, font, size, maxWidth);

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
