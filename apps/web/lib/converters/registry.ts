import type { ConversionResult, ConvertedFile } from "./types";
import {
  txtToPdf,
  pdfToTxt,
  markdownToPdf,
  pdfToMarkdown,
  htmlToPdf,
  pdfToHtml,
  docxToMarkdown,
  markdownToDocx,
  docxToPdf,
  pdfToDocx,
  xlsxToPdf,
  pdfToXlsx,
  pptxToPdf,
  pdfToPptx,
  epubToPdf,
  pdfToEpub,
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
  "pdf-word": {
    supported: true,
    handlers: { pdf: pdfToDocx, docx: docxToPdf },
  },
  "pdf-excel": {
    supported: true,
    handlers: { pdf: pdfToXlsx, xlsx: xlsxToPdf },
  },
  "pdf-powerpoint": {
    supported: true,
    handlers: { pdf: pdfToPptx, pptx: pptxToPdf },
  },
  "epub-pdf": {
    supported: true,
    handlers: { epub: epubToPdf, pdf: pdfToEpub },
  },
};

function getExtension(filename: string): string {
  const match = filename.match(/\.([^.]+)$/);
  return match ? match[1]!.toLowerCase() : "";
}

/**
 * Resolves `(conversionType, filename)` to a handler without running it —
 * the exact same checks `convertFile` makes before it calls the handler,
 * pulled out so a caller can validate a request up front (e.g. before
 * enqueueing an async job) and get the identical ConversionError a rejected
 * synchronous conversion would have thrown.
 */
export function resolveConversionHandler(
  conversionType: string,
  filename: string
): { handler: Handler; sourceFormat: string } {
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

  const sourceFormat = getExtension(filename);
  const handler = definition.handlers[sourceFormat];

  if (!handler) {
    const expected = Object.keys(definition.handlers)
      .map((ext) => `.${ext}`)
      .join(" or ");
    throw new ConversionError(
      `That file doesn't match this conversion. Expected ${expected}.`,
      400
    );
  }

  return { handler, sourceFormat };
}

export async function convertFile(
  conversionType: string,
  buffer: Buffer,
  filename: string
): Promise<ConvertedFile> {
  const { handler, sourceFormat } = resolveConversionHandler(conversionType, filename);
  const result = await handler(buffer, filename);

  return {
    ...result,
    sourceFormat,
    targetFormat: getExtension(result.filename),
  };
}
