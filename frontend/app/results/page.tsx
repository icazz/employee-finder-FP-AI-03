"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    Trophy,
    ChevronDown,
    ChevronUp,
    Download,
    ArrowLeft,
    Loader2,
    AlertCircle,
    FileDown,
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

interface AnalysisData {
    job_desc_preview: string;
    total_candidates: number;
    embedding_mode: string;
    rankings: CandidateScore[];
    keyword_gaps: KeywordGap[];
}

function rankColor(rank: number) {
    if (rank === 1) return "text-yellow-500";
    if (rank === 2) return "text-gray-400";
    if (rank === 3) return "text-amber-600";
    return "text-[#81A6C6]";
}

function rankBgColor(rank: number) {
    if (rank === 1) return "bg-yellow-50";
    if (rank === 2) return "bg-gray-50";
    if (rank === 3) return "bg-amber-50";
    return "bg-[#F3E8DA]";
}

function scoreBar(pct: number) {
    const color =
        pct >= 70 ? "bg-emerald-500" :
        pct >= 40 ? "bg-[#81A6C6]" :
        "bg-red-400";
    return (
        <div className="w-full bg-[#D9CEBF] rounded-full h-3 mt-2">
            <div
                className={`${color} h-3 rounded-full transition-all duration-700`}
                style={{ width: `${Math.min(100, pct)}%` }}
            />
        </div>
    );
}

