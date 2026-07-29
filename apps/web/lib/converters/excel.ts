import ExcelJS from "exceljs";
import { PDFParse } from "pdf-parse";
import type { RenderLine } from "./types";
import { renderLinesToPdf, stripXmlIllegalChars } from "./pdf";

const CELL_SEPARATOR = "    ";
const MAX_SHEET_NAME_LENGTH = 31;

function sheetName(name: string): string {
  return name.replace(/[:\\/?*[\]]/g, " ").slice(0, MAX_SHEET_NAME_LENGTH) || "Sheet";
}

export async function extractXlsxAsPdfLines(buffer: Buffer): Promise<RenderLine[]> {
  const workbook = new ExcelJS.Workbook();
  // exceljs's bundled types declare a local `Buffer extends ArrayBuffer`
  // that doesn't structurally match Node's real Buffer type.
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

  const lines: RenderLine[] = [];

  workbook.eachSheet((sheet, index) => {
    lines.push({
      text: sheet.name,
      size: 14,
      bold: true,
      spacingAfter: 10,
      pageBreakBefore: index > 1,
    });

    sheet.eachRow({ includeEmpty: false }, (row) => {
      const cells: string[] = [];
      row.eachCell({ includeEmpty: true }, (cell) => {
        cells.push(cell.text.trim());
      });
      lines.push({ text: cells.join(CELL_SEPARATOR) });
    });
  });

  return lines;
}

export async function xlsxToPdfBuffer(buffer: Buffer): Promise<Buffer> {
  const lines = await extractXlsxAsPdfLines(buffer);
  return renderLinesToPdf(lines);
}

/**
 * Builds a workbook from a PDF: real tables (detected from vector-drawn grid
 * lines) become sheets with actual rows/columns; pages with no detected
 * table fall back to tab-separated text so nothing is dropped.
 */
export async function pdfToXlsxBuffer(buffer: Buffer): Promise<Buffer> {
  const parser = new PDFParse({ data: buffer });
  const workbook = new ExcelJS.Workbook();

  try {
    const tableResult = await parser.getTable();
    const usedNames = new Set<string>();

    function addSheet(name: string) {
      let candidate = sheetName(name);
      let suffix = 2;
      while (usedNames.has(candidate)) {
        candidate = `${sheetName(name).slice(0, MAX_SHEET_NAME_LENGTH - 4)} (${suffix})`;
        suffix += 1;
      }
      usedNames.add(candidate);
      return workbook.addWorksheet(candidate);
    }

    for (const page of tableResult.pages) {
      if (page.tables.length === 0) continue;
      page.tables.forEach((table, tableIndex) => {
        const sheet = addSheet(
          page.tables.length > 1
            ? `Page ${page.num} Table ${tableIndex + 1}`
            : `Page ${page.num}`
        );
        table.forEach((row) => {
          sheet.addRow(row.map((cell) => stripXmlIllegalChars(cell ?? "")));
        });
      });
    }

    if (workbook.worksheets.length === 0) {
      const textResult = await parser.getText({ cellSeparator: "\t" });
      for (const page of textResult.pages) {
        const sheet = addSheet(`Page ${page.num}`);
        const rows = stripXmlIllegalChars(page.text)
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);
        rows.forEach((line) => sheet.addRow(line.split("\t")));
      }
    }

    if (workbook.worksheets.length === 0) {
      workbook.addWorksheet("Sheet1");
    }
  } finally {
    await parser.destroy();
  }

  return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
}
