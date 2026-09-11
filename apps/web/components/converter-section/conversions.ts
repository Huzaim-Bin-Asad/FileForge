export interface ConversionOption {
  value: string;
  label: string;
  from: string;
  to: string;
  blurb: string;
  supported: boolean;
}

export const CONVERSION_OPTIONS: ConversionOption[] = [
  {
    value: "pdf-word",
    label: "PDF ↔ Word",
    from: "PDF",
    to: "Word",
    blurb: "Turn locked pages into an editable document, or back again.",
    supported: true,
  },
  {
    value: "pdf-excel",
    label: "PDF ↔ Excel",
    from: "PDF",
    to: "Excel",
    blurb: "Pull tables out of a PDF into a spreadsheet.",
    supported: true,
  },
  {
    value: "pdf-powerpoint",
    label: "PDF ↔ PowerPoint",
    from: "PDF",
    to: "PowerPoint",
    blurb: "Rebuild a deck from a PDF export.",
    supported: true,
  },
  {
    value: "pdf-html",
    label: "PDF ↔ HTML",
    from: "PDF",
    to: "HTML",
    blurb: "Ship the same document as a web page.",
    supported: true,
  },
  {
    value: "pdf-markdown",
    label: "PDF ↔ Markdown",
    from: "PDF",
    to: "Markdown",
    blurb: "Extract clean Markdown from a PDF.",
    supported: true,
  },
  {
    value: "word-markdown",
    label: "Word ↔ Markdown",
    from: "Word",
    to: "Markdown",
    blurb: "Move between Word and Markdown without a second tool.",
    supported: true,
  },
  {
    value: "epub-pdf",
    label: "EPUB ↔ PDF",
    from: "EPUB",
    to: "PDF",
    blurb: "Make an ebook into a portable PDF.",
    supported: true,
  },
  {
    value: "txt-pdf",
    label: "TXT ↔ PDF",
    from: "TXT",
    to: "PDF",
    blurb: "Turn plain text into something you can print or attach.",
    supported: true,
  },
];

export const DEFAULT_CONVERSION_TYPE = CONVERSION_OPTIONS.find(
  (option) => option.supported
)!.value;

export function getConversionOption(value: string): ConversionOption | undefined {
  return CONVERSION_OPTIONS.find((o) => o.value === value);
}

export const CONVERSION_EXTENSIONS: Record<string, string[]> = {
  "pdf-word": ["pdf", "docx"],
  "pdf-excel": ["pdf", "xlsx"],
  "pdf-powerpoint": ["pdf", "pptx"],
  "pdf-html": ["pdf", "html", "htm"],
  "pdf-markdown": ["pdf", "md"],
  "word-markdown": ["docx", "md"],
  "epub-pdf": ["epub", "pdf"],
  "txt-pdf": ["txt", "pdf"],
};
