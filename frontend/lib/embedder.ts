function cleanText(text: string): string {
  text = text.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, " ");
  return text.replace(/\s+/g, " ").trim();
}

async function hfApiEmbeddings(
  texts: string[],
  hfApiKey: string
): Promise<number[][] | null> {
  if (!hfApiKey) return null;

  const model = "intfloat/multilingual-e5-base";
  const url = `https://api-inference.huggingface.co/models/${model}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: texts }),
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) return null;

    const data: unknown = await res.json();

    if (Array.isArray(data) && data.length > 0) {
      if (Array.isArray(data[0])) {
        const first = data[0] as unknown[];
        if (first.length > 0 && Array.isArray(first[0])) {
          const tokenEmbs = data as number[][][];
          return tokenEmbs.map((textEmb) => {
            const dim = textEmb[0].length;
            const avg = new Array(dim).fill(0);
            for (const tok of textEmb) {
              for (let i = 0; i < dim; i++) avg[i] += tok[i];
            }
            return avg.map((v) => v / textEmb.length);
          });
        }
        return data as number[][];
      }
      if (typeof data[0] === "number") return [data as number[]];
    }
    return null;
  } catch {
    return null;
  }
}

function tfidfEmbeddings(texts: string[]): number[][] {
  const tokenized = texts.map((t) =>
    t.toLowerCase().split(/[^a-zA-Z0-9]+/).filter(Boolean)
  );

  const allTokens = new Set<string>();
  for (const tokens of tokenized) {
    for (const tok of tokens) allTokens.add(tok);
  }
  const vocab = Array.from(allTokens);
  const docCount = texts.length;

  const idf: number[] = vocab.map((term) => {
    let df = 0;
    for (const tokens of tokenized) {
      if (tokens.includes(term)) df++;
    }
    return Math.log((docCount + 1) / (df + 1)) + 1;
  });

  const vectors: number[][] = tokenized.map((tokens) => {
    const tf = new Array(vocab.length).fill(0);
    for (const tok of tokens) {
      const idx = vocab.indexOf(tok);
      if (idx !== -1) tf[idx] += 1;
    }
    const maxFreq = Math.max(...tf, 1);
    return vocab.map((_, i) => (tf[i] / maxFreq) * idf[i]);
  });

  for (const vec of vectors) {
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
    if (norm > 0) {
      for (let i = 0; i < vec.length; i++) vec[i] /= norm;
    }
  }

  return vectors;
}

export async function getEmbeddings(
  texts: string[],
  hfApiKey: string
): Promise<number[][]> {
  const cleaned = texts.map(cleanText);

  const hf = await hfApiEmbeddings(cleaned, hfApiKey);
  if (hf) return hf;

  return tfidfEmbeddings(cleaned);
}

export function getEmbeddingMode(hfApiKey: string): string {
  if (hfApiKey) return "huggingface-api";
  return "tfidf";
}
