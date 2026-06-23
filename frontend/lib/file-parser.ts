import { PDFParse, VerbosityLevel } from "pdf-parse";
import mammoth from "mammoth";

function flattenToSingleLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export async function parsePdf(buffer: Buffer): Promise<string> {
  const pdf = new PDFParse({ data: buffer, verbosity: VerbosityLevel.ERRORS });
  const result = await pdf.getText();
  await pdf.destroy();
  const pages = result.pages || [];
  const fullText = pages.map((p: { text: string }) => p.text).join(" ");
  return flattenToSingleLine(fullText);
}

export async function parseDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return flattenToSingleLine(result.value);
}

export async function parseFileToText(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  switch (ext) {
    case "pdf":
      return parsePdf(buffer);
    case "docx":
      return parseDocx(buffer);
    default:
      throw new Error(`Unsupported file type: .${ext}`);
  }
}

export function extractEmail(text: string): string {
  const atIdx = text.indexOf("@");
  if (atIdx === -1) return "";

  let start = atIdx;
  while (start > 0 && text[start - 1] !== " ") start--;

  let end = atIdx;
  while (end < text.length && text[end] !== " ") end++;

  const candidate = text.slice(start, end);
  const atPos = candidate.indexOf("@");
  if (!candidate.slice(atPos).includes(".")) return "";

  return candidate;
}

export function buildCsv(
  entries: { filename: string; text: string; email: string }[]
): string {
  const header = 'filename,text,email';
  const rows = entries.map((e) => {
    const escape = (s: string) =>
      '"' + s.replace(/"/g, '""') + '"';
    return [escape(e.filename), escape(e.text), escape(e.email)].join(",");
  });
  return [header, ...rows].join("\n");
}
