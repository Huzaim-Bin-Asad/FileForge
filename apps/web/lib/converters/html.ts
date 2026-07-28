function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeWhitespace(text: string): string {
  return text
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Best-effort tag stripper for simple, mostly-flat HTML (not a full parser). */
export function htmlToPlainText(html: string): string {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n\n")
    .replace(/<[^>]+>/g, "");

  return normalizeWhitespace(decodeEntities(text));
}

/**
 * Best-effort HTML -> Markdown mapping for common, mostly-flat markup
 * (headings, paragraphs, lists, bold/italic). Not a full HTML parser —
 * built for the fairly clean output mammoth produces from .docx files.
 */
export function htmlToMarkdown(html: string): string {
  let markdown = html;

  markdown = markdown.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_match, inner: string) => {
    const items = inner.replace(
      /<li[^>]*>([\s\S]*?)<\/li>/gi,
      (_m: string, item: string) => `- ${item.trim()}\n`
    );
    return `\n${items}\n`;
  });

  markdown = markdown.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_match, inner: string) => {
    let index = 0;
    const items = inner.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m: string, item: string) => {
      index += 1;
      return `${index}. ${item.trim()}\n`;
    });
    return `\n${items}\n`;
  });

  markdown = markdown
    .replace(
      /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi,
      (_m, level: string, text: string) => `\n${"#".repeat(Number(level))} ${text.trim()}\n\n`
    )
    .replace(/<(?:strong|b)[^>]*>([\s\S]*?)<\/(?:strong|b)>/gi, "**$1**")
    .replace(/<(?:em|i)[^>]*>([\s\S]*?)<\/(?:em|i)>/gi, "*$1*")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "$1\n\n")
    .replace(/<[^>]+>/g, "");

  return normalizeWhitespace(decodeEntities(markdown));
}
