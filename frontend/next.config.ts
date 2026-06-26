import type { NextConfig } from "next";
import { existsSync } from "fs";
import { resolve } from "path";

// The project's .env file lives at the repository root (one level above the
// Next.js app). Next.js only auto-loads .env files inside this directory, so
// explicitly load the parent one so API routes receive GEMINI_API_KEY,
// HF_API_KEY, SMTP_USER, etc. when running `npm run dev` locally.
const parentEnv = resolve(process.cwd(), "../.env");
if (existsSync(parentEnv)) {
  try {
    process.loadEnvFile(parentEnv);
  } catch {
    // Ignore parse errors; user may provide env vars another way.
  }
}

const nextConfig: NextConfig = {
  // pdfjs-dist loads its worker via dynamic file paths that webpack/Turbopack
  // cannot resolve when bundled. Keeping pdfjs-dist and pdf-parse external lets
  // Node.js resolve the worker normally in server code.
  serverExternalPackages: ["pdfjs-dist", "pdf-parse"],
};

export default nextConfig;
