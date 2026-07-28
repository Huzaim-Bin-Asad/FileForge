export interface ConversionResult {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

export interface RenderLine {
  text: string;
  size?: number;
  bold?: boolean;
  spacingAfter?: number;
}
