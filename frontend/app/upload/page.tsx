"use client";

import { useState } from "react";
import {
    Upload,
    FileText,
    Sparkles,
    Loader2,
    CheckCircle,
    Download,
    AlertCircle,
    Trash2,
    Trophy,
    Search,
    ChevronDown,
    ChevronUp,
    Cpu,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CandidateScore {
    rank: number;
    filename: string;
    score: number;
    score_pct: number;
    keyword_coverage_pct: number;
    hybrid_score: number;
    hybrid_score_pct: number;
}

interface KeywordGap {
    filename: string;
    matched_keywords: string[];
    missing_keywords: string[];
    match_count: number;
    total_keywords: number;
    coverage_pct: number;
}

interface AnalyzeResponse {
    job_desc_preview: string;
    total_candidates: number;
    embedding_mode: string;
    rankings: CandidateScore[];
    keyword_gaps: KeywordGap[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rankColor(rank: number) {
    if (rank === 1) return "text-yellow-500";
    if (rank === 2) return "text-gray-400";
    if (rank === 3) return "text-amber-600";
    return "text-[#81A6C6]";
}

function scoreBar(pct: number) {
    const color =
        pct >= 70 ? "bg-emerald-500" :
        pct >= 40 ? "bg-[#81A6C6]" :
        "bg-red-400";
    return (
        <div className="w-full bg-[#D9CEBF] rounded-full h-2 mt-1">
            <div
                className={`${color} h-2 rounded-full transition-all duration-700`}
                style={{ width: `${Math.min(100, pct)}%` }}
            />
        </div>
    );
}

// ─── Keyword Gap Card ─────────────────────────────────────────────────────────

function GapCard({ gap }: { gap: KeywordGap }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="bg-[#F3E8DA] rounded-2xl p-4">
            <button
                className="w-full flex items-center justify-between text-left"
                onClick={() => setOpen((o) => !o)}
            >
                <span className="font-medium text-[#5A5550] truncate max-w-[220px]">
                    {gap.filename}
                </span>
                <span className="flex items-center gap-2 text-sm text-gray-600 shrink-0">
                    {gap.match_count}/{gap.total_keywords} keywords
                    {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
            </button>

            {open && (
                <div className="mt-4 space-y-3">
                    {gap.matched_keywords.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-emerald-700 mb-1">
                                ✅ Matched ({gap.matched_keywords.length})
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {gap.matched_keywords.map((kw) => (
                                    <span key={kw} className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                        {kw}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {gap.missing_keywords.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-red-600 mb-1">
                                ❌ Missing ({gap.missing_keywords.length})
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {gap.missing_keywords.map((kw) => (
                                    <span key={kw} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                        {kw}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UploadPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [jobDesc, setJobDesc] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isParsed, setIsParsed] = useState(false);
    const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResponse | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
            setIsParsed(false);
            setErrorMessage("");
            setStatusMessage("");
            setAnalyzeResult(null);
        }
    };

    const removeFile = (indexToRemove: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
        setIsParsed(false);
        setErrorMessage("");
        setStatusMessage("");
        setAnalyzeResult(null);
    };

    const downloadCSV = async () => {
        try {
            setStatusMessage("Preparing download...");
            const response = await fetch("/api/v1/documents/csv");
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || "Failed to retrieve CSV file from backend.");
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "parsed_candidates.csv";
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setStatusMessage("CSV file downloaded successfully!");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "An error occurred while downloading the CSV.";
            setErrorMessage(msg);
        }
    };

    const handleUpload = async () => {
        if (files.length === 0) {
            setErrorMessage("Please select at least one CV file first.");
            return;
        }
        setIsLoading(true);
        setErrorMessage("");
        setStatusMessage("Uploading and parsing files...");
        setIsParsed(false);

        try {
            const formData = new FormData();
            files.forEach((file) => formData.append("uploads", file));

            const response = await fetch("/api/v1/documents/parse", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const details = errorData.detail;
                const errorText = Array.isArray(details)
                    ? details.join(", ")
                    : typeof details === "string"
                    ? details
                    : `Upload failed with status code ${response.status}`;
                throw new Error(errorText);
            }

            const data = await response.json();
            setStatusMessage(data.message || `Successfully parsed ${data.total_files} files.`);
            setIsParsed(true);
            await downloadCSV();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "An unexpected error occurred during parsing.";
            setErrorMessage(msg);
        } finally {
            setIsLoading(false);
        }
    };

    // ── AI Analyze ─────────────────────────────────────────────────────────────
    const handleAnalyze = async () => {
        if (files.length === 0) {
            setErrorMessage("Please select at least one CV file first.");
            return;
        }
        if (!jobDesc.trim()) {
            setErrorMessage("Please enter a Job Description first.");
            return;
        }

        setIsAnalyzing(true);
        setErrorMessage("");
        setStatusMessage("🤖 AI is analyzing candidates... this may take 10-30 seconds.");
        setAnalyzeResult(null);

        try {
            const formData = new FormData();
            formData.append("job_desc", jobDesc);
            files.forEach((file) => formData.append("uploads", file));

            const response = await fetch("/api/v1/analyze", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const details = errorData.detail;
                const errorText = Array.isArray(details)
                    ? details.join(", ")
                    : typeof details === "string"
                    ? details
                    : `Analysis failed with status ${response.status}`;
                throw new Error(errorText);
            }

            const data: AnalyzeResponse = await response.json();
            setAnalyzeResult(data);
            setStatusMessage(`✅ Analysis complete! ${data.total_candidates} candidates ranked.`);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "An unexpected error occurred during analysis.";
            setErrorMessage(msg);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <main className="bg-[linear-gradient(to_bottom,#F7F4EE,#AACDDC,#E8DED3,#AACDDC,#F7F4EE)] min-h-screen px-6 pt-28 pb-16">

            {/* TITLE */}
            <div className="text-center">
                <h1 className="text-4xl font-serif text-[#5A5550]">
                    Upload Candidate CV
                </h1>
                <p className="mt-6 text-gray-700 max-w-2xl mx-auto leading-8">
                    Upload multiple candidate resumes (PDF or DOCX),
                    enter the Job Description, and let AI rank them automatically.
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 mt-12 max-w-5xl mx-auto">

                {/* LEFT: CV Upload */}
                <div className="bg-[#E8DED3] rounded-3xl p-6 shadow-xl flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-4">
                            <Upload size={28} />
                            <h2 className="text-2xl font-serif">Upload CV Files</h2>
                        </div>

                        {/* DROPZONE */}
                        <label className="mt-8 border-2 border-dashed border-[#81A6C6] rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-[#F3E8DA] transition">
                            <Upload size={48} className="text-[#81A6C6]" />
                            <p className="mt-6 text-xl text-[#5A5550] font-medium">
                                Drag &amp; Drop CV Here
                            </p>
                            <p className="text-gray-500 mt-2">PDF / DOCX</p>
                            <input
                                id="cv-file-input"
                                type="file"
                                multiple
                                accept=".pdf,.docx"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </label>

                        {/* FILE LIST */}
                        <div className="mt-8 space-y-4 max-h-[300px] overflow-y-auto pr-2">
                            {files.map((file, index) => (
                                <div
                                    key={index}
                                    className="bg-[#F3E8DA] rounded-2xl p-4 flex items-center justify-between gap-4"
                                >
                                    <div className="flex items-center gap-4">
                                        <FileText className="text-[#81A6C6]" />
                                        <div>
                                            <p className="font-medium text-[#5A5550] truncate max-w-[200px]">
                                                {file.name}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {(file.size / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        id={`remove-file-${index}`}
                                        type="button"
                                        onClick={() => removeFile(index)}
                                        className="text-gray-500 hover:text-red-500 p-2 rounded-full hover:bg-[#ebdcc8] transition"
                                        title="Remove file"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ACTIONS */}
                    {files.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-[#D9CEBF] space-y-4">
                            {errorMessage && (
                                <div className="bg-red-50 text-red-700 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                                    <AlertCircle className="shrink-0 mt-0.5" size={18} />
                                    <p className="text-sm">{errorMessage}</p>
                                </div>
                            )}
                            {statusMessage && (
                                <div className="bg-blue-50 text-blue-700 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
                                    {isLoading || isAnalyzing ? (
                                        <Loader2 className="animate-spin shrink-0 mt-0.5" size={18} />
                                    ) : (
                                        <CheckCircle className="text-green-600 shrink-0 mt-0.5" size={18} />
                                    )}
                                    <p className="text-sm">{statusMessage}</p>
                                </div>
                            )}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    id="upload-parse-btn"
                                    type="button"
                                    onClick={handleUpload}
                                    disabled={isLoading || isAnalyzing}
                                    className="flex-1 py-4 rounded-2xl bg-[#81A6C6] text-white font-medium hover:scale-[1.02] hover:bg-[#6c93b5] transition disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 shadow-xl cursor-pointer"
                                >
                                    {isLoading ? (
                                        <><Loader2 className="animate-spin" size={18} /> Parsing...</>
                                    ) : (
                                        <><Upload size={18} /> Upload &amp; Parse CSV</>
                                    )}
                                </button>
                                {isParsed && (
                                    <button
                                        id="download-csv-btn"
                                        type="button"
                                        onClick={downloadCSV}
                                        className="py-4 px-6 rounded-2xl bg-emerald-600 text-white font-medium hover:scale-[1.02] hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-xl cursor-pointer"
                                    >
                                        <Download size={18} /> CSV
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT: Job Description & Analyze */}
                <div className="bg-[#E8DED3] rounded-3xl p-6 shadow-xl flex flex-col">
                    <div className="flex items-center gap-4">
                        <Sparkles size={28} />
                        <h2 className="text-2xl font-serif">Job Description</h2>
                    </div>

                    <textarea
                        id="job-desc-textarea"
                        value={jobDesc}
                        onChange={(e) => setJobDesc(e.target.value)}
                        placeholder="Paste job description here... (e.g. We are looking for a Backend Engineer with Python, FastAPI, Docker experience...)"
                        className="mt-8 w-full h-[240px] rounded-3xl bg-[#F7F4EE] p-6 outline-none resize-none text-gray-700 leading-8"
                    />

                    <button
                        id="analyze-btn"
                        type="button"
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || isLoading}
                        className="mt-8 w-full py-4 rounded-2xl bg-[#81A6C6] text-white text-lg hover:scale-[1.02] hover:bg-[#6c93b5] transition shadow-xl disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 cursor-pointer"
                    >
                        {isAnalyzing ? (
                            <><Loader2 className="animate-spin" size={20} /> Analyzing with AI...</>
                        ) : (
                            <><Search size={20} /> Analyze Candidates</>
                        )}
                    </button>

                    <div className="mt-6 bg-[#F3E8DA] rounded-3xl p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <Cpu size={16} className="text-[#81A6C6]" />
                            <h3 className="text-sm font-semibold text-[#5A5550]">AI Engine</h3>
                        </div>
                        <p className="text-sm text-gray-600 leading-6">
                            Uses <strong>sentence-transformers</strong> (all-MiniLM-L6-v2) for semantic
                            similarity + keyword gap analysis. Runs locally — no API cost.
                        </p>
                    </div>
                </div>
            </div>

            {/* RESULTS SECTION */}
            {analyzeResult && (
                <div className="mt-16 max-w-5xl mx-auto space-y-8">

                    {/* Header */}
                    <div className="text-center">
                        <h2 className="text-3xl font-serif text-[#5A5550]">
                            Analysis Results
                        </h2>
                        <p className="mt-2 text-gray-600">
                            {analyzeResult.total_candidates} candidates ranked •{" "}
                            <span className="inline-flex items-center gap-1">
                                <Cpu size={13} />
                                {analyzeResult.embedding_mode === "sentence-transformers"
                                    ? "sentence-transformers (local)"
                                    : "TF-IDF (fallback)"}
                            </span>
                        </p>
                    </div>

                    {/* Rankings */}
                    <div className="bg-[#E8DED3] rounded-3xl p-6 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <Trophy size={24} className="text-yellow-500" />
                            <h3 className="text-2xl font-serif">Candidate Rankings</h3>
                        </div>

                        <div className="space-y-4">
                            {analyzeResult.rankings.map((c) => (
                                <div key={c.filename} className="bg-[#F3E8DA] rounded-2xl p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className={`text-2xl font-bold ${rankColor(c.rank)}`}>
                                                #{c.rank}
                                            </span>
                                            <span className="font-medium text-[#5A5550] truncate max-w-[200px]">
                                                {c.filename}
                                            </span>
                                        </div>
                                        <span className="text-xl font-bold text-[#5A5550]">
                                            {c.hybrid_score_pct}%
                                        </span>
                                    </div>

                                    {/* Hybrid score bar */}
                                    <div className="mb-1">
                                        <div className="flex justify-between text-xs text-gray-500 mb-0.5">
                                            <span>Hybrid Score</span>
                                            <span>{c.hybrid_score_pct}%</span>
                                        </div>
                                        {scoreBar(c.hybrid_score_pct)}
                                    </div>

                                    {/* Sub-scores */}
                                    <div className="grid grid-cols-2 gap-3 mt-3 text-xs text-gray-600">
                                        <div>
                                            <span>Semantic Similarity: </span>
                                            <span className="font-semibold">{c.score_pct}%</span>
                                        </div>
                                        <div>
                                            <span>Keyword Coverage: </span>
                                            <span className="font-semibold">{c.keyword_coverage_pct}%</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Keyword Gap */}
                    <div className="bg-[#E8DED3] rounded-3xl p-6 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <Search size={24} className="text-[#81A6C6]" />
                            <h3 className="text-2xl font-serif">Keyword Gap Analysis</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            Click a candidate to see which JD keywords they have or are missing.
                        </p>
                        <div className="space-y-3">
                            {analyzeResult.keyword_gaps.map((gap) => (
                                <GapCard key={gap.filename} gap={gap} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}