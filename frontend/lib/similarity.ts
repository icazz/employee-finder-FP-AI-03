export interface CandidateResult {
  filename: string;
  score: number;
  scorePct: number;
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;

  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;

  return Math.max(0, Math.min(1, dot / denom));
}

export function scoreOne(
  jdVec: number[],
  cvVec: number[]
): number {
  return cosineSimilarity(jdVec, cvVec);
}

export function scoreMany(
  jdVec: number[],
  cvTexts: string[],
  allVecs: number[][]
): CandidateResult[] {
  if (cvTexts.length === 0) return [];

  const filenames = cvTexts;

  const results: CandidateResult[] = [];
  for (let i = 0; i < filenames.length; i++) {
    const raw = cosineSimilarity(jdVec, allVecs[i + 1]);
    results.push({
      filename: filenames[i],
      score: Math.round(raw * 1000000) / 1000000,
      scorePct: Math.round(raw * 1000) / 10,
    });
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}
