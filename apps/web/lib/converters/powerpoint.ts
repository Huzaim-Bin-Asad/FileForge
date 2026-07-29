import PptxGenJS from "pptxgenjs";
import JSZip from "jszip";
import { PDFParse } from "pdf-parse";
import type { RenderLine } from "./types";
import { renderLinesToPdf, stripXmlIllegalChars } from "./pdf";

export async function pdfToPptxBuffer(buffer: Buffer): Promise<Buffer> {
  const parser = new PDFParse({ data: buffer });
  const pptx = new PptxGenJS();

  try {
    const { pages } = await parser.getText();

    for (const page of pages) {
      const slide = pptx.addSlide();
      const text = stripXmlIllegalChars(page.text).trim();
      slide.addText(text || " ", {
        x: 0.5,
        y: 0.4,
        w: "90%",
        h: "90%",
        fontSize: 14,
        align: "left",
        valign: "top",
        wrap: true,
        autoFit: true,
      });
    }

    if (pages.length === 0) {
      pptx.addSlide();
    }
  } finally {
    await parser.destroy();
  }

  const output = await pptx.write({ outputType: "nodebuffer" });
  return output as Buffer;
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function slideFilePaths(names: string[]): string[] {
  return names
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = Number(a.match(/slide(\d+)\.xml/)![1]);
      const numB = Number(b.match(/slide(\d+)\.xml/)![1]);
      return numA - numB;
    });
}

/**
 * Best-effort text extraction from a slide's XML: pulls text runs (<a:t>)
 * grouped by paragraph (<a:p>). Not a full OOXML parser, mirrors the
 * regex-based approach already used for HTML/DOCX elsewhere in this file set.
 */
function extractSlideText(xml: string): string {
  const paragraphs = [...xml.matchAll(/<a:p>([\s\S]*?)<\/a:p>/g)].map((match) => match[1]!);

  const paragraphTexts = paragraphs.map((paragraph) => {
    const runs = [...paragraph.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((match) => match[1]!);
    return decodeXmlEntities(runs.join(""));
  });

  return paragraphTexts.filter((text) => text.trim().length > 0).join("\n");
}

export async function extractPptxAsPdfLines(buffer: Buffer): Promise<RenderLine[]> {
  const zip = await JSZip.loadAsync(buffer);
  const slidePaths = slideFilePaths(Object.keys(zip.files));

  const lines: RenderLine[] = [];

  for (const [index, path] of slidePaths.entries()) {
    const xml = await zip.file(path)!.async("string");
    const text = stripXmlIllegalChars(extractSlideText(xml));
    const paragraphs = text.split("\n").filter((p) => p.length > 0);

    lines.push({
      text: `Slide ${index + 1}`,
      size: 16,
      bold: true,
      spacingAfter: 10,
      pageBreakBefore: index > 0,
    });

    if (paragraphs.length === 0) {
      lines.push({ text: "" });
    } else {
      for (const paragraph of paragraphs) {
        lines.push({ text: paragraph });
      }
    }
  }

  return lines;
}

export async function pptxToPdfBuffer(buffer: Buffer): Promise<Buffer> {
  const lines = await extractPptxAsPdfLines(buffer);
  return renderLinesToPdf(lines);
}
