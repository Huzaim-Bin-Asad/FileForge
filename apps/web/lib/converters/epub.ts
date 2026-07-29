import JSZip from "jszip";
import { randomUUID } from "crypto";
import { PDFParse } from "pdf-parse";
import type { RenderLine } from "./types";
import { renderLinesToPdf, stripXmlIllegalChars } from "./pdf";
import { escapeHtml, htmlToPlainText } from "./html";

function parseAttrs(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)) {
    attrs[match[1]!] = match[2]!;
  }
  return attrs;
}

function resolvePath(baseDir: string, href: string): string {
  const parts = (baseDir ? `${baseDir}/${href}` : href).split("/");
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === "." || part === "") continue;
    if (part === "..") resolved.pop();
    else resolved.push(part);
  }
  return resolved.join("/");
}

/**
 * Best-effort EPUB reader: follows container.xml -> OPF -> spine to find
 * each chapter's XHTML in reading order. Not a full OPF/NCX parser, mirrors
 * the regex-based approach already used for PPTX/DOCX elsewhere in this set.
 */
export async function extractEpubAsPdfLines(buffer: Buffer): Promise<RenderLine[]> {
  const zip = await JSZip.loadAsync(buffer);

  const containerXml = await zip.file("META-INF/container.xml")?.async("string");
  if (!containerXml) {
    throw new Error("Not a valid EPUB file: missing META-INF/container.xml.");
  }

  const opfPath = containerXml.match(/<rootfile\b[^>]*full-path="([^"]*)"/i)?.[1];
  if (!opfPath) {
    throw new Error("Not a valid EPUB file: missing OPF rootfile reference.");
  }

  const opfXml = await zip.file(opfPath)?.async("string");
  if (!opfXml) {
    throw new Error("Not a valid EPUB file: OPF file not found.");
  }

  const baseDir = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/")) : "";

  const manifest = new Map<string, string>();
  for (const match of opfXml.matchAll(/<item\b([^>]*)\/?>/gi)) {
    const attrs = parseAttrs(match[1]!);
    if (attrs.id && attrs.href) {
      manifest.set(attrs.id, resolvePath(baseDir, decodeURIComponent(attrs.href)));
    }
  }

  const spine = [...opfXml.matchAll(/<itemref\b([^>]*)\/?>/gi)]
    .map((match) => parseAttrs(match[1]!).idref)
    .filter((idref): idref is string => Boolean(idref))
    .map((idref) => manifest.get(idref))
    .filter((path): path is string => Boolean(path));

  const lines: RenderLine[] = [];

  for (const [index, path] of spine.entries()) {
    const file = zip.file(path);
    if (!file) continue;
    const html = await file.async("string");

    const titleMatch =
      html.match(/<title>([\s\S]*?)<\/title>/i) ?? html.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/i);
    const title = titleMatch ? htmlToPlainText(titleMatch[1]!).trim() : "";

    const bodyHtml = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? html;
    const text = stripXmlIllegalChars(htmlToPlainText(bodyHtml));
    const paragraphs = text.split("\n").filter((p) => p.length > 0);

    lines.push({
      text: title || `Chapter ${index + 1}`,
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

  if (lines.length === 0) {
    throw new Error("No readable content found in this EPUB file.");
  }

  return lines;
}

export async function epubToPdfBuffer(buffer: Buffer): Promise<Buffer> {
  const lines = await extractEpubAsPdfLines(buffer);
  return renderLinesToPdf(lines);
}

interface EpubChapter {
  title: string;
  paragraphs: string[];
}

function buildEpubXhtml(chapter: EpubChapter): string {
  const body = chapter.paragraphs
    .map((paragraph) => `  <p>${escapeHtml(paragraph).replace(/\n/g, "<br/>")}</p>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>${escapeHtml(chapter.title)}</title></head>
<body>
  <h1>${escapeHtml(chapter.title)}</h1>
${body}
</body>
</html>
`;
}

async function buildEpubBuffer(chapters: EpubChapter[]): Promise<Buffer> {
  const zip = new JSZip();
  const bookId = `urn:uuid:${randomUUID()}`;
  const modified = new Date().toISOString().replace(/\.\d+Z$/, "Z");

  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>
`
  );

  const manifestItems = chapters
    .map(
      (_, i) =>
        `    <item id="chapter${i + 1}" href="chapter${i + 1}.xhtml" media-type="application/xhtml+xml"/>`
    )
    .join("\n");
  const spineItems = chapters.map((_, i) => `    <itemref idref="chapter${i + 1}"/>`).join("\n");

  zip.file(
    "OEBPS/content.opf",
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">${bookId}</dc:identifier>
    <dc:title>Converted document</dc:title>
    <dc:language>en</dc:language>
    <meta property="dcterms:modified">${modified}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
${manifestItems}
  </manifest>
  <spine>
${spineItems}
  </spine>
</package>
`
  );

  const navItems = chapters
    .map((chapter, i) => `      <li><a href="chapter${i + 1}.xhtml">${escapeHtml(chapter.title)}</a></li>`)
    .join("\n");

  zip.file(
    "OEBPS/nav.xhtml",
    `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Table of Contents</title></head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
${navItems}
    </ol>
  </nav>
</body>
</html>
`
  );

  chapters.forEach((chapter, i) => {
    zip.file(`OEBPS/chapter${i + 1}.xhtml`, buildEpubXhtml(chapter));
  });

  return zip.generateAsync({ type: "nodebuffer" });
}

export async function pdfToEpubBuffer(buffer: Buffer): Promise<Buffer> {
  const parser = new PDFParse({ data: buffer });
  let chapters: EpubChapter[];

  try {
    const { pages } = await parser.getText();
    chapters = pages.map((page, index) => {
      const text = stripXmlIllegalChars(page.text).trim();
      const paragraphs = text
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);
      return { title: `Page ${index + 1}`, paragraphs: paragraphs.length ? paragraphs : [""] };
    });
  } finally {
    await parser.destroy();
  }

  if (chapters.length === 0) {
    chapters = [{ title: "Page 1", paragraphs: [""] }];
  }

  return buildEpubBuffer(chapters);
}
