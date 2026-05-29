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
} from "lucide-react";

export default function UploadPage() {
    // State to hold selected files
    const [files, setFiles] = useState<File[]>([]);
    // Loading state for upload & parsing process
    const [isLoading, setIsLoading] = useState(false);
    // Success/Info status message state
    const [statusMessage, setStatusMessage] = useState("");
    // Error message state
    const [errorMessage, setErrorMessage] = useState("");
    // Flag to check if files have been successfully parsed on backend
    const [isParsed, setIsParsed] = useState(false);

    /**
     * Handle file input change event
     */
    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
            // Reset state when new files are selected
            setIsParsed(false);
            setErrorMessage("");
            setStatusMessage("");
        }
    };

    /**
     * Remove a file from the selected list
     */
    const removeFile = (indexToRemove: number) => {
        setFiles((prevFiles) => prevFiles.filter((_, i) => i !== indexToRemove));
        // Reset parser status since the file list changed
        setIsParsed(false);
        setErrorMessage("");
        setStatusMessage("");
    };

    /**
     * Download the parsed CSV from the FastAPI backend
     */
    const downloadCSV = async () => {
        try {
            setStatusMessage("Preparing download...");
            
            // Request the compiled CSV file stream from FastAPI
            const response = await fetch("/api/v1/documents/csv");
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || "Failed to retrieve CSV file from backend.");
            }

            // Convert the response stream into a Blob
            const blob = await response.blob();
            
            // Create a temporary object URL pointing to the CSV blob
            const url = window.URL.createObjectURL(blob);
            
            // Create an invisible anchor tag to trigger browser download dialog
            const a = document.createElement("a");
            a.href = url;
            a.download = "parsed_candidates.csv";
            document.body.appendChild(a);
            
            a.click();
            
            // Clean up resources
            a.remove();
            window.URL.revokeObjectURL(url);
            setStatusMessage("CSV file downloaded successfully!");
        } catch (err: any) {
            console.error("Download error:", err);
            setErrorMessage(err.message || "An error occurred while downloading the CSV.");
        }
    };

    /**
     * Send files to the FastAPI backend using FormData
     */
    const handleUpload = async () => {
        if (files.length === 0) {
            setErrorMessage("Please select at least one CV file first.");
            return;
        }

        setIsLoading(true);
        setErrorMessage("");
        setStatusMessage("Uploading and parsing files to CSV format...");
        setIsParsed(false);

        try {
            // FormData is required to send binary files via multipart/form-data
            const formData = new FormData();
            
            // Note: The FastAPI endpoint expects the field name to be 'uploads'
            // (e.g. uploads: list[UploadFile] = File(...))
            files.forEach((file) => {
                formData.append("uploads", file);
            });

            // Send POST request to FastAPI backend proxy path
            const response = await fetch("/api/v1/documents/parse", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const details = errorData.detail;
                
                // Format details list if returned as array by FastAPI's validation error
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

            // Automatically trigger CSV download on successful parsing
            await downloadCSV();
        } catch (err: any) {
            console.error("Upload error:", err);
            setErrorMessage(err.message || "An unexpected error occurred during parsing.");
        } finally {
            setIsLoading(false);
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
                    Upload multiple candidate resumes (PDF or DOCX)
                    and let the backend parse them into a unified CSV format.
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 mt-12 max-w-5xl mx-auto">

                {/* LEFT: CV Upload & CSV Tool */}
                <div className="bg-[#E8DED3] rounded-3xl p-6 shadow-xl flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-4">
                            <Upload size={28} />
                            <h2 className="text-2xl font-serif">
                                Upload CV & Parse CSV
                            </h2>
                        </div>

                        {/* DROPZONE */}
                        <label className="mt-8 border-2 border-dashed border-[#81A6C6] rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-[#F3E8DA] transition">

                            <Upload
                                size={48}
                                className="text-[#81A6C6]"
                            />

                            <p className="mt-6 text-xl text-[#5A5550] font-medium">
                                Drag & Drop CV Here
                            </p>

                            <p className="text-gray-500 mt-2">
                                PDF / DOCX
                            </p>

                            <input
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
                                        type="button"
                                        onClick={() => removeFile(index)}
                                        className="text-gray-500 hover:text-red-500 p-2 rounded-full hover:bg-[#ebdcc8] transition animate-pulse-slow"
                                        title="Remove file"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ACTIONS & FEEDBACK */}
                    {files.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-[#D9CEBF] space-y-4">
                            {/* Error Alert */}
                            {errorMessage && (
                                <div className="bg-red-50 text-red-700 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                                    <AlertCircle className="shrink-0 mt-0.5" size={18} />
                                    <p className="text-sm">{errorMessage}</p>
                                </div>
                            )}

                            {/* Status Alert */}
                            {statusMessage && (
                                <div className="bg-blue-50 text-blue-700 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
                                    {isLoading ? (
                                        <Loader2 className="animate-spin shrink-0 mt-0.5" size={18} />
                                    ) : (
                                        <CheckCircle className="text-green-600 shrink-0 mt-0.5" size={18} />
                                    )}
                                    <p className="text-sm">{statusMessage}</p>
                                </div>
                            )}

                            {/* Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    type="button"
                                    onClick={handleUpload}
                                    disabled={isLoading}
                                    className="flex-1 py-4 rounded-2xl bg-[#81A6C6] text-white font-medium hover:scale-[1.02] hover:bg-[#6c93b5] transition disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 shadow-xl cursor-pointer"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            Parsing Files...
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={18} />
                                            Upload & Parse
                                        </>
                                    )}
                                </button>

                                {isParsed && (
                                    <button
                                        type="button"
                                        onClick={downloadCSV}
                                        className="py-4 px-6 rounded-2xl bg-emerald-600 text-white font-medium hover:scale-[1.02] hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-xl cursor-pointer"
                                    >
                                        <Download size={18} />
                                        Download CSV
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT: Job Description & Ranking */}
                <div className="bg-[#E8DED3] rounded-3xl p-6 shadow-xl">

                    <div className="flex items-center gap-4">
                        <Sparkles size={28} />
                        <h2 className="text-2xl font-serif">
                            Job Description
                        </h2>
                    </div>

                    {/* TEXTAREA */}
                    <textarea
                        placeholder="Paste job description here..."
                        className="mt-8 w-full h-[240px] rounded-3xl bg-[#F7F4EE] p-6 outline-none resize-none text-gray-700 leading-8"
                    />

                    {/* BUTTON */}
                    <button className="mt-8 w-full py-4 rounded-2xl bg-[#81A6C6] text-white text-lg hover:scale-[1.02] transition shadow-xl">
                        Analyze Candidates
                    </button>

                    {/* MINI AI BOX */}
                    <div className="mt-8 bg-[#F3E8DA] rounded-3xl p-6">

                        <h3 className="text-xl font-serif">
                            AI Analysis
                        </h3>

                        <p className="mt-4 text-gray-700 leading-8">
                            IndoBERT semantic analysis
                            akan membandingkan CV kandidat
                            dengan job requirements dan
                            menghasilkan ranking otomatis.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}