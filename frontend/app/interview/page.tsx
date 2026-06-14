"use client";

import { useState } from "react";
import {
    Plus,
    Mail,
    Play,
    Trash2,
    Copy,
    CheckCircle,
    AlertCircle,
    Upload,
    Loader2,
    LogOut,
    FileQuestion,
    X,
    Eye,
    Download,
} from "lucide-react";

interface Employee {
    id: string;
    name: string;
    email: string;
    password: string;
    link: string;
    sessionStarted: boolean;
    hasQuestions: boolean;
    createdAt: Date;
}

interface Question {
    id: number;
    type: "multiple_choice" | "essay";
    question: string;
    options?: string[];
    correct_answer?: string;
    points: number;
}

function generateId(): string {
    return Math.random().toString(36).substr(2, 9);
}

function generatePassword(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    let password = "";
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

function generateLink(employeeId: string): string {
    return `${window.location.origin}/interview/${employeeId}`;
}

export default function InterviewPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isExtracting, setIsExtracting] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [topic, setTopic] = useState("");
    const [numQuestions, setNumQuestions] = useState(10);
    const [difficulty, setDifficulty] = useState("medium");
    const [isGenerating, setIsGenerating] = useState(false);
    
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);
    const [previewEmployee, setPreviewEmployee] = useState<Employee | null>(null);

    const [showResultsModal, setShowResultsModal] = useState(false);
    const [resultsData, setResultsData] = useState<any>(null);
    const [resultsEmployee, setResultsEmployee] = useState<Employee | null>(null);

    const [buttonStatus, setButtonStatus] = useState<Record<string, "success" | "error">>({});

    const setBtnStatus = (key: string, status: "success" | "error") => {
        setButtonStatus((prev) => ({ ...prev, [key]: status }));
        setTimeout(() => {
            setButtonStatus((prev) => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }, 2000);
    };

    const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (!selectedFiles || selectedFiles.length === 0) return;
        const file = selectedFiles[0];

        setIsExtracting(true);

        try {
            if (file.name.endsWith(".csv")) {
                const text = await file.text();
                const lines = text.split("\n").filter((l) => l.trim());
                if (lines.length < 2) {
                    throw new Error("CSV kosong atau hanya berisi header.");
                }

                const newEmployees: Employee[] = [];
                for (let i = 1; i < lines.length; i++) {
                    const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
                    if (cols.length < 2) continue;
                    const name = cols[1] || "Karyawan Baru";
                    const email = cols[cols.length - 1] || "";

                    const id = generateId();
                    const password = generatePassword();
                    const link = generateLink(id);

                    newEmployees.push({
                        id,
                        name,
                        email,
                        password,
                        link,
                        sessionStarted: false,
                        hasQuestions: false,
                        createdAt: new Date(),
                    });
                }

                setEmployees((prev) => [...newEmployees, ...prev]);
                setBtnStatus("upload", "success");
            } else {
                const formData = new FormData();
                formData.append("file", file);

                const response = await fetch("/api/v1/extract-name", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    const details = errorData.detail || "Gagal memproses file.";
                    throw new Error(details);
                }

                const data = await response.json();
                const name = data.name || "Karyawan Baru";

                const id = generateId();
                const password = generatePassword();
                const link = generateLink(id);

                const newEmployee: Employee = {
                    id,
                    name,
                    email: "",
                    password,
                    link,
                    sessionStarted: false,
                    hasQuestions: false,
                    createdAt: new Date(),
                };

                setEmployees((prev) => [newEmployee, ...prev]);
                setBtnStatus("upload", "success");
            }
        } catch {
            setBtnStatus("upload", "error");
        } finally {
            setIsExtracting(false);
            e.target.value = "";
        }
    };

    const handleStartSession = async (employee: Employee) => {
        try {
            const response = await fetch("/api/v1/interview/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: employee.id,
                    name: employee.name,
                    password: employee.password,
                    email: employee.email,
                }),
            });

            if (!response.ok) {
                throw new Error("Gagal membuat sesi");
            }

            setEmployees((prev) =>
                prev.map((emp) =>
                    emp.id === employee.id ? { ...emp, sessionStarted: true } : emp
                )
            );
            setBtnStatus(`${employee.id}_start`, "success");
        } catch {
            setBtnStatus(`${employee.id}_start`, "error");
        }
    };

    const handleEndSession = async (employee: Employee) => {
        try {
            const response = await fetch(`/api/v1/interview/session/${employee.id}/end`, {
                method: "POST",
            });

            if (!response.ok && response.status !== 404) {
                throw new Error("Gagal mengakhiri sesi");
            }

            setEmployees((prev) =>
                prev.map((emp) =>
                    emp.id === employee.id ? { ...emp, sessionStarted: false } : emp
                )
            );
            setBtnStatus(`${employee.id}_end`, "success");
        } catch {
            setBtnStatus(`${employee.id}_end`, "error");
        }
    };

    const handleDeleteSession = async (employee: Employee) => {
        try {
            if (employee.sessionStarted) {
                await fetch(`/api/v1/interview/session/${employee.id}/end`, {
                    method: "POST",
                }).catch(() => {});
            }
            await fetch(`/api/v1/interview/session/${employee.id}`, {
                method: "DELETE",
            }).catch(() => {});

            setEmployees((prev) => prev.filter((emp) => emp.id !== employee.id));
            setBtnStatus(`${employee.id}_delete`, "success");
        } catch {
            setBtnStatus(`${employee.id}_delete`, "error");
        }
    };

    const handleSendEmail = async (employee: Employee) => {
        if (!employee.email) {
            const emailContent = `
Halo ${employee.name},

Berikut adalah informasi login untuk interview online:

Link: ${employee.link}
Password: ${employee.password}

Silakan klik link tersebut dan gunakan password di atas untuk memulai interview.

Terima kasih!
            `;
            navigator.clipboard.writeText(emailContent);
            setBtnStatus(`${employee.id}_email`, "success");
            return;
        }

        try {
            const response = await fetch("/api/v1/send-gmail", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    recipients: [{ name: employee.name, email: employee.email }],
                    subject: "Informasi Login Interview Online",
                    body: `Berikut adalah informasi login untuk interview online:\n\nLink: ${employee.link}\nPassword: ${employee.password}\n\nSilakan klik link tersebut dan gunakan password di atas untuk memulai interview.\n\nTerima kasih!`,
                }),
            });

            if (!response.ok) {
                throw new Error("Gagal mengirim email");
            }

            const result = await response.json();
            if (result.failed > 0) {
                setBtnStatus(`${employee.id}_email`, "error");
            } else {
                setBtnStatus(`${employee.id}_email`, "success");
            }
        } catch {
            const emailContent = `
Halo ${employee.name},

Berikut adalah informasi login untuk interview online:

Link: ${employee.link}
Password: ${employee.password}

Silakan klik link tersebut dan gunakan password di atas untuk memulai interview.

Terima kasih!
            `;
            navigator.clipboard.writeText(emailContent);
            setBtnStatus(`${employee.id}_email`, "success");
        }
    };

    const handleOpenQuestionModal = (employee: Employee) => {
        setSelectedEmployee(employee);
        setTopic("");
        setNumQuestions(10);
        setDifficulty("medium");
        setShowQuestionModal(true);
    };

    const handleGenerateQuestions = async () => {
        if (!selectedEmployee || !topic.trim()) {
            setBtnStatus("generate_questions", "error");
            return;
        }

        setIsGenerating(true);

        try {
            const response = await fetch(`/api/v1/interview/session/${selectedEmployee.id}/questions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    topic: topic,
                    num_questions: numQuestions,
                    difficulty: difficulty,
                }),
            });

            if (!response.ok) {
                throw new Error("Gagal generate soal");
            }

            const data = await response.json();

            setEmployees((prev) =>
                prev.map((emp) =>
                    emp.id === selectedEmployee.id ? { ...emp, hasQuestions: true } : emp
                )
            );

            setBtnStatus(`${selectedEmployee.id}_generate`, "success");
            setShowQuestionModal(false);
        } catch {
            setBtnStatus(`${selectedEmployee.id}_generate`, "error");
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePreviewQuestions = async (employee: Employee) => {
        try {
            const response = await fetch(`/api/v1/interview/session/${employee.id}/questions`);

            if (!response.ok) {
                throw new Error("Gagal memuat soal");
            }

            const data = await response.json();
            setPreviewQuestions(data.questions);
            setPreviewEmployee(employee);
            setShowPreviewModal(true);
        } catch {
            setBtnStatus(`${employee.id}_preview`, "error");
        }
    };

    const handleViewResults = async (employee: Employee) => {
        try {
            const response = await fetch(`/api/v1/interview/session/${employee.id}/results`);

            if (!response.ok) {
                throw new Error("Kandidat belum menyelesaikan interview");
            }

            const data = await response.json();
            setResultsData(data);
            setResultsEmployee(employee);
            setShowResultsModal(true);
        } catch {
            setBtnStatus(`${employee.id}_results`, "error");
        }
    };

    const handleCopyLink = (link: string, name: string) => {
        navigator.clipboard.writeText(link);
        setCopiedId(name);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleExportCSV = async () => {
        try {
            const response = await fetch("/api/v1/interview/sessions");
            if (!response.ok) {
                throw new Error("Gagal mengambil data sesi");
            }

            const data = await response.json();
            const sessions = data.sessions || [];

            if (sessions.length === 0) {
                setBtnStatus("export_csv", "error");
                return;
            }

            const csvRows: string[] = [];
            
            csvRows.push("Nama,Email,Topik,Skor Pilihan Ganda,Skor Essay,Skor Akhir,Status");

            for (const session of sessions) {
                const name = session.name || "";
                const email = session.email || "";
                const topic = session.topic || "";
                const mcScore = session.mc_score !== null ? `${session.mc_score}%` : "-";
                const essayScore = session.essay_score !== null ? `${session.essay_score}%` : "-";
                const finalScore = session.final_score !== null ? `${session.final_score}%` : "-";
                const status = session.submitted ? "Selesai" : "Belum Selesai";

                csvRows.push(`"${name}","${email}","${topic}",${mcScore},${essayScore},${finalScore},${status}`);
            }

            const csvContent = csvRows.join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            
            link.setAttribute("href", url);
            link.setAttribute("download", `hasil_interview_${new Date().toISOString().split("T")[0]}.csv`);
            link.style.visibility = "hidden";
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setBtnStatus("export_csv", "success");
        } catch {
            setBtnStatus("export_csv", "error");
        }
    };

    return (
        <div className="min-h-screen bg-[linear-gradient(to_bottom,#F7F4EE,#AACDDC,#E8DED3,#AACDDC,#F7F4EE)] p-8">
            <div className="max-w-6xl mx-auto mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-[#1a1a1a] mb-2">
                            Manajemen Interview
                        </h1>
                        <p className="text-gray-600">
                            Tambahkan karyawan, generate soal AI, dan kelola sesi interview
                        </p>
                    </div>
                    <button
                        onClick={handleExportCSV}
                        className={`px-6 py-3 text-white rounded-xl transition font-medium flex items-center gap-2 shadow-md ${
                            buttonStatus["export_csv"] === "success" ? "bg-emerald-500" :
                            buttonStatus["export_csv"] === "error" ? "bg-red-500" :
                            "bg-emerald-600 hover:bg-emerald-700"
                        }`}
                    >
                        {buttonStatus["export_csv"] === "success" ? <CheckCircle size={20} /> :
                         buttonStatus["export_csv"] === "error" ? <AlertCircle size={20} /> :
                         <Download size={20} />}
                        {buttonStatus["export_csv"] === "success" ? "Berhasil!" :
                         buttonStatus["export_csv"] === "error" ? "Gagal!" :
                         "Export CSV"}
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto mb-8 bg-white rounded-lg shadow-md p-6 border border-[#D9CEBF]">
                <h2 className="text-xl font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
                    <Plus size={24} className="text-[#81A6C6]" />
                    Tambah Karyawan Baru
                </h2>

                <div className="flex flex-col gap-4">
                    <label className="block text-sm font-medium text-gray-700">
                        Upload CV/PDF untuk deteksi nama otomatis, atau CSV (kolom 1 = nomor, kolom 2 = nama, kolom terakhir = email)
                    </label>
                    <div className="w-full">
                        <label className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition min-h-[140px] text-center ${isExtracting ? "border-gray-300 bg-gray-50 cursor-not-allowed" : "border-[#81A6C6] hover:bg-gray-50 bg-white"}`}>
                            {isExtracting ? (
                                <Loader2 className="text-[#81A6C6] mb-3 animate-spin" size={32} />
                            ) : (
                                <Upload className="text-[#81A6C6] mb-3" size={32} />
                            )}
                            <span className="text-sm font-medium text-gray-600">
                                {isExtracting ? "Sedang memproses..." : "Klik atau seret file PDF / DOCX / CSV di sini"}
                            </span>
                            <span className="text-xs text-gray-400 mt-1">PDF/DOCX: deteksi nama otomatis | CSV: kolom 1 = nomor, kolom 2 = nama, kolom terakhir = email</span>
                            <input
                                type="file"
                                accept=".pdf,.docx,.csv"
                                className="hidden"
                                onChange={handlePdfUpload}
                                disabled={isExtracting}
                            />
                        </label>
                    </div>
                </div>
            </div>

            {employees.length === 0 ? (
                <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-12 text-center border border-[#D9CEBF]">
                    <p className="text-gray-500 text-lg">
                        Belum ada karyawan. Mulai dengan menambahkan karyawan baru.
                    </p>
                </div>
            ) : (
                <div className="max-w-6xl mx-auto space-y-4">
                    {employees.map((employee) => (
                        <div
                            key={employee.id}
                            className="bg-white rounded-lg shadow-md border border-[#D9CEBF] overflow-hidden hover:shadow-lg transition-shadow"
                        >
                            <div className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-[#1a1a1a] mb-4">
                                            {employee.name}
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                            {employee.email && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                                                    <div className="flex items-center gap-2">
                                                        <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono text-gray-800 truncate">
                                                            {employee.email}
                                                        </code>
                                                        <button
                                                            onClick={() => handleCopyLink(employee.email, `email-${employee.id}`)}
                                                            className="p-2 hover:bg-gray-100 rounded transition-colors"
                                                            title="Salin email"
                                                        >
                                                            <Copy size={18} className="text-[#81A6C6]" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
                                                <div className="flex items-center gap-2">
                                                    <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono text-gray-800">
                                                        {employee.password}
                                                    </code>
                                                    <button
                                                        onClick={() => handleCopyLink(employee.password, `pwd-${employee.id}`)}
                                                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                                                        title="Salin password"
                                                    >
                                                        <Copy size={18} className="text-[#81A6C6]" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                                                <div className={`px-3 py-2 rounded text-sm font-medium text-center ${
                                                    employee.hasQuestions
                                                        ? "bg-blue-100 text-blue-700"
                                                        : employee.sessionStarted
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : "bg-gray-100 text-gray-700"
                                                }`}>
                                                    {employee.hasQuestions ? "✓ Soal Siap" : employee.sessionStarted ? "✓ Sesi Aktif" : "Belum Dimulai"}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">Link</label>
                                                <button
                                                    onClick={() => handleCopyLink(employee.link, `link-${employee.id}`)}
                                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 rounded text-sm text-[#81A6C6] hover:bg-gray-200 transition"
                                                >
                                                    {copiedId === `link-${employee.id}` ? <CheckCircle size={14} /> : <Copy size={14} />}
                                                    {copiedId === `link-${employee.id}` ? "Tersalin!" : "Salin Link"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 ml-4">
                                        {!employee.sessionStarted ? (
                                            <button
                                                onClick={() => handleStartSession(employee)}
                                                className={`px-4 py-2 rounded-lg text-white transition font-medium flex items-center gap-2 text-sm ${
                                                    buttonStatus[`${employee.id}_start`] === "success" ? "bg-emerald-500" :
                                                    buttonStatus[`${employee.id}_start`] === "error" ? "bg-red-500" :
                                                    "bg-emerald-500 hover:bg-emerald-600"
                                                }`}
                                            >
                                                {buttonStatus[`${employee.id}_start`] === "success" ? <CheckCircle size={14} /> :
                                                 buttonStatus[`${employee.id}_start`] === "error" ? <AlertCircle size={14} /> :
                                                 <Play size={14} />}
                                                {buttonStatus[`${employee.id}_start`] === "success" ? "Berhasil!" :
                                                 buttonStatus[`${employee.id}_start`] === "error" ? "Gagal!" :
                                                 "Mulai Sesi"}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleEndSession(employee)}
                                                className={`px-4 py-2 rounded-lg text-white transition font-medium flex items-center gap-2 text-sm ${
                                                    buttonStatus[`${employee.id}_end`] === "success" ? "bg-emerald-500" :
                                                    buttonStatus[`${employee.id}_end`] === "error" ? "bg-red-500" :
                                                    "bg-orange-500 hover:bg-orange-600"
                                                }`}
                                            >
                                                {buttonStatus[`${employee.id}_end`] === "success" ? <CheckCircle size={14} /> :
                                                 buttonStatus[`${employee.id}_end`] === "error" ? <AlertCircle size={14} /> :
                                                 <LogOut size={14} />}
                                                {buttonStatus[`${employee.id}_end`] === "success" ? "Berhasil!" :
                                                 buttonStatus[`${employee.id}_end`] === "error" ? "Gagal!" :
                                                 "Akhiri Sesi"}
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleOpenQuestionModal(employee)}
                                            className={`px-4 py-2 rounded-lg text-white transition font-medium flex items-center gap-2 text-sm ${
                                                buttonStatus[`${employee.id}_generate`] === "success" ? "bg-emerald-500" :
                                                buttonStatus[`${employee.id}_generate`] === "error" ? "bg-red-500" :
                                                "bg-purple-500 hover:bg-purple-600"
                                            }`}
                                        >
                                            {buttonStatus[`${employee.id}_generate`] === "success" ? <CheckCircle size={14} /> :
                                             buttonStatus[`${employee.id}_generate`] === "error" ? <AlertCircle size={14} /> :
                                             <FileQuestion size={14} />}
                                            {buttonStatus[`${employee.id}_generate`] === "success" ? "Berhasil!" :
                                             buttonStatus[`${employee.id}_generate`] === "error" ? "Gagal!" :
                                             "Generate Soal"}
                                        </button>

                                        {employee.hasQuestions && (
                                            <button
                                                onClick={() => handlePreviewQuestions(employee)}
                                                className={`px-4 py-2 rounded-lg text-white transition font-medium flex items-center gap-2 text-sm ${
                                                    buttonStatus[`${employee.id}_preview`] === "error" ? "bg-red-500" :
                                                    "bg-blue-500 hover:bg-blue-600"
                                                }`}
                                            >
                                                {buttonStatus[`${employee.id}_preview`] === "error" ? <AlertCircle size={14} /> :
                                                 <Eye size={14} />}
                                                {buttonStatus[`${employee.id}_preview`] === "error" ? "Gagal!" :
                                                 "Preview Soal"}
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleViewResults(employee)}
                                            className={`px-4 py-2 rounded-lg text-white transition font-medium flex items-center gap-2 text-sm ${
                                                buttonStatus[`${employee.id}_results`] === "error" ? "bg-red-500" :
                                                "bg-indigo-500 hover:bg-indigo-600"
                                            }`}
                                        >
                                            {buttonStatus[`${employee.id}_results`] === "error" ? <AlertCircle size={14} /> :
                                             <CheckCircle size={14} />}
                                            {buttonStatus[`${employee.id}_results`] === "error" ? "Belum ada hasil" :
                                             "Lihat Hasil"}
                                        </button>

                                        <button
                                            onClick={() => handleSendEmail(employee)}
                                            className={`px-4 py-2 rounded-lg text-white transition font-medium flex items-center gap-2 text-sm ${
                                                buttonStatus[`${employee.id}_email`] === "success" ? "bg-emerald-500" :
                                                buttonStatus[`${employee.id}_email`] === "error" ? "bg-red-500" :
                                                "bg-[#81A6C6] hover:bg-[#6c93b5]"
                                            }`}
                                        >
                                            {buttonStatus[`${employee.id}_email`] === "success" ? <CheckCircle size={14} /> :
                                             buttonStatus[`${employee.id}_email`] === "error" ? <AlertCircle size={14} /> :
                                             <Mail size={14} />}
                                            {buttonStatus[`${employee.id}_email`] === "success" ? "Terkirim!" :
                                             buttonStatus[`${employee.id}_email`] === "error" ? "Gagal!" :
                                             "Kirim Email"}
                                        </button>

                                        <button
                                            onClick={() => handleDeleteSession(employee)}
                                            className={`px-4 py-2 rounded-lg transition font-medium flex items-center gap-2 text-sm ${
                                                buttonStatus[`${employee.id}_delete`] === "success" ? "bg-emerald-500 text-white" :
                                                buttonStatus[`${employee.id}_delete`] === "error" ? "bg-red-500 text-white" :
                                                "bg-red-100 text-red-700 hover:bg-red-200"
                                            }`}
                                        >
                                            {buttonStatus[`${employee.id}_delete`] === "success" ? <CheckCircle size={14} /> :
                                             buttonStatus[`${employee.id}_delete`] === "error" ? <AlertCircle size={14} /> :
                                             <Trash2 size={14} />}
                                            {buttonStatus[`${employee.id}_delete`] === "success" ? "Terhapus!" :
                                             buttonStatus[`${employee.id}_delete`] === "error" ? "Gagal!" :
                                             "Hapus"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showQuestionModal && selectedEmployee && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-[#1a1a1a]">Generate Soal Interview</h3>
                            <button onClick={() => setShowQuestionModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <p className="text-sm text-gray-600 mb-4">
                            Soal akan di-generate untuk: <span className="font-semibold">{selectedEmployee.name}</span>
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Topik / Job Description *
                                </label>
                                <textarea
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="Contoh: Backend Developer dengan pengalaman Python, FastAPI, dan PostgreSQL..."
                                    className="w-full px-4 py-3 rounded-xl border border-[#D9CEBF] focus:border-[#81A6C6] focus:ring-2 focus:ring-[#81A6C6]/20 outline-none transition"
                                    rows={4}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Jumlah Soal
                                    </label>
                                    <input
                                        type="number"
                                        value={numQuestions}
                                        onChange={(e) => setNumQuestions(parseInt(e.target.value) || 5)}
                                        min={1}
                                        max={50}
                                        className="w-full px-4 py-3 rounded-xl border border-[#D9CEBF] focus:border-[#81A6C6] focus:ring-2 focus:ring-[#81A6C6]/20 outline-none transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tingkat Kesulitan
                                    </label>
                                    <select
                                        value={difficulty}
                                        onChange={(e) => setDifficulty(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-[#D9CEBF] focus:border-[#81A6C6] focus:ring-2 focus:ring-[#81A6C6]/20 outline-none transition"
                                    >
                                        <option value="easy">Mudah</option>
                                        <option value="medium">Sedang</option>
                                        <option value="hard">Sulit</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowQuestionModal(false)}
                                className="flex-1 px-4 py-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition font-medium"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleGenerateQuestions}
                                disabled={isGenerating || !topic.trim()}
                                className="flex-1 px-4 py-3 rounded-xl bg-purple-500 text-white hover:bg-purple-600 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <FileQuestion size={18} />
                                        Generate
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showPreviewModal && previewEmployee && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b">
                            <div>
                                <h3 className="text-xl font-bold text-[#1a1a1a]">Preview Soal Interview</h3>
                                <p className="text-sm text-gray-600">{previewEmployee.name}</p>
                            </div>
                            <button onClick={() => setShowPreviewModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {previewQuestions.map((q, idx) => (
                                <div key={q.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                    <div className="flex items-start gap-3">
                                        <span className="flex-shrink-0 w-8 h-8 bg-[#81A6C6] text-white rounded-full flex items-center justify-center text-sm font-bold">
                                            {idx + 1}
                                        </span>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                    q.type === "multiple_choice" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                                                }`}>
                                                    {q.type === "multiple_choice" ? "Pilihan Ganda" : "Essay"}
                                                </span>
                                                <span className="text-xs text-gray-500">{q.points} poin</span>
                                            </div>
                                            <p className="text-gray-800 mb-2">{q.question}</p>
                                            {q.type === "multiple_choice" && q.options && (
                                                <div className="space-y-1">
                                                    {q.options.map((opt, optIdx) => (
                                                        <div key={optIdx} className={`text-sm px-3 py-1 rounded ${
                                                            opt.charAt(0) === q.correct_answer ? "bg-emerald-100 text-emerald-700 font-medium" : "text-gray-600"
                                                        }`}>
                                                            {opt}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 border-t bg-gray-50">
                            <button
                                onClick={() => setShowPreviewModal(false)}
                                className="w-full px-4 py-3 rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 transition font-medium"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showResultsModal && resultsData && resultsEmployee && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b">
                            <div>
                                <h3 className="text-xl font-bold text-[#1a1a1a]">Hasil Interview</h3>
                                <p className="text-sm text-gray-600">{resultsEmployee.name}</p>
                            </div>
                            <button onClick={() => setShowResultsModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-200">
                                    <p className="text-xs text-blue-600 font-medium mb-1">Pilihan Ganda</p>
                                    <p className="text-2xl font-bold text-blue-700">{resultsData.mc_score ?? "-"}%</p>
                                </div>
                                <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-200">
                                    <p className="text-xs text-purple-600 font-medium mb-1">Essay (AI)</p>
                                    <p className="text-2xl font-bold text-purple-700">{resultsData.essay_score ?? "-"}%</p>
                                </div>
                                <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-200">
                                    <p className="text-xs text-emerald-600 font-medium mb-1">Skor Akhir</p>
                                    <p className="text-2xl font-bold text-emerald-700">{resultsData.final_score ?? "-"}%</p>
                                </div>
                            </div>

                            {resultsData.results && resultsData.results.map((r: any, idx: number) => (
                                <div key={r.id} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                    <div className="flex items-start gap-3 mb-3">
                                        <span className="flex-shrink-0 w-8 h-8 bg-[#81A6C6] text-white rounded-full flex items-center justify-center text-sm font-bold">
                                            {idx + 1}
                                        </span>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                    r.type === "multiple_choice" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                                                }`}>
                                                    {r.type === "multiple_choice" ? "Pilihan Ganda" : "Essay"}
                                                </span>
                                                <span className="text-xs text-gray-500">{r.points} poin</span>
                                            </div>
                                            <p className="text-gray-800 font-medium mb-3">{r.question}</p>
                                        </div>
                                    </div>

                                    <div className="ml-11 space-y-3">
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 mb-1">Jawaban Kandidat:</p>
                                            {r.type === "multiple_choice" ? (
                                                <div className="space-y-1">
                                                    {r.options?.map((opt: string, optIdx: number) => {
                                                        const isCorrect = opt.charAt(0) === r.correct_answer;
                                                        const isChosen = opt.charAt(0) === r.answer;
                                                        return (
                                                            <div key={optIdx} className={`text-sm px-3 py-2 rounded-lg border ${
                                                                isCorrect ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-medium" :
                                                                isChosen ? "bg-red-50 border-red-300 text-red-800" :
                                                                "bg-white border-gray-200 text-gray-600"
                                                            }`}>
                                                                {opt}
                                                                {isCorrect && <span className="ml-2 text-emerald-600">✓ Benar</span>}
                                                                {isChosen && !isCorrect && <span className="ml-2 text-red-600">✗ Jawaban kandidat</span>}
                                                                {isChosen && isCorrect && <span className="ml-2 text-emerald-600">✓ Jawaban kandidat (Benar)</span>}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="bg-white rounded-lg p-3 border border-gray-200">
                                                    <p className="text-sm text-gray-700">{r.answer || "(Tidak dijawab)"}</p>
                                                </div>
                                            )}
                                        </div>

                                        {r.type === "multiple_choice" && (
                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                                                r.is_correct ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                                            }`}>
                                                {r.is_correct ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                                {r.is_correct ? "Benar" : "Salah"}
                                            </div>
                                        )}

                                        {r.type === "essay" && r.evaluation && (
                                            <div className="bg-white rounded-lg p-4 border border-purple-200 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs font-bold text-purple-600 uppercase">Analisa AI</p>
                                                    <span className={`text-sm font-bold ${
                                                        r.evaluation.score >= 70 ? "text-emerald-600" :
                                                        r.evaluation.score >= 40 ? "text-yellow-600" : "text-red-600"
                                                    }`}>
                                                        Skor: {r.evaluation.score}/100
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-700">{r.evaluation.feedback}</p>
                                                {r.evaluation.strengths && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-emerald-600">Kelebihan:</p>
                                                        <p className="text-sm text-gray-600">{r.evaluation.strengths}</p>
                                                    </div>
                                                )}
                                                {r.evaluation.weaknesses && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-red-600">Kekurangan:</p>
                                                        <p className="text-sm text-gray-600">{r.evaluation.weaknesses}</p>
                                                    </div>
                                                )}
                                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                                                    r.evaluation.is_relevant !== false ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                                                }`}>
                                                    {r.evaluation.is_relevant !== false ? "✓ Relevan" : "✗ Tidak Relevan"}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 border-t bg-gray-50">
                            <button
                                onClick={() => setShowResultsModal(false)}
                                className="w-full px-4 py-3 rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 transition font-medium"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
