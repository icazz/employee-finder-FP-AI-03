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
    UserCheck,
    Mail,
    CheckCircle,
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
    profile_summary?: string;
    is_match?: boolean;
    reason?: string;
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

function RankingCard({ candidate, gap, onInvite, isInvited }: { candidate: CandidateScore; gap?: KeywordGap; onInvite?: (candidate: CandidateScore) => void; isInvited?: boolean }) {
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
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-lg font-semibold text-[#5A5550]">
                                    {candidate.filename}
                                </h3>
                                {candidate.profile_summary && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm ${candidate.is_match ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                                        {candidate.is_match ? "MATCH" : "NOT MATCH"}
                                    </span>
                                )}
                            </div>
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

                <div className="text-right flex flex-col items-end gap-3">
                    <div className="text-4xl font-bold text-[#5A5550] mb-2">
                        {candidate.hybrid_score_pct}%
                    </div>
                    {onInvite && (
                        <button
                            onClick={() => onInvite(candidate)}
                            disabled={isInvited}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition shadow-md hover:scale-[1.02] ${isInvited
                                ? "bg-emerald-100 text-emerald-700 cursor-default"
                                : "bg-[#81A6C6] text-white hover:bg-[#6c93b5]"
                                }`}
                        >
                            {isInvited ? (
                                <>
                                    <CheckCircle size={16} />
                                    Berkas Diloloskan
                                </>
                            ) : (
                                <>
                                    <Mail size={16} />
                                    Loloskan
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* AI Summary and Evaluation */}
            {candidate.profile_summary && (
                <div className="mt-4 bg-white/60 p-4 rounded-xl border border-white/50 space-y-3 shadow-inner">
                    <div>
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ringkasan Profil (AI)</h4>
                        <p className="text-sm text-gray-700 leading-relaxed mt-0.5">{candidate.profile_summary}</p>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Evaluasi Kecocokan</h4>
                        <p className="text-sm text-gray-600 italic mt-0.5">{candidate.reason}</p>
                    </div>
                </div>
            )}

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
    const [showPreview, setShowPreview] = useState(false);
    const [pdfError, setPdfError] = useState("");
    const [invitedCandidates, setInvitedCandidates] = useState<Set<string>>(new Set());

    const handleInviteCandidate = (candidate: CandidateScore) => {
        // Save to localStorage interviewQueue
        const existing = JSON.parse(localStorage.getItem("interviewQueue") || "[]");
        const alreadyQueued = existing.some((item: { filename: string }) => item.filename === candidate.filename);
        if (!alreadyQueued) {
            existing.push({
                name: candidate.filename.replace(/\.(pdf|docx)$/i, "").replace(/[-_]/g, " "),
                filename: candidate.filename,
                score: candidate.hybrid_score_pct,
                email: "",
            });
            localStorage.setItem("interviewQueue", JSON.stringify(existing));
        }
        setInvitedCandidates((prev) => new Set([...prev, candidate.filename]));
    };



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

    const downloadPDF = () => {
        setShowPreview(true);
    };

    const generatePdfFromPreview = async () => {
        if (!reportRef.current) {
            setPdfError("Report content not found. Please reload the page.");
            return;
        }

        setIsDownloadingPdf(true);
        setPdfError("");

        // Define safe CSS properties to copy
        const cssProperties = [
            { name: "color", prop: "color" },
            { name: "backgroundColor", prop: "background-color" },
            { name: "fontSize", prop: "font-size" },
            { name: "fontWeight", prop: "font-weight" },
            { name: "fontStyle", prop: "font-style" },
            { name: "fontFamily", prop: "font-family" },
            { name: "lineHeight", prop: "line-height" },
            { name: "letterSpacing", prop: "letter-spacing" },
            { name: "marginTop", prop: "margin-top" },
            { name: "marginRight", prop: "margin-right" },
            { name: "marginBottom", prop: "margin-bottom" },
            { name: "marginLeft", prop: "margin-left" },
            { name: "paddingTop", prop: "padding-top" },
            { name: "paddingRight", prop: "padding-right" },
            { name: "paddingBottom", prop: "padding-bottom" },
            { name: "paddingLeft", prop: "padding-left" },
            { name: "textAlign", prop: "text-align" },
            { name: "textTransform", prop: "text-transform" },
            { name: "whiteSpace", prop: "white-space" },
            { name: "borderRadius", prop: "border-radius" },
            { name: "display", prop: "display" },
            { name: "flexDirection", prop: "flex-direction" },
            { name: "alignItems", prop: "align-items" },
            { name: "justifyContent", prop: "justify-content" },
            { name: "flexWrap", prop: "flex-wrap" },
            { name: "flexGrow", prop: "flex-grow" },
            { name: "flexShrink", prop: "flex-shrink" },
            { name: "flex", prop: "flex" },
            { name: "boxSizing", prop: "box-sizing" },
            { name: "width", prop: "width" },
            { name: "height", prop: "height" },
            { name: "minWidth", prop: "min-width" },
            { name: "maxWidth", prop: "max-width" },
            { name: "minHeight", prop: "min-height" },
            { name: "maxHeight", prop: "max-height" },
            { name: "borderTopWidth", prop: "border-top-width" },
            { name: "borderRightWidth", prop: "border-right-width" },
            { name: "borderBottomWidth", prop: "border-bottom-width" },
            { name: "borderLeftWidth", prop: "border-left-width" },
            { name: "borderTopColor", prop: "border-top-color" },
            { name: "borderRightColor", prop: "border-right-color" },
            { name: "borderBottomColor", prop: "border-bottom-color" },
            { name: "borderLeftColor", prop: "border-left-color" },
            { name: "borderTopStyle", prop: "border-top-style" },
            { name: "borderRightStyle", prop: "border-right-style" },
            { name: "borderBottomStyle", prop: "border-bottom-style" },
            { name: "borderLeftStyle", prop: "border-left-style" },
            { name: "gap", prop: "gap" },
        ];

        // Helper to map computed styles from a live element to its clone
        const mapStyles = (orig: HTMLElement, clone: HTMLElement) => {
            const origElements = [orig, ...Array.from(orig.querySelectorAll("*"))] as HTMLElement[];
            const cloneElements = [clone, ...Array.from(clone.querySelectorAll("*"))] as HTMLElement[];

            for (let i = 0; i < origElements.length; i++) {
                const oEl = origElements[i];
                const cEl = cloneElements[i];
                if (!oEl || !cEl) continue;

                const computed = window.getComputedStyle(oEl);
                cEl.removeAttribute("class");
                cEl.style.cssText = "";

                cssProperties.forEach(({ name, prop }) => {
                    try {
                        let value = computed.getPropertyValue(prop).trim();
                        if (!value) return;

                        // Sanitize color values
                        if (/oklch|oklab|lab|lch|hwb|color\(/i.test(value)) {
                            if (prop.includes("color")) {
                                if (prop === "background-color") {
                                    value = "#ffffff";
                                } else if (prop.includes("border")) {
                                    value = "#e5e7eb";
                                } else {
                                    value = "#374151"; // fallback dark gray text
                                }
                            } else {
                                value = "#D9CEBF";
                            }
                        }

                        cEl.style.setProperty(prop, value, "important");
                    } catch (e) {
                        // Skip
                    }
                });
            }
        };

        try {
            const element = reportRef.current;
            const targetWidth = element.offsetWidth;
            const exactPageHeight = Math.floor(targetWidth * 1.414);
            const targetPageHeight = exactPageHeight - 100; // safe bottom margin

            // Create a temporary hidden container to hold our generated pages for measurement and rendering
            const tempContainer = document.createElement("div");
            tempContainer.style.position = "absolute";
            tempContainer.style.left = "-9999px";
            tempContainer.style.top = "-9999px";
            tempContainer.style.width = targetWidth + "px";
            tempContainer.style.backgroundColor = "#ffffff";
            document.body.appendChild(tempContainer);

            // Helper to create a new page container
            const createPage = (): HTMLElement => {
                const page = document.createElement("div");
                page.style.width = targetWidth + "px";
                page.style.boxSizing = "border-box";
                page.style.backgroundColor = "#ffffff";
                page.style.position = "relative";
                page.style.border = "none";

                // Copy container styles (padding, fonts, colors, border) from the original element
                const computed = window.getComputedStyle(element);
                const containerProperties = [
                    "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
                    "fontFamily", "color", "lineHeight"
                ];
                containerProperties.forEach((prop) => {
                    try {
                        const kebabProp = prop.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
                        const val = computed.getPropertyValue(kebabProp);
                        if (val) {
                            page.style.setProperty(kebabProp, val);
                        }
                    } catch (e) { }
                });

                tempContainer.appendChild(page);
                return page;
            };

            let currentPage = createPage();

            // 1. Add Header clone
            const headerClone = element.children[0].cloneNode(true) as HTMLElement;
            mapStyles(element.children[0] as HTMLElement, headerClone);
            currentPage.appendChild(headerClone);

            // 2. Add Job Description clone
            const jdClone = element.children[1].cloneNode(true) as HTMLElement;
            mapStyles(element.children[1] as HTMLElement, jdClone);
            currentPage.appendChild(jdClone);

            // 3. Add Candidates container clone
            const listContainer = element.children[2];
            const listClone = document.createElement("div");
            listClone.style.display = "flex";
            listClone.style.flexDirection = "column";
            listClone.style.gap = "24px"; // space-y-6 equivalent
            currentPage.appendChild(listClone);

            // Add Heading clone
            const headingClone = listContainer.children[0].cloneNode(true) as HTMLElement;
            mapStyles(listContainer.children[0] as HTMLElement, headingClone);
            listClone.appendChild(headingClone);
            // 4. Distribute Candidate Cards (Dynamic Page Splitting)
            let currentListClone = listClone;
            const minElements = 1;
            
            for (let i = 1; i < listContainer.children.length; i++) {
                const card = listContainer.children[i] as HTMLElement;
                const cardClone = card.cloneNode(true) as HTMLElement;
                mapStyles(card, cardClone);
                
                // Append card to current list
                currentListClone.appendChild(cardClone);
                
                // Check if current page overflows
                if (currentPage.scrollHeight > targetPageHeight) {
                    // We only move the card if we have more than the minimum elements on this page.
                    // For Page 1, it requires the heading + at least 1 card.
                    // For other pages, it requires at least 1 card.
                    if (currentListClone.children.length > minElements) {
                        // Remove card from current page
                        currentListClone.removeChild(cardClone);
                        
                        // Create new page
                        currentPage = createPage();
                        
                        // Create a new list container in the new page
                        currentListClone = document.createElement("div");
                        currentListClone.style.display = "flex";
                        currentListClone.style.flexDirection = "column";
                        currentListClone.style.gap = "24px";
                        currentPage.appendChild(currentListClone);
                        
                        // Append card to new page list
                        currentListClone.appendChild(cardClone);
                    }
                }
            }

            // Temporarily remove all style/link elements from the DOM to empty document.styleSheets
            // and prevent html2canvas parsing errors on Tailwind CSS v4 oklch/lab colors
            const detachedStyles: { element: Element; parent: ParentNode | null; nextSibling: ChildNode | null }[] = [];
            try {
                const styleElements = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"));
                styleElements.forEach((el) => {
                    detachedStyles.push({
                        element: el,
                        parent: el.parentNode,
                        nextSibling: el.nextSibling
                    });
                    el.parentNode?.removeChild(el);
                });
            } catch (e) {
                console.warn("Failed to temporarily detach some stylesheets:", e);
            }

            try {
                const pages = Array.from(tempContainer.children) as HTMLElement[];

                // Finalize fixed height for pages
                pages.forEach((page) => {
                    page.style.height = exactPageHeight + "px";
                    page.style.minHeight = exactPageHeight + "px";
                    page.style.overflow = "hidden"; // Clip any tiny overflow
                });

                const pdf = new jsPDF({
                    orientation: "portrait",
                    unit: "mm",
                    format: "a4",
                });

                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();

                for (let idx = 0; idx < pages.length; idx++) {
                    const pageEl = pages[idx];

                    const canvas = await html2canvas(pageEl, {
                        scale: 2,
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: "#ffffff",
                        logging: false,
                        windowHeight: exactPageHeight,
                        windowWidth: targetWidth,
                        removeContainer: false,
                    });

                    const imgData = canvas.toDataURL("image/png");

                    if (idx > 0) {
                        pdf.addPage();
                    }

                    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
                }

                pdf.save("laporan_evaluasi_kandidat.pdf");
                setPdfError("");
            } finally {
                // Clean up temporary container
                if (tempContainer.parentNode) {
                    tempContainer.parentNode.removeChild(tempContainer);
                }

                // Restore all style/link elements in their original positions/order
                try {
                    detachedStyles.forEach(({ element, parent, nextSibling }) => {
                        if (parent) {
                            parent.insertBefore(element, nextSibling);
                        }
                    });
                } catch (e) {
                    console.warn("Failed to restore some stylesheets:", e);
                }
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Unknown error occurred";
            console.error("PDF Download Error:", errorMsg);
            setPdfError(`Failed to generate PDF: ${errorMsg}`);
        } finally {
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
                    onClick={() => router.push("/upload")}
                    className="mb-6 flex items-center gap-2 text-[#5A5550] hover:text-[#81A6C6] transition"
                >
                    <ArrowLeft size={20} /> Kembali ke Upload CV
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
                    onClick={() => router.push("/upload")}
                    className="mb-6 flex items-center gap-2 text-[#5A5550] hover:text-[#81A6C6] transition"
                >
                    <ArrowLeft size={20} /> Kembali ke Upload CV
                </button>

                <div className="space-y-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Trophy size={32} className="text-yellow-500" />
                            <h1 className="text-4xl font-serif font-bold text-[#5A5550]">
                                Candidate Rankings
                            </h1>
                        </div>
                        <p className="text-gray-600">
                            {analysisData.total_candidates} candidates analyzed
                        </p>
                    </div>

                    {/* Job Description Preview */}
                    {analysisData.job_desc_preview && (
                        <div className="bg-white rounded-2xl p-6 shadow-md border-l-4 border-[#81A6C6]">
                            <h2 className="text-lg font-semibold text-[#5A5550] mb-3">Job Description</h2>
                            <p className="text-gray-700 text-sm leading-relaxed">
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
                                    onInvite={handleInviteCandidate}
                                    isInvited={invitedCandidates.has(candidate.filename)}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Download Buttons */}
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
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

            {/* PDF Report Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-[#E8DED3] rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-[#D9CEBF]">
                        {/* Modal Header */}
                        <div className="p-4 bg-white border-b flex items-center justify-between">
                            <div className="flex flex-col">
                                <h3 className="text-lg font-bold text-[#5A5550]">Preview Laporan PDF</h3>
                                {pdfError && (
                                    <span className="text-xs text-rose-600 font-semibold mt-1">
                                        Eror: {pdfError}
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={generatePdfFromPreview}
                                    disabled={isDownloadingPdf}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium shadow disabled:opacity-50"
                                >
                                    {isDownloadingPdf ? (
                                        <>
                                            <Loader2 className="animate-spin" size={16} /> Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Download size={16} /> Unduh PDF
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>

                        {/* Modal Body / Report Sheet Container */}
                        <div className="flex-1 overflow-y-auto p-8 bg-gray-100 flex justify-center">
                            {/* Printable Document Sheet (A4 Proportion) */}
                            <div
                                ref={reportRef}
                                className="bg-white p-12 shadow-lg max-w-[210mm] w-full min-h-[297mm] text-gray-800 font-sans border border-gray-200"
                                style={{ boxSizing: "border-box" }}
                            >
                                {/* Report Title */}
                                <div className="border-b-4 border-[#81A6C6] pb-6 mb-8 text-center">
                                    <h1 className="text-2xl font-bold uppercase tracking-wider text-[#5A5550] font-serif">Laporan Evaluasi Kandidat</h1>
                                    <p className="text-xs text-gray-500 mt-2">Dihasilkan oleh AI Employee Finder • {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>

                                {/* Job Description */}
                                <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-150">
                                    <h2 className="text-xs font-bold uppercase text-gray-600 tracking-wide mb-2">Posisi / Kriteria Pekerjaan</h2>
                                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{analysisData.job_desc_preview}</p>
                                </div>

                                {/* Candidate Evaluation List */}
                                <div className="space-y-6">
                                    <h2 className="text-xs font-bold uppercase text-gray-600 tracking-wide border-b pb-2">Hasil Pemeringkatan & Analisis</h2>
                                    {analysisData.rankings.map((cand, idx) => (
                                        <div key={cand.filename} className="pb-4 border-b border-gray-100 last:border-b-0 space-y-2">
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold bg-[#81A6C6]/20 text-[#5A5550] px-2 py-0.5 rounded">
                                                        #{idx + 1}
                                                    </span>
                                                    <h3 className="text-sm font-bold text-gray-800">{cand.filename}</h3>
                                                    {cand.profile_summary && (
                                                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${cand.is_match ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                                                            {cand.is_match ? "MATCH" : "NOT MATCH"}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs font-bold text-gray-500">
                                                    Skor: {cand.hybrid_score_pct}%
                                                </div>
                                            </div>

                                            {cand.profile_summary && (
                                                <div className="pl-8 space-y-1.5">
                                                    <div>
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Ringkasan Profil</span>
                                                        <p className="text-xs text-gray-700 leading-relaxed">{cand.profile_summary}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Analisis Evaluasi</span>
                                                        <p className="text-xs text-gray-600 italic leading-relaxed">{cand.reason}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
