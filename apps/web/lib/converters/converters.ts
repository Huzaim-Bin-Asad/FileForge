import { extractPdfText, renderLinesToPdf, textToPdfBuffer } from "./pdf";
import { parseMarkdown, markdownBlocksToRenderLines, plainTextToMarkdown } from "./markdown";
import { escapeHtml, htmlToPlainText } from "./html";
import { extractDocxAsMarkdown, markdownToDocxBuffer } from "./word";
import type { ConversionResult } from "./types";

function withExtension(filename: string, extension: string): string {
  const base = filename.includes(".")
    ? filename.slice(0, filename.lastIndexOf("."))
    : filename;
  return `${base}.${extension}`;
}

const MIME_TYPES = {
  pdf: "application/pdf",
  txt: "text/plain",
  md: "text/markdown",
  html: "text/html",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const;

function toResult(
  buffer: Buffer,
  filename: string,
  extension: keyof typeof MIME_TYPES
): ConversionResult {
  return {
    buffer,
    filename: withExtension(filename, extension),
    mimeType: MIME_TYPES[extension],
  };
}

export async function txtToPdf(buffer: Buffer, filename: string): Promise<ConversionResult> {
  const pdfBuffer = await textToPdfBuffer(buffer.toString("utf-8"));
  return toResult(pdfBuffer, filename, "pdf");
}

export async function pdfToTxt(buffer: Buffer, filename: string): Promise<ConversionResult> {
  const text = await extractPdfText(buffer);
  return toResult(Buffer.from(text, "utf-8"), filename, "txt");
}

export async function markdownToPdf(buffer: Buffer, filename: string): Promise<ConversionResult> {
  const blocks = parseMarkdown(buffer.toString("utf-8"));
  const pdfBuffer = await renderLinesToPdf(markdownBlocksToRenderLines(blocks));
  return toResult(pdfBuffer, filename, "pdf");
}

export async function pdfToMarkdown(buffer: Buffer, filename: string): Promise<ConversionResult> {
  const text = await extractPdfText(buffer);
  const markdown = plainTextToMarkdown(text);
  return toResult(Buffer.from(markdown, "utf-8"), filename, "md");
}

export async function htmlToPdf(buffer: Buffer, filename: string): Promise<ConversionResult> {
  const text = htmlToPlainText(buffer.toString("utf-8"));
  const pdfBuffer = await textToPdfBuffer(text);
  return toResult(pdfBuffer, filename, "pdf");
}

export async function pdfToHtml(buffer: Buffer, filename: string): Promise<ConversionResult> {
  const text = await extractPdfText(buffer);
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const body = paragraphs
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("\n");

  const html = `<!doctype html>\n<html>\n<head><meta charset="utf-8" /><title>Converted document</title></head>\n<body>\n${body}\n</body>\n</html>\n`;
  return toResult(Buffer.from(html, "utf-8"), filename, "html");
}

export async function docxToMarkdown(buffer: Buffer, filename: string): Promise<ConversionResult> {
  const markdown = await extractDocxAsMarkdown(buffer);
  return toResult(Buffer.from(markdown, "utf-8"), filename, "md");
}

export async function markdownToDocx(buffer: Buffer, filename: string): Promise<ConversionResult> {
  const docxBuffer = await markdownToDocxBuffer(buffer.toString("utf-8"));
  return toResult(docxBuffer, filename, "docx");
}

export async function docxToPdf(buffer: Buffer, filename: string): Promise<ConversionResult> {
  const markdown = await extractDocxAsMarkdown(buffer);
  const blocks = parseMarkdown(markdown);
  const pdfBuffer = await renderLinesToPdf(markdownBlocksToRenderLines(blocks));
  return toResult(pdfBuffer, filename, "pdf");
}

export async function pdfToDocx(buffer: Buffer, filename: string): Promise<ConversionResult> {
  const text = await extractPdfText(buffer);
  const markdown = plainTextToMarkdown(text);
  const docxBuffer = await markdownToDocxBuffer(markdown);
  return toResult(docxBuffer, filename, "docx");
}
