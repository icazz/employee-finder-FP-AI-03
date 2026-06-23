function geminiFetch(prompt: string, apiKey: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    }),
    signal: AbortSignal.timeout(20000),
  });
}

export async function validateJobDescWithAI(
  jobDesc: string,
  geminiApiKey: string
): Promise<{ valid: boolean; reason?: string }> {
  if (!geminiApiKey) return { valid: true };

  const prompt = `Analyze if this text is a valid job description.
Return JSON: {"valid": true/false, "reason": "..."}

Text: "${jobDesc.slice(0, 1000)}"`;

  try {
    const res = await geminiFetch(prompt, geminiApiKey);
    if (!res.ok) return { valid: true };
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const parsed = JSON.parse(text);
    return { valid: parsed.valid !== false, reason: parsed.reason };
  } catch {
    return { valid: true };
  }
}

function detectJdGenderLocal(text: string): string | null {
  const lower = text.toLowerCase();
  const hasFemale =
    /\bspg\b/.test(lower) ||
    /sales promotion girl/.test(lower) ||
    /wanita/.test(lower) ||
    /perempuan/.test(lower) ||
    /cantik/.test(lower);
  const hasMale =
    /\bspb\b/.test(lower) ||
    /sales promotion boy/.test(lower) ||
    /pria/.test(lower) ||
    /laki-laki/.test(lower) ||
    /tampan/.test(lower);

  if (hasFemale && hasMale) return null;
  if (hasFemale) return "female";
  if (hasMale) return "male";
  return null;
}

function detectCvGenderLocal(text: string): string | null {
  const lower = text.toLowerCase();
  if (/perempuan/.test(lower) || /wanita/.test(lower)) return "female";
  if (/laki-laki/.test(lower) || /pria/.test(lower)) return "male";
  return null;
}

export async function detectGendersWithAI(
  jobDesc: string,
  candidates: { filename: string; text: string }[],
  geminiApiKey: string
): Promise<{
  jdGender: string | null;
  candidateGenders: Record<string, string | null>;
}> {
  if (!geminiApiKey) {
    const jdGender = detectJdGenderLocal(jobDesc);
    const candidateGenders: Record<string, string | null> = {};
    for (const { filename, text } of candidates) {
      candidateGenders[filename] = detectCvGenderLocal(text);
    }
    return { jdGender, candidateGenders };
  }

  const candidatesListStr = candidates
    .map(({ filename, text }) => `--- FILENAME: ${filename} ---\n${text.slice(0, 1000)}`)
    .join("\n");

  const prompt = `Analyze the following Job Description and Candidate CVs to extract gender requirements and candidate genders.

Job Description:
${jobDesc.slice(0, 1500)}

Candidates:
${candidatesListStr}

Rules:
1. For the Job Description, determine if there is an explicit or implicit gender preference. Return "male", "female", or "none".
2. For each candidate, determine their gender based on their name, pronouns, or any explicit details in the CV snippet. Return "male", "female", or "unknown".

Return ONLY a valid JSON object matching the following structure:
{
  "job_desc_gender_preference": "male" | "female" | "none",
  "candidates": [
    { "filename": "candidate_file.pdf", "gender": "male" | "female" | "unknown" }
  ]
}`;

  try {
    const res = await geminiFetch(prompt, geminiApiKey);
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const parsed = JSON.parse(rawText);

    const jdG = parsed.job_desc_gender_preference;
    const jdGender = jdG === "male" || jdG === "female" ? jdG : null;

    const candidateGenders: Record<string, string | null> = {};
    for (const item of parsed.candidates || []) {
      const g = item.gender;
      candidateGenders[item.filename] = g === "male" || g === "female" ? g : null;
    }

    for (const { filename, text } of candidates) {
      if (!(filename in candidateGenders)) {
        candidateGenders[filename] = detectCvGenderLocal(text);
      }
    }

    return { jdGender, candidateGenders };
  } catch {
    const jdGender = detectJdGenderLocal(jobDesc);
    const candidateGenders: Record<string, string | null> = {};
    for (const { filename, text } of candidates) {
      candidateGenders[filename] = detectCvGenderLocal(text);
    }
    return { jdGender, candidateGenders };
  }
}

