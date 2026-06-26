import { parseFileToText, extractEmail, buildCsv } from "@/lib/file-parser";
import { getEmbeddings, getEmbeddingMode } from "@/lib/embedder";
import { scoreOne, scoreMany } from "@/lib/similarity";
import { analyseGaps } from "@/lib/keyword-gap";
import {
  validateJobDescWithAI,
  getCandidateSummaries,
  detectGendersWithAI,
} from "@/lib/summary";
import { setCsvStore } from "@/lib/csv-store";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const ALLOWED_EXTS = new Set(["pdf", "docx"]);
const MAX_FILE_SIZE = 25 * 1024 * 1024;

interface CandidateScore {
  rank: number;
  filename: string;
  score: number;
  score_pct: number;
  keyword_coverage_pct: number;
  hybrid_score: number;
  hybrid_score_pct: number;
  profile_summary?: string;
  is_match?: boolean;
  reason?: string;
  email?: string;
}

interface KeywordGap {
  filename: string;
  matched_keywords: string[];
  missing_keywords: string[];
  match_count: number;
  total_keywords: number;
  coverage_pct: number;
}

function validateExt(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext ? ALLOWED_EXTS.has(ext) : false;
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const jobDesc = (form.get("job_desc") as string) || "";
    const uploads = form.getAll("uploads") as File[];

    const cleanedJd = jobDesc.trim();
    if (!cleanedJd) {
      return Response.json({ detail: "job_desc cannot be empty." }, { status: 400 });
    }

    const { valid } = await validateJobDescWithAI(cleanedJd, process.env.GEMINI_API_KEY || "");
    if (!valid) {
      return Response.json(
        { detail: "Masukkan job description yang benar." },
        { status: 400 }
      );
    }

    if (uploads.length === 0) {
      return Response.json({ detail: "No CV files were uploaded." }, { status: 400 });
    }

    const files: { filename: string; buffer: Buffer }[] = [];
    for (const file of uploads) {
      if (!validateExt(file.name)) {
        return Response.json(
          { detail: `'${file.name}': unsupported type. Allowed: pdf,docx` },
          { status: 415 }
        );
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      if (buffer.length > MAX_FILE_SIZE) {
        return Response.json(
          { detail: `'${file.name}' is too large. Max size: 25 MB` },
          { status: 413 }
        );
      }
      files.push({ filename: file.name, buffer });
    }

    const hfApiKey = process.env.HF_API_KEY || "";

    const parsed: { filename: string; text: string; email: string }[] = [];
    for (const { filename, buffer } of files) {
      const text = await parseFileToText(buffer, filename);
      const email = extractEmail(text);
      parsed.push({ filename, text, email });
    }

    const csv = buildCsv(parsed);
    setCsvStore(csv);

    const candidates = parsed.map((p) => ({ filename: p.filename, text: p.text }));

    const allTexts = [cleanedJd, ...candidates.map((c) => c.text)];
    const allVecs = await getEmbeddings(allTexts, hfApiKey);
    const jdVec = allVecs[0];
    const cvVecs = allVecs.slice(1);

    const similarityResults = candidates.map((c, i) => ({
      filename: c.filename,
      score: scoreOne(jdVec, cvVecs[i]),
    }));

    for (const r of similarityResults) {
      r.score = Math.round(r.score * 1000000) / 1000000;
    }

    const keywordGaps = await analyseGaps(cleanedJd, candidates);

    const embeddingMode = getEmbeddingMode(hfApiKey);

    const gapMap = new Map(keywordGaps.map((g) => [g.filename, g]));

    const SEMANTIC_WEIGHT = 0.7;
    const KEYWORD_WEIGHT = 0.3;

    const { jdGender, candidateGenders } = await detectGendersWithAI(
      cleanedJd,
      candidates,
      process.env.GEMINI_API_KEY || ""
    );

    const scoresPct: Record<string, number> = {};
    const calculatedHybrids: Record<string, number> = {};

    for (const r of similarityResults) {
      const gap = gapMap.get(r.filename);
      const kwCoverage = gap ? gap.coveragePct / 100 : 0;
      let hybrid = SEMANTIC_WEIGHT * r.score + KEYWORD_WEIGHT * kwCoverage;
      hybrid = Math.round(Math.min(1, hybrid) * 1000000) / 1000000;

      const cvGender = candidateGenders[r.filename];
      if (jdGender && cvGender) {
        if (cvGender === jdGender) {
          hybrid = 0.5 + 0.5 * hybrid;
        } else {
          hybrid = 0.5 * hybrid;
        }
        hybrid = Math.round(hybrid * 1000000) / 1000000;
      }

      calculatedHybrids[r.filename] = hybrid;
      scoresPct[r.filename] = Math.round(hybrid * 1000) / 10;
    }

    const summaries = await getCandidateSummaries(
      cleanedJd,
      candidates,
      scoresPct,
      process.env.GEMINI_API_KEY || ""
    );

    const hybridList: CandidateScore[] = [];
    for (const r of similarityResults) {
      const gap = gapMap.get(r.filename);
      const hybrid = calculatedHybrids[r.filename];
      const cSummary = summaries[r.filename] || {};
      const sPct = scoresPct[r.filename];

      let isMatch = cSummary.isMatch !== false;
      let reason = cSummary.reason || "";
      const fallbackReason = "Kandidat memiliki kualifikasi yang cukup relevan dengan kualifikasi pekerjaan yang dicari.";

      if (
        reason === fallbackReason &&
        gap &&
        gap.totalKeywords >= 3 &&
        gap.coveragePct < 15
      ) {
        isMatch = false;
        reason =
          "Kandidat memiliki kecocokan kata kunci yang sangat rendah dengan kualifikasi pekerjaan yang dicari.";
      }

      hybridList.push({
        rank: 0,
        filename: r.filename,
        score: r.score,
        score_pct: Math.round(r.score * 1000) / 10,
        keyword_coverage_pct: gap ? gap.coveragePct : 0,
        hybrid_score: hybrid,
        hybrid_score_pct: sPct,
        profile_summary: cSummary.profileSummary || "",
        is_match: isMatch,
        reason,
        email: parsed.find((p) => p.filename === r.filename)?.email || "",
      });
    }

    hybridList.sort((a, b) => b.hybrid_score - a.hybrid_score);
    hybridList.forEach((c, i) => (c.rank = i + 1));

    const gaps = keywordGaps.map((g) => ({
      filename: g.filename,
      matched_keywords: g.matchedKeywords,
      missing_keywords: g.missingKeywords,
      match_count: g.matchCount,
      total_keywords: g.totalKeywords,
      coverage_pct: g.coveragePct,
    }));

    return Response.json({
      job_desc_preview: cleanedJd,
      total_candidates: candidates.length,
      embedding_mode: embeddingMode,
      rankings: hybridList,
      keyword_gaps: gaps,
    });
  } catch (err) {
    console.error("Analyze error:", err);
    return Response.json(
      { detail: err instanceof Error ? err.message : "Analysis failed" },
      { status: 422 }
    );
  }
}
