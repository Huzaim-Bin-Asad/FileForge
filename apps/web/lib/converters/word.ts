import mammoth from "mammoth";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { parseMarkdown, stripInlineEmphasis } from "./markdown";
import { htmlToMarkdown } from "./html";

export async function extractDocxAsMarkdown(buffer: Buffer): Promise<string> {
  const { value: html } = await mammoth.convertToHtml({ buffer });
  return htmlToMarkdown(html);
}

const HEADING_LEVELS = [
  HeadingLevel.HEADING_1,
  HeadingLevel.HEADING_2,
  HeadingLevel.HEADING_3,
  HeadingLevel.HEADING_4,
  HeadingLevel.HEADING_5,
  HeadingLevel.HEADING_6,
];

export async function markdownToDocxBuffer(markdown: string): Promise<Buffer> {
  const blocks = parseMarkdown(markdown);

  const paragraphs = blocks.map((block) => {
    const text = stripInlineEmphasis(block.text);

    if (block.type === "heading") {
      return new Paragraph({
        heading: HEADING_LEVELS[Math.min(block.level! - 1, 5)],
        children: [new TextRun(text)],
      });
    }

    if (block.type === "bullet") {
      return new Paragraph({ text, bullet: { level: 0 } });
    }

    if (block.type === "numbered") {
      return new Paragraph({ children: [new TextRun(`${block.index}. ${text}`)] });
    }

    return new Paragraph({ children: [new TextRun(text)] });
  });

  const doc = new Document({ sections: [{ children: paragraphs }] });
  return Packer.toBuffer(doc);
}
