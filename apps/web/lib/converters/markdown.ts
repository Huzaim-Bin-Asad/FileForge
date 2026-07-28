import type { RenderLine } from "./types";

export interface MarkdownBlock {
  type: "heading" | "paragraph" | "bullet" | "numbered";
  text: string;
  level?: number;
  index?: number;
}

export function parseMarkdown(markdown: string): MarkdownBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let paragraphBuffer: string[] = [];

  function flushParagraph() {
    if (paragraphBuffer.length) {
      blocks.push({ type: "paragraph", text: paragraphBuffer.join(" ").trim() });
      paragraphBuffer = [];
    }
  }

  let numberedIndex = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      numberedIndex = 0;
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      blocks.push({
        type: "heading",
        level: headingMatch[1]!.length,
        text: headingMatch[2]!.trim(),
      });
      numberedIndex = 0;
      continue;
    }

    const bulletMatch = line.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      flushParagraph();
      blocks.push({ type: "bullet", text: bulletMatch[1]!.trim() });
      continue;
    }

    const numberedMatch = line.match(/^\d+\.\s+(.*)$/);
    if (numberedMatch) {
      flushParagraph();
      numberedIndex += 1;
      blocks.push({
        type: "numbered",
        text: numberedMatch[1]!.trim(),
        index: numberedIndex,
      });
      continue;
    }

    paragraphBuffer.push(line);
  }
  flushParagraph();

  return blocks;
}

export function stripInlineEmphasis(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/_(.*?)_/g, "$1");
}

export function plainTextToMarkdown(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .join("\n\n");
}

const HEADING_SIZES = [22, 18, 15, 13, 12, 11];

export function markdownBlocksToRenderLines(blocks: MarkdownBlock[]): RenderLine[] {
  return blocks.map((block) => {
    const text = stripInlineEmphasis(block.text);

    if (block.type === "heading") {
      const size = HEADING_SIZES[Math.min(block.level! - 1, 5)];
      return { text, size, bold: true, spacingAfter: size! * 0.8 };
    }

    if (block.type === "bullet") {
      return { text: `•  ${text}` };
    }

    if (block.type === "numbered") {
      return { text: `${block.index}. ${text}` };
    }

    return { text };
  });
}
