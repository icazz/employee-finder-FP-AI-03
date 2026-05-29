"use client";

import { useState } from "react";
import {
    Upload,
    FileText,
    Sparkles,
} from "lucide-react";

export default function UploadPage() {
    const [files, setFiles] = useState<File[]>([]);

    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
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
                    Upload multiple candidate resumes
                    and let AI analyze the best match
                    based on your job requirements.
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 mt-12 max-w-5xl mx-auto">

                {/* LEFT */}
                <div className="bg-[#E8DED3] rounded-3xl p-6 shadow-xl">

                    <div className="flex items-center gap-4">
                        <Upload size={28} />
                        <h2 className="text-2xl font-serif">
                            Upload CV
                        </h2>
                    </div>

                    {/* DROPZONE */}
                    <label className="mt-8 border-2 border-dashed border-[#81A6C6] rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-[#F3E8DA] transition">

                        <Upload
                            size={48}
                            className="text-[#81A6C6]"
                        />

                        <p className="mt-6 text-xl">
                            Drag & Drop CV Here
                        </p>

                        <p className="text-gray-500 mt-2">
                            PDF / DOCX
                        </p>

                        <input
                            type="file"
                            multiple
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </label>

                    {/* FILE LIST */}
                    <div className="mt-8 space-y-4">

                        {files.map((file, index) => (
                            <div
                                key={index}
                                className="bg-[#F3E8DA] rounded-2xl p-4 flex items-center gap-4"
                            >
                                <FileText className="text-[#81A6C6]" />

                                <div>
                                    <p className="font-medium">
                                        {file.name}
                                    </p>

                                    <p className="text-sm text-gray-500">
                                        {(file.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT */}
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