function fallbackSummary(
  filename: string,
  cvText: string,
  scorePct: number
): { filename: string; profileSummary: string; isMatch: boolean; reason: string } {
  const match = cvText.match(/ringkasan profil([\s\S]*?)pengalaman kerja/i);
  let summaryText = match?.[1]?.trim() || cvText.trim().slice(0, 150);
  if (cvText.length > 150) summaryText += "...";

  summaryText = summaryText.replace(/\s+/g, " ");
  if (summaryText.length > 200) summaryText = summaryText.slice(0, 197) + "...";

  const isMatch = scorePct >= 40;
  const reason = isMatch
    ? "Kandidat memiliki kualifikasi yang cukup relevan dengan kualifikasi pekerjaan yang dicari."
    : "Kandidat kurang relevan dengan spesifikasi pekerjaan yang dicari.";

  return { filename, profileSummary: summaryText, isMatch, reason };
}

export async function getCandidateSummaries(
  jobDesc: string,
  candidates: { filename: string; text: string }[],
  scoresPct: Record<string, number>,
  geminiApiKey: string
): Promise<
  Record<string, { profileSummary: string; isMatch: boolean; reason: string }>
> {
  if (!geminiApiKey) {
    const result: Record<string, any> = {};
    for (const { filename, text } of candidates) {
      result[filename] = fallbackSummary(filename, text, scoresPct[filename] || 0);
    }
    return result;
  }

  const candidatesListStr = candidates
    .map(
      ({ filename, text }) =>
        `--- FILENAME: ${filename} ---\nSkor: ${scoresPct[filename] || 0}%\n${text.slice(0, 2000)}`
    )
    .join("\n");

  const prompt = `You are an expert HR recruitment assistant.
Analyze the following candidates for the Job Description.

Job Description:
${jobDesc.slice(0, 3000)}

Candidates to analyze:
${candidatesListStr}

For each candidate:
1. Write a concise, professional 2-3 sentence profile summary in Indonesian ("profile_summary").
2. Determine if the candidate is a match ("is_match": true/false) based on whether their profile, skills, and background are relevant to the Job Description. If their background is completely unrelated (e.g. a Graphic Designer or SPG applying for a Backend Engineer job), set "is_match" to false.
3. Write a clear, polite explanation in "reason" (in Indonesian) explaining why they match or why they do not match.

Return ONLY a valid JSON object with the following format:
{
  "candidates": [
    {
      "filename": "candidate_file.pdf",
      "profile_summary": "Rangkuman profil singkat...",
      "is_match": true,
      "reason": "Alasan..."
    }
  ]
}`;

  try {
    const res = await geminiFetch(prompt, geminiApiKey);
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const parsed = JSON.parse(rawText);

    const result: Record<string, any> = {};
    for (const item of parsed.candidates || []) {
      result[item.filename] = {
        profileSummary: item.profile_summary || "",
        isMatch: item.is_match !== false,
        reason: item.reason || "",
      };
    }

    for (const { filename, text } of candidates) {
      if (!result[filename]) {
        result[filename] = fallbackSummary(filename, text, scoresPct[filename] || 0);
      }
    }

    return result;
  } catch {
    const result: Record<string, any> = {};
    for (const { filename, text } of candidates) {
      result[filename] = fallbackSummary(filename, text, scoresPct[filename] || 0);
    }
    return result;
  }
}

export async function extractCandidateNameWithAI(
  filename: string,
  text: string,
  geminiApiKey: string
): Promise<string> {
  if (!geminiApiKey) {
    const nameMatch = text.match(/nama\s*[:\-]\s*([^\n]+)/i);
    return nameMatch ? nameMatch[1].trim() : filename.replace(/\.(pdf|docx)$/i, "").replace(/[-_]/g, " ");
  }

  const prompt = `Extract the candidate's full name from this CV text.
Return ONLY a valid JSON: {"name": "..."}

CV:
${text.slice(0, 2000)}`;

  try {
    const res = await geminiFetch(prompt, geminiApiKey);
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const parsed = JSON.parse(rawText);
    return parsed.name || filename;
  } catch {
    return filename.replace(/\.(pdf|docx)$/i, "").replace(/[-_]/g, " ");
  }
}
