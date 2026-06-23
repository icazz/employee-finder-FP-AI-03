import { parseFileToText } from "@/lib/file-parser";
import { extractCandidateNameWithAI } from "@/lib/summary";

export const maxDuration = 30;

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file") as File | null;
  if (!file) {
    return Response.json({ error: "No file uploaded" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext !== "pdf" && ext !== "docx") {
    return Response.json({ error: "Unsupported file type" }, { status: 415 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const text = await parseFileToText(buffer, file.name);
  const name = await extractCandidateNameWithAI(
    file.name,
    text,
    process.env.GEMINI_API_KEY || ""
  );

  return Response.json({ name });
}
