import type { ConversionResult } from "./types";
import {
  txtToPdf,
  pdfToTxt,
  markdownToPdf,
  pdfToMarkdown,
  htmlToPdf,
  pdfToHtml,
  docxToMarkdown,
  markdownToDocx,
} from "./converters";

export class ConversionError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ConversionError";
    this.status = status;
  }
}

type Handler = (buffer: Buffer, filename: string) => Promise<ConversionResult>;

interface ConversionDefinition {
  supported: boolean;
  handlers: Record<string, Handler>;
}

const CONVERSION_REGISTRY: Record<string, ConversionDefinition> = {
  "txt-pdf": {
    supported: true,
    handlers: { txt: txtToPdf, pdf: pdfToTxt },
  },
  "pdf-markdown": {
    supported: true,
    handlers: { pdf: pdfToMarkdown, md: markdownToPdf },
  },
  "pdf-html": {
    supported: true,
    handlers: { pdf: pdfToHtml, html: htmlToPdf, htm: htmlToPdf },
  },
  "word-markdown": {
    supported: true,
    handlers: { docx: docxToMarkdown, md: markdownToDocx },
  },
  "pdf-word": { supported: false, handlers: {} },
  "pdf-excel": { supported: false, handlers: {} },
  "pdf-powerpoint": { supported: false, handlers: {} },
  "epub-pdf": { supported: false, handlers: {} },
};

function getExtension(filename: string): string {
  const match = filename.match(/\.([^.]+)$/);
  return match ? match[1]!.toLowerCase() : "";
}

export async function convertFile(
  conversionType: string,
  buffer: Buffer,
  filename: string
): Promise<ConversionResult> {
  const definition = CONVERSION_REGISTRY[conversionType];

  if (!definition) {
    throw new ConversionError(`Unknown conversion type: "${conversionType}".`, 400);
  }

  if (!definition.supported) {
    throw new ConversionError(
      "This conversion isn't implemented yet — check back soon.",
      501
    );
  }

  const extension = getExtension(filename);
  const handler = definition.handlers[extension];

  if (!handler) {
    const expected = Object.keys(definition.handlers)
      .map((ext) => `.${ext}`)
      .join(" or ");
    throw new ConversionError(
      `That file doesn't match this conversion. Expected ${expected}.`,
      400
    );
  }

  return handler(buffer, filename);
}
