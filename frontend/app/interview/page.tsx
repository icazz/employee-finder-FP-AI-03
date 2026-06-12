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
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Employee {
    id: string;
    name: string;
    password: string;
    link: string;
    sessionStarted: boolean;
    createdAt: Date;
}

// ─── Helper Functions ──────────────────────────────────────────────────────────

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

function generateAutoName(): string {
    const firstNames = ["Ade", "Budi", "Citra", "Doni", "Eka", "Fajar", "Gina", "Hendra"];
    const lastNames = ["Kusuma", "Wijaya", "Rahman", "Santoso", "Pratama", "Suryanto"];
    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    const num = Math.floor(Math.random() * 100);
    return `${first} ${last} ${num}`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InterviewPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isExtracting, setIsExtracting] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState("");

    const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (!selectedFiles || selectedFiles.length === 0) return;
        const file = selectedFiles[0];

        setIsExtracting(true);
        setErrorMessage("");
        setStatusMessage("Sedang mengekstrak nama kandidat dari file...");

        try {
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

            // Add the employee
            const password = generatePassword();
            const id = generateId();
            const link = generateLink(id);

            const newEmployee: Employee = {
                id,
                name: name,
                password,
                link,
                sessionStarted: false,
                createdAt: new Date(),
            };

            setEmployees((prev) => [newEmployee, ...prev]);
            setStatusMessage(`Karyawan "${newEmployee.name}" berhasil ditambahkan dari file!`);
            setTimeout(() => setStatusMessage(""), 5000);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memproses file.";
            setErrorMessage(msg);
            setTimeout(() => setErrorMessage(""), 5000);
        } finally {
            setIsExtracting(false);
            // Reset input so they can upload again
            e.target.value = "";
        }
    };

    const handleStartSession = (id: string) => {
        setEmployees((prev) =>
            prev.map((emp) =>
                emp.id === id ? { ...emp, sessionStarted: true } : emp
            )
        );
        setStatusMessage("Sesi dimulai!");
        setTimeout(() => setStatusMessage(""), 2000);
    };

    const handleSendEmail = (employee: Employee) => {
        // Siapkan email content
        const emailContent = `
Halo ${employee.name},

Berikut adalah informasi login untuk interview online:

Link: ${employee.link}
Password: ${employee.password}

Silakan klik link tersebut dan gunakan password di atas untuk memulai interview.

Terima kasih!
        `;

        // Copy to clipboard sebagai temporary solution
        navigator.clipboard.writeText(emailContent);
        setStatusMessage(`Email siap untuk ${employee.name} (copied to clipboard)`);
        setTimeout(() => setStatusMessage(""), 3000);

        // TODO: Integration dengan email backend
        // await fetch('/api/v1/send-email', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     to: employee.email,
        //     subject: 'Interview Link',
        //     content: emailContent
        //   })
        // })
    };

    const handleCopyLink = (link: string, name: string) => {
        navigator.clipboard.writeText(link);
        setCopiedId(name);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDeleteEmployee = (id: string) => {
        setEmployees((prev) => prev.filter((emp) => emp.id !== id));
        setStatusMessage("Karyawan dihapus");
        setTimeout(() => setStatusMessage(""), 2000);
    };

    return (
        <div className="min-h-screen bg-[linear-gradient(to_bottom,#F7F4EE,#AACDDC,#E8DED3,#AACDDC,#F7F4EE)] p-8">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-8">
                <h1 className="text-4xl font-bold text-[#1a1a1a] mb-2">
                    Manajemen Interview
                </h1>
                <p className="text-gray-600">
                    Tambahkan karyawan dan kelola sesi interview mereka
                </p>
            </div>

            {/* Status Messages */}
            {statusMessage && (
                <div className="max-w-6xl mx-auto mb-6 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-emerald-800">
                    <CheckCircle size={20} />
                    {statusMessage}
                </div>
            )}

            {errorMessage && (
                <div className="max-w-6xl mx-auto mb-6 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                    <AlertCircle size={20} />
                    {errorMessage}
                </div>
            )}

            {/* Add Employee Section */}
            <div className="max-w-6xl mx-auto mb-8 bg-white rounded-lg shadow-md p-6 border border-[#D9CEBF]">
                <h2 className="text-xl font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
                    <Plus size={24} className="text-[#81A6C6]" />
                    Tambah Karyawan Baru
                </h2>

                <div className="flex flex-col gap-4">
                    <label className="block text-sm font-medium text-gray-700">
                        Upload CV atau hasil PDF untuk mendaftarkan karyawan baru
                    </label>
                    <div className="w-full">
                        <label className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition min-h-[140px] text-center ${isExtracting ? "border-gray-300 bg-gray-50 cursor-not-allowed" : "border-[#81A6C6] hover:bg-gray-50 bg-white"}`}>
                            {isExtracting ? (
                                <Loader2 className="text-[#81A6C6] mb-3 animate-spin" size={32} />
                            ) : (
                                <Upload className="text-[#81A6C6] mb-3" size={32} />
                            )}
                            <span className="text-sm font-medium text-gray-600">
                                {isExtracting ? "Sedang mengekstrak nama..." : "Klik atau seret file PDF / DOCX di sini"}
                            </span>
                            <span className="text-xs text-gray-400 mt-1">Nama karyawan akan dideteksi secara otomatis dari dokumen</span>
                            <input
                                type="file"
                                accept=".pdf,.docx"
                                className="hidden"
                                onChange={handlePdfUpload}
                                disabled={isExtracting}
                            />
                        </label>
                    </div>
                </div>
            </div>

            {/* Employees List */}
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
                                    {/* Left: Employee Info */}
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-[#1a1a1a] mb-4">
                                            {employee.name}
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                            {/* Password */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                                    Password
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono text-gray-800">
                                                        {employee.password}
                                                    </code>
                                                    <button
                                                        onClick={() =>
                                                            handleCopyLink(
                                                                employee.password,
                                                                `pwd-${employee.id}`
                                                            )
                                                        }
                                                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                                                        title="Salin password"
                                                    >
                                                        <Copy
                                                            size={18}
                                                            className="text-[#81A6C6]"
                                                        />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Link */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                                    Link Interview
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono text-gray-800 truncate">
                                                        {employee.link}
                                                    </code>
                                                    <button
                                                        onClick={() =>
                                                            handleCopyLink(
                                                                employee.link,
                                                                `link-${employee.id}`
                                                            )
                                                        }
                                                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                                                        title="Salin link"
                                                    >
                                                        {copiedId === `link-${employee.id}` ? (
                                                            <CheckCircle
                                                                size={18}
                                                                className="text-emerald-500"
                                                            />
                                                        ) : (
                                                            <Copy
                                                                size={18}
                                                                className="text-[#81A6C6]"
                                                            />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Status */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                                    Status Sesi
                                                </label>
                                                <div
                                                    className={`px-3 py-2 rounded text-sm font-medium text-center ${
                                                        employee.sessionStarted
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : "bg-gray-100 text-gray-700"
                                                    }`}
                                                >
                                                    {employee.sessionStarted
                                                        ? "✓ Sesi Dimulai"
                                                        : "Belum Dimulai"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Action Buttons */}
                                    <div className="flex flex-col gap-3 ml-4">
                                        <button
                                            onClick={() =>
                                                handleStartSession(employee.id)
                                            }
                                            disabled={employee.sessionStarted}
                                            className={`w-fit px-10 py-4 rounded-full shadow-xl hover:scale-105 transition duration-300 font-semibold flex items-center gap-2 ${
                                                employee.sessionStarted
                                                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                                    : "bg-emerald-500 text-white"
                                            }`}
                                        >
                                            <Play size={16} />
                                            Mulai Sesi
                                        </button>

                                        <button
                                            onClick={() =>
                                                handleSendEmail(employee)
                                            }
                                            className="w-fit px-10 py-4 rounded-full bg-[#81A6C6] text-white shadow-xl hover:scale-105 transition duration-300 font-semibold flex items-center gap-2"
                                        >
                                            <Mail size={16} />
                                            Kirim Email
                                        </button>

                                        <button
                                            onClick={() =>
                                                handleDeleteEmployee(
                                                    employee.id
                                                )
                                            }
                                            className="w-fit px-10 py-4 rounded-full bg-red-100 text-red-700 shadow-xl hover:scale-105 transition duration-300 font-semibold flex items-center gap-2"
                                        >
                                            <Trash2 size={16} />
                                            Hapus
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
