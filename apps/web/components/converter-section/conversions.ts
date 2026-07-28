export type ConversionCategory = "Documents";

export interface ConversionOption {
  value: string;
  label: string;
  category: ConversionCategory;
  supported: boolean;
}

export const CATEGORY_ICONS: Record<ConversionCategory, string> = {
  Documents: "📄",
};

export const CONVERSION_OPTIONS: ConversionOption[] = [
  { value: "pdf-word", label: "PDF ↔ Word", category: "Documents", supported: true },
  { value: "pdf-excel", label: "PDF ↔ Excel", category: "Documents", supported: false },
  { value: "pdf-powerpoint", label: "PDF ↔ PowerPoint", category: "Documents", supported: false },
  { value: "pdf-html", label: "PDF ↔ HTML", category: "Documents", supported: true },
  { value: "pdf-markdown", label: "PDF ↔ Markdown", category: "Documents", supported: true },
  { value: "word-markdown", label: "Word ↔ Markdown", category: "Documents", supported: true },
  { value: "epub-pdf", label: "EPUB ↔ PDF", category: "Documents", supported: false },
  { value: "txt-pdf", label: "TXT ↔ PDF", category: "Documents", supported: true },
];

export const DEFAULT_CONVERSION_TYPE = CONVERSION_OPTIONS.find(
  (option) => option.supported
)!.value;

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
