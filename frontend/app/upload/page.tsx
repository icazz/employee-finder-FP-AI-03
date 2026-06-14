"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Upload,
    FileText,
    Sparkles,
    Loader2,
    CheckCircle,
    Download,
    AlertCircle,
    Trash2,
    Search,
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UploadPage() {
    const router = useRouter();
    const [files, setFiles] = useState<File[]>([]);
    const [jobDesc, setJobDesc] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isParsed, setIsParsed] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = e.target.files;
        if (newFiles) {
            setFiles((prev) => [...prev, ...Array.from(newFiles)]);
            setErrorMessage("");
            setStatusMessage("");
        }
    };

    const removeFile = (indexToRemove: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
        setIsParsed(false);
        setErrorMessage("");
        setStatusMessage("");
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
            setStatusMessage(`✅ Analysis complete! ${data.total_candidates} candidates ranked.`);
            
            // Save to localStorage and navigate to results page
            localStorage.setItem("analysisResults", JSON.stringify(data));
            setTimeout(() => {
                router.push("/results");
            }, 1500);
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
                            <p className="text-gray-500 mt-2">PDF / DOCX / CSV</p>
                            <input
                                id="cv-file-input"
                                type="file"
                                multiple
                                accept=".pdf,.docx,.csv"
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
                                        <><FileText size={18} /> Preview CSV</>
                                    )}
                                </button>
                                {isParsed && (
                                    <button
                                        id="download-csv-btn"
                                        type="button"
                                        onClick={downloadCSV}
                                        className="flex-1 py-4 rounded-2xl bg-emerald-600 text-white font-medium hover:scale-[1.02] hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-xl cursor-pointer"
                                    >
                                        <Download size={18} /> Download CSV
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
                            Performs semantic similarity analysis + keyword gap detection. Runs locally — no API cost.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}