function RankingCard({ candidate, gap }: { candidate: CandidateScore; gap?: KeywordGap }) {
    const [open, setOpen] = useState(false);

    return (
        <div className={`${rankBgColor(candidate.rank)} rounded-2xl p-6 shadow-md border-l-4 ${candidate.rank === 1 ? "border-yellow-500" : candidate.rank === 2 ? "border-gray-400" : candidate.rank === 3 ? "border-amber-600" : "border-[#81A6C6]"}`}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        <span className={`text-3xl font-bold ${rankColor(candidate.rank)}`}>
                            #{candidate.rank}
                        </span>
                        <div>
                            <h3 className="text-lg font-semibold text-[#5A5550]">
                                {candidate.filename}
                            </h3>
                            {gap && (
                                <p className="text-xs text-gray-600">
                                    {gap.match_count}/{gap.total_keywords} keywords matched
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                            <p className="text-xs text-gray-600 mb-1">Semantic Similarity</p>
                            <p className="text-xl font-bold text-[#81A6C6]">
                                {candidate.score_pct}%
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-600 mb-1">Keyword Coverage</p>
                            <p className="text-xl font-bold text-emerald-600">
                                {candidate.keyword_coverage_pct}%
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-600 mb-1">Hybrid Score</p>
                            <p className="text-2xl font-bold text-[#5A5550]">
                                {candidate.hybrid_score_pct}%
                            </p>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold text-gray-700">Overall Match</span>
                            <span className="text-xs font-bold text-gray-600">{candidate.hybrid_score_pct}%</span>
                        </div>
                        {scoreBar(candidate.hybrid_score_pct)}
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-4xl font-bold text-[#5A5550] mb-2">
                        {candidate.hybrid_score_pct}%
                    </div>
                </div>
            </div>

            {gap && (
                <>
                    <button
                        onClick={() => setOpen(!open)}
                        className="mt-4 w-full flex items-center justify-between text-left py-2 px-3 hover:bg-white/50 rounded-lg transition"
                    >
                        <span className="text-sm font-semibold text-[#5A5550]">
                            Keyword Analysis
                        </span>
                        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>

                    {open && (
                        <div className="mt-4 space-y-3 border-t pt-4">
                            {gap.matched_keywords.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-emerald-700 mb-2">
                                        ✅ Matched Keywords ({gap.matched_keywords.length}/{gap.total_keywords})
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {gap.matched_keywords.map((kw) => (
                                            <span
                                                key={kw}
                                                className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full"
                                            >
                                                {kw}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default function ResultsPage() {
    const router = useRouter();
    const reportRef = useRef<HTMLDivElement>(null);
    const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

    useEffect(() => {
        const loadResults = async () => {
            try {
                const stored = localStorage.getItem("analysisResults");
                if (stored) {
                    setAnalysisData(JSON.parse(stored));
                } else {
                    setError("No analysis results found. Please run an analysis first.");
                }
            } catch (err) {
                setError("Failed to load results");
            } finally {
                setIsLoading(false);
            }
        };

        loadResults();
    }, []);

    const downloadCSV = async () => {
        try {
            const response = await fetch("/api/v1/documents/csv");
            if (!response.ok) {
                throw new Error("Failed to download CSV");
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
        } catch (err) {
            setError("Failed to download CSV file");
        }
    };

    const downloadPDF = async () => {
        if (!reportRef.current) {
            setError("Report content not found. Please reload the page.");
            return;
        }
        
        setIsDownloadingPdf(true);
        try {
            const element = reportRef.current;
            
            // Create a clone and aggressively strip problematic CSS
            const clonedElement = element.cloneNode(true) as HTMLElement;
            
            // Remove all class attributes to bypass Tailwind CSS completely
            const walkAndClean = (el: HTMLElement) => {
                el.querySelectorAll("*").forEach((node) => {
                    const elem = node as HTMLElement;
                    
                    // Remove classes to bypass Tailwind
                    elem.removeAttribute("class");
                    
                    // Remove style attributes and rebuild with safe properties only
                    const computed = window.getComputedStyle(elem);
                    elem.style.cssText = "";
                    
                    // List of CSS properties that are safe and needed
                    const cssProperties = [
                        { name: "color", prop: "color" },
                        { name: "backgroundColor", prop: "background-color" },
                        { name: "fontSize", prop: "font-size" },
                        { name: "fontWeight", prop: "font-weight" },
                        { name: "lineHeight", prop: "line-height" },
                        { name: "marginTop", prop: "margin-top" },
                        { name: "marginRight", prop: "margin-right" },
                        { name: "marginBottom", prop: "margin-bottom" },
                        { name: "marginLeft", prop: "margin-left" },
                        { name: "paddingTop", prop: "padding-top" },
                        { name: "paddingRight", prop: "padding-right" },
                        { name: "paddingBottom", prop: "padding-bottom" },
                        { name: "paddingLeft", prop: "padding-left" },
                        { name: "textAlign", prop: "text-align" },
                        { name: "borderRadius", prop: "border-radius" },
                        { name: "display", prop: "display" },
                        { name: "width", prop: "width" },
                        { name: "height", prop: "height" },
                        { name: "minHeight", prop: "min-height" },
                        { name: "borderTopWidth", prop: "border-top-width" },
                        { name: "borderRightWidth", prop: "border-right-width" },
                        { name: "borderBottomWidth", prop: "border-bottom-width" },
                        { name: "borderLeftWidth", prop: "border-left-width" },
                        { name: "borderTopColor", prop: "border-top-color" },
                        { name: "borderRightColor", prop: "border-right-color" },
                        { name: "borderBottomColor", prop: "border-bottom-color" },
                        { name: "borderLeftColor", prop: "border-left-color" },
                        { name: "gap", prop: "gap" },
                    ];
                    
                    cssProperties.forEach(({ name, prop }) => {
                        try {
                            let value = computed.getPropertyValue(prop).trim();
                            
                            if (!value) return;
                            
                            // Sanitize color values - replace modern CSS color functions with hex
                            value = value
                                .replace(/lab\([^)]*\)/gi, "#D9CEBF")
                                .replace(/lch\([^)]*\)/gi, "#D9CEBF")
                                .replace(/oklch\([^)]*\)/gi, "#D9CEBF")
                                .replace(/oklab\([^)]*\)/gi, "#D9CEBF")
                                .replace(/color\([^)]*\)/gi, "#D9CEBF")
                                .replace(/hwb\([^)]*\)/gi, "#D9CEBF");
                            
                            elem.style.setProperty(prop, value, "important");
                        } catch (e) {
                            // Skip problematic properties
                        }
                    });
                });
            };
            
            walkAndClean(clonedElement);
            
            const tempContainer = document.createElement("div");
            tempContainer.style.position = "absolute";
            tempContainer.style.left = "-9999px";
            tempContainer.style.top = "-9999px";
            tempContainer.style.width = element.offsetWidth + "px";
            tempContainer.style.backgroundColor = "#F3E8DA";
            document.body.appendChild(tempContainer);
            tempContainer.appendChild(clonedElement);
            
            const canvas = await html2canvas(clonedElement, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: "#F3E8DA",
                logging: false,
                windowHeight: clonedElement.scrollHeight,
                windowWidth: clonedElement.scrollWidth,
                removeContainer: false,
            });
            
            // Clean up temporary container
            document.body.removeChild(tempContainer);
            
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            });
            
            const imgWidth = 190; // A4 width minus margins
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;
            
            // Add first page
            pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
            
            // Add additional pages if needed
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            
            pdf.save("candidate_rankings.pdf");
            setError("");
            setIsDownloadingPdf(false);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Unknown error occurred";
            console.error("PDF Download Error:", errorMsg);
            setError(`Failed to generate PDF: ${errorMsg}`);
            setIsDownloadingPdf(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#F3E8DA] to-[#E8DED3] flex items-center justify-center">
                <Loader2 className="animate-spin" size={48} />
            </div>
        );
    }

    if (error || !analysisData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#F3E8DA] to-[#E8DED3] p-6">
                <button
                    onClick={() => router.back()}
                    className="mb-6 flex items-center gap-2 text-[#5A5550] hover:text-[#81A6C6] transition"
                >
                    <ArrowLeft size={20} /> Back
                </button>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4">
                    <AlertCircle className="text-red-600 shrink-0 mt-1" size={24} />
                    <div>
                        <h2 className="font-semibold text-red-900">Error</h2>
                        <p className="text-red-800">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F3E8DA] to-[#E8DED3] p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <button
                    onClick={() => router.back()}
                    className="mb-6 flex items-center gap-2 text-[#5A5550] hover:text-[#81A6C6] transition"
                >
                    <ArrowLeft size={20} /> Back to Upload
                </button>

                <div ref={reportRef} className="space-y-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Trophy size={32} className="text-yellow-500" />
                            <h1 className="text-4xl font-serif font-bold text-[#5A5550]">
                                Candidate Rankings
                            </h1>
                        </div>
                        <p className="text-gray-600">
                            {analysisData.total_candidates} candidates analyzed • {analysisData.embedding_mode}
                        </p>
                    </div>

                    {/* Job Description Preview */}
                    {analysisData.job_desc_preview && (
                        <div className="bg-white rounded-2xl p-6 shadow-md border-l-4 border-[#81A6C6]">
                            <h2 className="text-lg font-semibold text-[#5A5550] mb-3">Job Description</h2>
                            <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
                                {analysisData.job_desc_preview}
                            </p>
                        </div>
                    )}

                    {/* Rankings */}
                    <div className="space-y-4">
                        {analysisData.rankings.map((candidate) => {
                            const gap = analysisData.keyword_gaps.find(
                                (g) => g.filename === candidate.filename
                            );
                            return (
                                <RankingCard
                                    key={candidate.filename}
                                    candidate={candidate}
                                    gap={gap}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Download Buttons */}
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={downloadCSV}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium shadow-md"
                    >
                        <Download size={20} /> Export CSV
                    </button>
                    <button
                        onClick={downloadPDF}
                        disabled={isDownloadingPdf}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-[#81A6C6] text-white rounded-lg hover:bg-[#6c93b5] transition font-medium shadow-md disabled:opacity-50"
                    >
                        {isDownloadingPdf ? (
                            <>
                                <Loader2 className="animate-spin" size={20} /> Generating PDF...
                            </>
                        ) : (
                            <>
                                <FileDown size={20} /> Download PDF Report
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
