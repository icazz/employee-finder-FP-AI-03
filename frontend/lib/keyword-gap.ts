const STOPWORDS = new Set(`
a about above after again against all also am an and any are aren't as at be
because been before being below between both but by can can't cannot could
couldn't did didn't do does doesn't doing don't down during each few for from
further get got had hadn't has hasn't have haven't having he he'd he'll he's
her here here's hers herself him himself his how how's i i'd i'll i'm i've if
in into is isn't it it's its itself let's me more most mustn't my myself no
nor not of off on once only or other ought our ours ourselves out over own
same shan't she she'd she'll she's should shouldn't so some such than that
that's the their theirs them themselves then there there's these they they'd
they'll they're they've this those through to too under until up very was
wasn't we we'd we'll we're we've were weren't what what's when when's where
where's which while who who's whom why why's will with won't would wouldn't
you you'd you'll you're you've your yours yourself yourselves
dan di ke dari dalam dengan untuk pada yang adalah bisa dapat memiliki mempunyai
yaitu atau sebagai akan telah sudah oleh serta bahwa ialah itu ini juga saya
kami mereka ia dia kita anda kamu secara dengan untuk
`.split(/\s+/));

const GENERIC_TOKENS = new Set([
  "experience", "ability", "knowledge", "understanding", "skill", "skills",
  "work", "working", "team", "years", "year", "good", "strong", "excellent",
  "required", "preferred", "plus", "must", "like", "using", "used", "use",
  "etc", "eg", "ie", "also", "including", "include", "includes",
  "pengalaman", "kemampuan", "pengetahuan", "pemahaman", "keterampilan",
  "kerja", "bekerja", "tim", "tahun", "baik", "kuat", "luar", "biasa",
  "dibutuhkan", "diutamakan", "harus", "seperti", "menggunakan", "digunakan",
  "dll", "dlsb", "memiliki", "mempunyai", "mencapai", "membuat",
]);

function tokenise(text: string): string[] {
  return (text.toLowerCase().match(/[a-z][a-z0-9+#.\-]*/g) || []);
}

function isValidToken(tok: string): boolean {
  if (tok.length < 2) return false;
  if (STOPWORDS.has(tok)) return false;
  if (GENERIC_TOKENS.has(tok)) return false;
  if (/^\d+$/.test(tok)) return false;
  return true;
}

function extractNgrams(tokens: string[], n: number): string[] {
  const result: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    result.push(tokens.slice(i, i + n).join(" "));
  }
  return result;
}

function localKeywordExtraction(jobDesc: string): string[] {
  const tokens = tokenise(jobDesc);
  const jdLower = jobDesc.toLowerCase();

  const unigrams = tokens.filter(isValidToken);
  const bigrams = extractNgrams(tokens, 2).filter(
    (bg) => bg.split(" ").every((w) => isValidToken(w)) && jdLower.includes(bg)
  );
  const trigrams = extractNgrams(tokens, 3).filter(
    (tg) =>
      tg.split(" ").every((w) => isValidToken(w)) &&
      jdLower.split(tg).length - 1 >= 2
  );

  const allCandidates = [...trigrams, ...bigrams, ...unigrams];
  const seen = new Set<string>();
  const selected: string[] = [];

  for (const kw of allCandidates) {
    if (seen.has(kw)) continue;
    const subsumed = selected.some((chosen) => chosen.includes(kw));
    if (!subsumed) {
      selected.push(kw);
      seen.add(kw);
    }
  }

  const final: string[] = [];
  for (const kw of selected) {
    if (!kw.includes(" ")) {
      if (selected.some((s) => s.includes(" ") && s.includes(kw))) continue;
    }
    final.push(kw);
  }

  final.sort((a, b) => b.split(" ").length - a.split(" ").length || a.localeCompare(b));
  return [...new Set(final)].slice(0, 50);
}

async function aiKeywordExtraction(
  jobDesc: string,
  anthropicApiKey: string
): Promise<string[] | null> {
  if (!anthropicApiKey) return null;

  const prompt = `You are a skilled HR analyst.
Extract a comprehensive list of skills, tools, technologies, frameworks,
certifications, and domain-specific keywords from the following Job Description.
Return ONLY a valid JSON array of strings (lowercase, no duplicates).
Aim for 20–40 items. Do not include generic words like "experience" or "team".

Job Description:
${jobDesc}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const text: string = data.content?.[0]?.text || "";
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return null;

    const keywords: string[] = JSON.parse(match[0]);
    return keywords
      .filter((k) => typeof k === "string")
      .map((k) => k.toLowerCase().trim());
  } catch {
    return null;
  }
}

async function extractJdKeywords(
  jobDesc: string,
  anthropicApiKey: string
): Promise<string[]> {
  const ai = await aiKeywordExtraction(jobDesc, anthropicApiKey);
  if (ai && ai.length > 0) return ai;
  return localKeywordExtraction(jobDesc);
}

export interface KeywordGapResult {
  filename: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  matchCount: number;
  totalKeywords: number;
  coveragePct: number;
}

export async function analyseGaps(
  jobDesc: string,
  candidates: { filename: string; text: string }[]
): Promise<KeywordGapResult[]> {
  let keywords = await aiKeywordExtraction(jobDesc, process.env.ANTHROPIC_API_KEY || "");
  if (!keywords || keywords.length === 0) {
    keywords = localKeywordExtraction(jobDesc);
  }

  return candidates.map(({ filename, text }) => {
    const cvLower = text.toLowerCase();
    const matched: string[] = [];
    const missing: string[] = [];

    for (const kw of keywords) {
      if (cvLower.includes(kw.toLowerCase())) {
        matched.push(kw);
      } else {
        missing.push(kw);
      }
    }

    const total = keywords.length;
    const coverage = total > 0 ? Math.round((matched.length / total) * 1000) / 10 : 0;

    return {
      filename,
      matchedKeywords: matched.sort(),
      missingKeywords: missing.sort(),
      matchCount: matched.length,
      totalKeywords: total,
      coveragePct: coverage,
    };
  });
}
