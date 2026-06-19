"use client";

import { useState, useEffect } from "react";
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
    X,
    Send,
    UserCheck,
    FileCheck,
    ArrowLeft,
    Sparkles,
    Clock,
    ExternalLink,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Employee {
    id: string;
    name: string;
    email: string;
    password: string;
    link: string;
    sessionStarted: boolean;
    invitationSent: boolean;
    createdAt: Date;
    score?: number;
    filename?: string;
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
    if (typeof window !== "undefined") {
        return `${window.location.origin}/interview/${employeeId}`;
    }
    return `/interview/${employeeId}`;
}

// ─── Email Modal Component ────────────────────────────────────────────────────

interface EmailModalProps {
    employee: Employee;
    onClose: () => void;
    onSent: (employeeId: string) => void;
}

function EmailModal({ employee, onClose, onSent }: EmailModalProps) {
    const [toEmail, setToEmail] = useState(employee.email);
    const [subject, setSubject] = useState(
        `Undangan Interview Online - ${employee.name}`
    );
    const [body, setBody] = useState(
        `Yth. ${employee.name},\n\nSelamat! Kami dengan senang hati menginformasikan bahwa berkas lamaran Anda telah lolos tahap seleksi berkas.\n\nKami mengundang Anda untuk mengikuti tahap selanjutnya yaitu Interview Online. Berikut adalah informasi akses interview Anda:\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🔗 Link Interview : ${employee.link}\n🔑 Password       : ${employee.password}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nPetunjuk:\n1. Klik link di atas untuk membuka halaman interview\n2. Masukkan password yang telah disediakan\n3. Pastikan koneksi internet Anda stabil\n4. Siapkan diri Anda sebaik mungkin\n\nJika ada pertanyaan, silakan balas email ini.\n\nSalam hormat,\nTim Rekrutmen\nEmployee Finder AI`
    );
    const [isSending, setIsSending] = useState(false);
    const [sendStatus, setSendStatus] = useState<"idle" | "success" | "simulated" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const handleSend = async () => {
        if (!toEmail.trim()) {
            setErrorMsg("Alamat email tujuan harus diisi.");
            return;
        }

        setIsSending(true);
        setErrorMsg("");
        setSendStatus("idle");

        try {
            const response = await fetch("/api/v1/send-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    to_email: toEmail,
                    subject: subject,
                    content: body,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.simulated) {
                    setSendStatus("simulated");
                } else {
                    setSendStatus("success");
                }
                onSent(employee.id);
            } else {
                throw new Error("Gagal mengirim email.");
            }
        } catch {
            // Fallback: copy to clipboard
            const fullEmail = `To: ${toEmail}\nSubject: ${subject}\n\n${body}`;
            try {
                await navigator.clipboard.writeText(fullEmail);
            } catch {
                // clipboard not available
            }
            setSendStatus("simulated");
            onSent(employee.id);
        } finally {
            setIsSending(false);
        }
    };

    const handleOpenGmail = () => {
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(toEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(gmailUrl, "_blank");
        onSent(employee.id);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden animate-in">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-[#81A6C6] to-[#6c93b5] px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <Mail size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Kirim Undangan Interview</h3>
                            <p className="text-white/80 text-xs">
                                Kirim email undangan ke Gmail kandidat
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-full transition text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Status Messages */}
                    {sendStatus === "success" && (
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-800 text-sm">
                            <CheckCircle size={18} />
                            <span>Email berhasil dikirim ke <strong>{toEmail}</strong>!</span>
                        </div>
                    )}
                    {sendStatus === "simulated" && (
                        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-sm">
                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                            <div>
                                <strong>Mode Simulasi:</strong> SMTP belum dikonfigurasi. Konten email telah disalin ke clipboard. Gunakan tombol &quot;Buka Gmail&quot; untuk mengirim secara manual.
                            </div>
                        </div>
                    )}
                    {errorMsg && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
                            <AlertCircle size={18} />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* To Email */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Kepada (Gmail)
                        </label>
                        <input
                            type="email"
                            value={toEmail}
                            onChange={(e) => setToEmail(e.target.value)}
                            placeholder="kandidat@gmail.com"
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#81A6C6] focus:border-transparent outline-none text-sm transition"
                        />
                    </div>

                    {/* Subject */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Subjek
                        </label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#81A6C6] focus:border-transparent outline-none text-sm transition"
                        />
                    </div>

                    {/* Body */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Isi Email
                        </label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            rows={14}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#81A6C6] focus:border-transparent outline-none text-sm transition font-mono leading-relaxed resize-none"
                        />
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-800 text-xs leading-relaxed">
                        <strong>ℹ️ Info:</strong> Jika SMTP belum dikonfigurasi, email akan disiapkan untuk pengiriman manual melalui Gmail. Klik tombol &quot;Buka Gmail&quot; untuk langsung membuka Gmail Compose.
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
                    <button
                        onClick={handleOpenGmail}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition text-sm font-medium shadow-sm"
                    >
                        <ExternalLink size={16} />
                        Buka Gmail
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 text-gray-600 hover:text-gray-800 transition text-sm font-medium"
                        >
                            Tutup
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={isSending || sendStatus === "success"}
                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSending ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} />
                                    Mengirim...
                                </>
                            ) : sendStatus === "success" ? (
                                <>
                                    <CheckCircle size={16} />
                                    Terkirim
                                </>
                            ) : (
                                <>
                                    <Send size={16} />
                                    Kirim Undangan
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InterviewPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isExtracting, setIsExtracting] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [emailModalEmployee, setEmailModalEmployee] = useState<Employee | null>(null);

    // Load candidates from interviewEmployees (persisted) and interviewQueue (temporary from Results page)
    useEffect(() => {
        try {
            // 1. Load already saved candidates
            const savedEmployeesStr = localStorage.getItem("interviewEmployees");
            let currentEmployees: Employee[] = [];
            if (savedEmployeesStr) {
                currentEmployees = JSON.parse(savedEmployeesStr).map((emp: any) => ({
                    ...emp,
                    createdAt: emp.createdAt ? new Date(emp.createdAt) : new Date(),
                }));
            }

            // 2. Load temp queue from Results page
            const queueStr = localStorage.getItem("interviewQueue");
            let merged = [...currentEmployees];
            let addedCount = 0;

            if (queueStr) {
                const queue = JSON.parse(queueStr) as Array<{
                    name: string;
                    email?: string;
                    score?: number;
                    filename?: string;
                }>;

                if (queue.length > 0) {
                    const newEmployees: Employee[] = [];
                    queue.forEach((item) => {
                        // Deduplicate: check if already exists by name or filename
                        const isDuplicate = currentEmployees.some(
                            (emp) => emp.name === (item.name || item.filename) ||
                                     (item.filename && emp.filename === item.filename)
                        );
                        if (!isDuplicate) {
                            const id = generateId();
                            newEmployees.push({
                                id,
                                name: item.name || item.filename || "Kandidat",
                                email: item.email || "",
                                password: generatePassword(),
                                link: generateLink(id),
                                sessionStarted: false,
                                invitationSent: false,
                                createdAt: new Date(),
                                score: item.score,
                                filename: item.filename,
                            });
                        }
                    });

                    if (newEmployees.length > 0) {
                        merged = [...newEmployees, ...currentEmployees];
                        addedCount = newEmployees.length;
                    }
                    localStorage.removeItem("interviewQueue");
                }
            }

            setEmployees(merged);
            localStorage.setItem("interviewEmployees", JSON.stringify(merged));

            if (addedCount > 0) {
                setStatusMessage(
                    `${addedCount} kandidat lolos seleksi berkas berhasil dimuat!`
                );
                setTimeout(() => setStatusMessage(""), 5000);
            }
        } catch (e) {
            console.error("Error loading interview candidates:", e);
        }
    }, []);

    const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (!selectedFiles || selectedFiles.length === 0) return;
        const file = selectedFiles[0];

        setIsExtracting(true);
        setErrorMessage("");
        setStatusMessage("Sedang mengekstrak data kandidat dari file...");

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
            const name = data.name || "Kandidat Baru";
            const email = data.email || "";

            const password = generatePassword();
            const id = generateId();
            const link = generateLink(id);

            const newEmployee: Employee = {
                id,
                name: name,
                email: email,
                password,
                link,
                sessionStarted: false,
                invitationSent: false,
                createdAt: new Date(),
            };

            setEmployees((prev) => {
                const updated = [newEmployee, ...prev];
                localStorage.setItem("interviewEmployees", JSON.stringify(updated));
                return updated;
            });
            setStatusMessage(
                `Kandidat "${newEmployee.name}" berhasil ditambahkan! ${email ? `Email: ${email}` : "Email belum terdeteksi."}`
            );
            setTimeout(() => setStatusMessage(""), 5000);
        } catch (err: unknown) {
            const msg =
                err instanceof Error
                    ? err.message
                    : "Terjadi kesalahan saat memproses file.";
            setErrorMessage(msg);
            setTimeout(() => setErrorMessage(""), 5000);
        } finally {
            setIsExtracting(false);
            e.target.value = "";
        }
    };

    const handleStartSession = (id: string) => {
        setEmployees((prev) => {
            const updated = prev.map((emp) =>
                emp.id === id ? { ...emp, sessionStarted: true } : emp
            );
            localStorage.setItem("interviewEmployees", JSON.stringify(updated));
            return updated;
        });
        setStatusMessage("Sesi interview dimulai!");
        setTimeout(() => setStatusMessage(""), 2000);
    };

    const handleOpenEmailModal = (employee: Employee) => {
        setEmailModalEmployee(employee);
    };

    const handleEmailSent = (employeeId: string) => {
        setEmployees((prev) => {
            const updated = prev.map((emp) =>
                emp.id === employeeId ? { ...emp, invitationSent: true } : emp
            );
            localStorage.setItem("interviewEmployees", JSON.stringify(updated));
            return updated;
        });
    };

    const handleCopyLink = (text: string, copyId: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(copyId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDeleteEmployee = (id: string) => {
        setEmployees((prev) => {
            const updated = prev.filter((emp) => emp.id !== id);
            localStorage.setItem("interviewEmployees", JSON.stringify(updated));
            return updated;
        });
        setStatusMessage("Kandidat dihapus");
        setTimeout(() => setStatusMessage(""), 2000);
    };

    const handleEmailChange = (id: string, newEmail: string) => {
        setEmployees((prev) => {
            const updated = prev.map((emp) =>
                emp.id === id ? { ...emp, email: newEmail } : emp
            );
            localStorage.setItem("interviewEmployees", JSON.stringify(updated));
            return updated;
        });
    };

    return (
        <div className="min-h-screen bg-[linear-gradient(to_bottom,#F7F4EE,#AACDDC,#E8DED3,#AACDDC,#F7F4EE)] p-8">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-8">
                <a
                    href="/"
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-[#81A6C6] transition mb-6 text-sm"
                >
                    <ArrowLeft size={16} />
                    Kembali ke Beranda
                </a>

                <div className="flex items-center gap-4 mb-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#81A6C6] to-[#6c93b5] rounded-2xl flex items-center justify-center shadow-lg">
                        <UserCheck size={28} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-[#1a1a1a]">
                            Undangan & Manajemen Interview
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Kirim undangan ke Gmail kandidat yang berkasnya telah lolos seleksi
                        </p>
                    </div>
                </div>

                {/* Summary Stats */}
                {employees.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mt-6">
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-[#D9CEBF] shadow-sm">
                            <div className="flex items-center gap-3">
                                <FileCheck size={20} className="text-[#81A6C6]" />
                                <div>
                                    <p className="text-2xl font-bold text-[#1a1a1a]">{employees.length}</p>
                                    <p className="text-xs text-gray-500">Total Kandidat Lolos</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-[#D9CEBF] shadow-sm">
                            <div className="flex items-center gap-3">
                                <Mail size={20} className="text-emerald-600" />
                                <div>
                                    <p className="text-2xl font-bold text-emerald-700">
                                        {employees.filter((e) => e.invitationSent).length}
                                    </p>
                                    <p className="text-xs text-gray-500">Undangan Terkirim</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-[#D9CEBF] shadow-sm">
                            <div className="flex items-center gap-3">
                                <Clock size={20} className="text-amber-600" />
                                <div>
                                    <p className="text-2xl font-bold text-amber-700">
                                        {employees.filter((e) => !e.invitationSent).length}
                                    </p>
                                    <p className="text-xs text-gray-500">Belum Diundang</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
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

            {/* Add Candidate Section */}
            <div className="max-w-6xl mx-auto mb-8 bg-white rounded-xl shadow-md p-6 border border-[#D9CEBF]">
                <h2 className="text-xl font-semibold text-[#1a1a1a] mb-1 flex items-center gap-2">
                    <Plus size={24} className="text-[#81A6C6]" />
                    Tambah Kandidat Lolos Seleksi
                </h2>
                <p className="text-sm text-gray-500 mb-4 ml-8">
                    Upload CV/berkas kandidat yang telah lolos seleksi berkas untuk didaftarkan interview
                </p>

                <div className="flex flex-col gap-4">
                    <div className="w-full">
                        <label
                            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition min-h-[140px] text-center ${
                                isExtracting
                                    ? "border-gray-300 bg-gray-50 cursor-not-allowed"
                                    : "border-[#81A6C6] hover:bg-blue-50/30 bg-white"
                            }`}
                        >
                            {isExtracting ? (
                                <Loader2
                                    className="text-[#81A6C6] mb-3 animate-spin"
                                    size={32}
                                />
                            ) : (
                                <Upload className="text-[#81A6C6] mb-3" size={32} />
                            )}
                            <span className="text-sm font-medium text-gray-600">
                                {isExtracting
                                    ? "Sedang mengekstrak data kandidat..."
                                    : "Klik atau seret file PDF / DOCX di sini"}
                            </span>
                            <span className="text-xs text-gray-400 mt-1">
                                Nama dan email kandidat akan dideteksi secara otomatis dari dokumen
                            </span>
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
                <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md p-12 text-center border border-[#D9CEBF]">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles size={32} className="text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg font-medium">
                        Belum ada kandidat lolos seleksi
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                        Upload berkas kandidat di atas, atau loloskan kandidat dari halaman{" "}
                        <a href="/results" className="text-[#81A6C6] underline hover:text-[#6c93b5]">
                            Hasil Analisis
                        </a>
                    </p>
                </div>
            ) : (
                <div className="max-w-6xl mx-auto space-y-4">
                    {employees.map((employee) => (
                        <div
                            key={employee.id}
                            className={`bg-white rounded-xl shadow-md border overflow-hidden hover:shadow-lg transition-all duration-300 ${
                                employee.invitationSent
                                    ? "border-emerald-200"
                                    : "border-[#D9CEBF]"
                            }`}
                        >
                            {/* Status Banner */}
                            {employee.invitationSent && (
                                <div className="bg-emerald-50 px-6 py-2 flex items-center gap-2 text-emerald-700 text-sm font-medium border-b border-emerald-200">
                                    <CheckCircle size={16} />
                                    Undangan interview telah dikirim
                                </div>
                            )}

                            <div className="p-6">
                                <div className="flex items-start justify-between">
                                    {/* Left: Employee Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 bg-gradient-to-br from-[#81A6C6] to-[#6c93b5] rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                {employee.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-[#1a1a1a]">
                                                    {employee.name}
                                                </h3>
                                                {employee.score !== undefined && (
                                                    <span className="text-xs bg-[#81A6C6]/15 text-[#5a7fa0] px-2 py-0.5 rounded-full font-medium">
                                                        Skor: {employee.score}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            {/* Email */}
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                                                    Email Gmail
                                                </label>
                                                <input
                                                    type="email"
                                                    value={employee.email}
                                                    onChange={(e) =>
                                                        handleEmailChange(
                                                            employee.id,
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="email@gmail.com"
                                                    className="w-full bg-gray-50 px-3 py-2 rounded-lg text-sm text-gray-800 border border-gray-200 focus:ring-2 focus:ring-[#81A6C6] focus:border-transparent outline-none transition"
                                                />
                                            </div>

                                            {/* Status */}
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                                                    Status
                                                </label>
                                                <div
                                                    className={`px-3 py-2 rounded-lg text-sm font-medium text-center ${
                                                        employee.sessionStarted
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : employee.invitationSent
                                                            ? "bg-blue-100 text-blue-700"
                                                            : "bg-gray-100 text-gray-600"
                                                    }`}
                                                >
                                                    {employee.sessionStarted
                                                        ? "✓ Sesi Aktif"
                                                        : employee.invitationSent
                                                        ? "📩 Undangan Terkirim"
                                                        : "⏳ Menunggu Undangan"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Action Buttons */}
                                    <div className="flex flex-col gap-2 ml-4">
                                        <button
                                            onClick={() =>
                                                handleOpenEmailModal(employee)
                                            }
                                            className={`w-fit px-6 py-3 rounded-xl shadow-md hover:scale-105 transition duration-300 font-semibold flex items-center gap-2 text-sm ${
                                                employee.invitationSent
                                                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                                    : "bg-[#81A6C6] text-white"
                                            }`}
                                        >
                                            {employee.invitationSent ? (
                                                <>
                                                    <CheckCircle size={16} />
                                                    Kirim Ulang
                                                </>
                                            ) : (
                                                <>
                                                    <Mail size={16} />
                                                    Kirim ke Gmail
                                                </>
                                            )}
                                        </button>

                                        <button
                                            onClick={() =>
                                                handleDeleteEmployee(
                                                    employee.id
                                                )
                                            }
                                            className="w-fit px-6 py-3 rounded-xl bg-red-50 text-red-600 shadow-sm hover:bg-red-100 hover:scale-105 transition duration-300 font-semibold flex items-center gap-2 text-sm"
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

            {/* Email Modal */}
            {emailModalEmployee && (
                <EmailModal
                    employee={emailModalEmployee}
                    onClose={() => setEmailModalEmployee(null)}
                    onSent={handleEmailSent}
                />
            )}
        </div>
    );
}
