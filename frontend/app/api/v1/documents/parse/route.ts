import { parseFileToText, extractEmail, buildCsv } from "@/lib/file-parser";
import { setCsvStore } from "@/lib/csv-store";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData();
  const uploads = form.getAll("uploads") as File[];

  if (uploads.length === 0) {
    return Response.json({ detail: "No files were uploaded." }, { status: 400 });
  }

  const filenames: string[] = [];
  const errors: string[] = [];
  const entries: { filename: string; text: string; email: string }[] = [];

  for (const file of uploads) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "docx") {
      errors.push(`'${file.name}': unsupported type. Allowed: pdf,docx`);
      continue;
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const text = await parseFileToText(buffer, file.name);
      const email = extractEmail(text);
      filenames.push(file.name);
      entries.push({ filename: file.name, text, email });
    } catch (err) {
      errors.push(`Could not parse '${file.name}': ${err}`);
    }
  }

  if (errors.length > 0) {
    return Response.json({ detail: errors }, { status: 422 });
  }

  const csv = buildCsv(entries);
  setCsvStore(csv);

  return Response.json({
    filenames,
    total_files: filenames.length,
    message: `Parsed ${filenames.length} file(s) and stored in memory.`,
  });
}
