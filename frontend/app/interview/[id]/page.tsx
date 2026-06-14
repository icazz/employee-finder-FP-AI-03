"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
    Lock,
    Loader2,
    AlertCircle,
    CheckCircle,
    User,
    Send,
    FileQuestion,
} from "lucide-react";

type SessionState = "loading" | "password" | "no_questions" | "interview" | "submitted" | "ended" | "error";

interface Question {
    id: number;
    type: "multiple_choice" | "essay";
    question: string;
    options?: string[];
    points: number;
}

export default function InterviewSessionPage() {
    const params = useParams();
    const sessionId = params.id as string;

    const [state, setState] = useState<SessionState>("loading");
    const [password, setPassword] = useState("");
    const [candidateName, setCandidateName] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isValidating, setIsValidating] = useState(false);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mcScore, setMcScore] = useState<number | null>(null);
    const [essayScore, setEssayScore] = useState<number | null>(null);
    const [finalScore, setFinalScore] = useState<number | null>(null);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const response = await fetch(`/api/v1/interview/session/${sessionId}`);
                if (!response.ok) {
                    setState("error");
                    setErrorMessage("Sesi interview tidak ditemukan atau sudah berakhir.");
                    return;
                }
                const data = await response.json();
                if (!data.active) {
                    setState("ended");
                    return;
                }
                setCandidateName(data.name);
                setState("password");
            } catch {
                setState("error");
                setErrorMessage("Gagal terhubung ke server.");
            }
        };
        checkSession();
    }, [sessionId]);

    const handleValidatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsValidating(true);
        setErrorMessage("");

        try {
            const response = await fetch(`/api/v1/interview/session/${sessionId}/validate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();

            if (!data.valid) {
                setErrorMessage("Password salah. Silakan coba lagi.");
                setIsValidating(false);
                return;
            }

            setCandidateName(data.name);

            if (!data.joined) {
                await fetch(`/api/v1/interview/session/${sessionId}/join`, {
                    method: "POST",
                });
            }

            const questionsResponse = await fetch(`/api/v1/interview/session/${sessionId}/questions`);
            
            if (questionsResponse.ok) {
                const questionsData = await questionsResponse.json();
                setQuestions(questionsData.questions);
                setState("interview");
            } else {
                setState("no_questions");
            }
        } catch {
            setErrorMessage("Gagal memvalidasi sesi. Silakan coba lagi.");
        } finally {
            setIsValidating(false);
        }
    };

    const handleAnswerChange = (questionId: number, answer: string) => {
        setAnswers((prev) => ({ ...prev, [questionId]: answer }));
    };

    const handleSubmitAnswers = async () => {
        setIsSubmitting(true);
        setErrorMessage("");

        try {
            const response = await fetch(`/api/v1/interview/session/${sessionId}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answers }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Gagal mengirim jawaban");
            }

            const data = await response.json();
            setMcScore(data.mc_score);
            setEssayScore(data.essay_score);
            setFinalScore(data.final_score);
            setState("submitted");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Gagal mengirim jawaban.";
            setErrorMessage(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (state === "loading") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#F3E8DA] to-[#E8DED3] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#81A6C6]" size={48} />
            </div>
        );
    }

    if (state === "error") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#F3E8DA] to-[#E8DED3] flex items-center justify-center p-6">
                <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md w-full text-center border border-[#D9CEBF]">
                    <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
                    <h1 className="text-2xl font-bold text-[#5A5550] mb-2">Sesi Tidak Valid</h1>
                    <p className="text-gray-600">{errorMessage}</p>
                </div>
            </div>
        );
    }

    if (state === "ended") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#F3E8DA] to-[#E8DED3] flex items-center justify-center p-6">
                <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md w-full text-center border border-[#D9CEBF]">
                    <CheckCircle className="text-emerald-500 mx-auto mb-4" size={48} />
                    <h1 className="text-2xl font-bold text-[#5A5550] mb-2">Sesi Telah Berakhir</h1>
                    <p className="text-gray-600">
                        Sesi interview ini telah selesai. Terima kasih atas partisipasi Anda.
                    </p>
                </div>
            </div>
        );
    }

    if (state === "no_questions") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#F3E8DA] to-[#E8DED3] flex items-center justify-center p-6">
                <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md w-full text-center border border-[#D9CEBF]">
                    <FileQuestion className="text-orange-500 mx-auto mb-4" size={48} />
                    <h1 className="text-2xl font-bold text-[#5A5550] mb-2">Soal Belum Tersedia</h1>
                    <p className="text-gray-600">
                        Halo <span className="font-semibold text-[#81A6C6]">{candidateName}</span>,<br />
                        Soal interview belum di-generate oleh HR. Silakan tunggu atau hubungi HR untuk informasi lebih lanjut.
                    </p>
                </div>
            </div>
        );
    }

    if (state === "password") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#F3E8DA] to-[#E8DED3] flex items-center justify-center p-6">
                <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md w-full border border-[#D9CEBF]">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-[#81A6C6]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="text-[#81A6C6]" size={32} />
                        </div>
                        <h1 className="text-2xl font-bold text-[#5A5550] mb-2">Interview Online</h1>
                        <p className="text-gray-600 text-sm">
                            Selamat datang, <span className="font-semibold text-[#81A6C6]">{candidateName}</span>
                        </p>
                        <p className="text-gray-500 text-xs mt-1">Masukkan password untuk memulai sesi interview</p>
                    </div>

                    {errorMessage && (
                        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700 text-sm">
                            <AlertCircle size={16} />
                            {errorMessage}
                        </div>
                    )}

                    <form onSubmit={handleValidatePassword} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[#5A5550] mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Masukkan password Anda"
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-[#D9CEBF] text-[#5A5550] outline-none focus:border-[#81A6C6] focus:bg-white transition"
                                required
                                autoFocus
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isValidating || !password.trim()}
                            className="w-full py-3 rounded-xl bg-[#81A6C6] text-white font-medium hover:bg-[#6c93b5] transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isValidating ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Memvalidasi...
                                </>
                            ) : (
                                <>
                                    <Lock size={18} />
                                    Mulai Interview
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (state === "submitted") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#F3E8DA] to-[#E8DED3] flex items-center justify-center p-6">
                <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md w-full text-center border border-[#D9CEBF]">
                    <CheckCircle className="text-emerald-500 mx-auto mb-4" size={64} />
                    <h1 className="text-2xl font-bold text-[#5A5550] mb-2">Jawaban Terkirim!</h1>
                    <p className="text-gray-600 mb-4">
                        Terima kasih <span className="font-semibold text-[#81A6C6]">{candidateName}</span>,<br />
                        Jawaban Anda telah berhasil dikirim.
                    </p>
                    <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
                        {mcScore !== null && (
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Pilihan Ganda:</span>
                                <span className="text-lg font-bold text-blue-600">{mcScore}%</span>
                            </div>
                        )}
                        {essayScore !== null && (
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Essay (AI):</span>
                                <span className="text-lg font-bold text-purple-600">{essayScore}%</span>
                            </div>
                        )}
                        {finalScore !== null && (
                            <div className="border-t pt-2 flex justify-between items-center">
                                <span className="text-sm font-semibold text-gray-700">Skor Akhir:</span>
                                <span className="text-2xl font-bold text-[#81A6C6]">{finalScore}%</span>
                            </div>
                        )}
                    </div>
                    <p className="text-sm text-gray-500">
                        HR akan menghubungi Anda untuk langkah selanjutnya.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F3E8DA] to-[#E8DED3] p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg border border-[#D9CEBF] overflow-hidden">
                    <div className="bg-[#81A6C6] p-6 text-white">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                <User size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">Interview Online</h1>
                                <p className="text-white/80 text-sm">Kandidat: {candidateName}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        {errorMessage && (
                            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-700">
                                <AlertCircle size={20} />
                                {errorMessage}
                            </div>
                        )}

                        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-blue-800 text-sm">
                                <span className="font-semibold">Petunjuk:</span> Jawab semua pertanyaan di bawah ini. 
                                Soal pilihan ganda akan dinilai otomatis, soal essay akan dinilai oleh HR.
                            </p>
                        </div>

                        <div className="space-y-6">
                            {questions.map((q, idx) => (
                                <div key={q.id} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                    <div className="flex items-start gap-3 mb-4">
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
                                            <p className="text-gray-800 font-medium">{q.question}</p>
                                        </div>
                                    </div>

                                    {q.type === "multiple_choice" && q.options ? (
                                        <div className="space-y-2 ml-11">
                                            {q.options.map((opt, optIdx) => {
                                                const optLetter = opt.charAt(0);
                                                const isSelected = answers[q.id] === optLetter;
                                                return (
                                                    <label
                                                        key={optIdx}
                                                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                                                            isSelected
                                                                ? "bg-[#81A6C6]/10 border-2 border-[#81A6C6]"
                                                                : "bg-white border-2 border-gray-200 hover:border-[#81A6C6]/50"
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={`question-${q.id}`}
                                                            value={optLetter}
                                                            checked={isSelected}
                                                            onChange={() => handleAnswerChange(q.id, optLetter)}
                                                            className="w-4 h-4 text-[#81A6C6]"
                                                        />
                                                        <span className="text-gray-700">{opt}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="ml-11">
                                            <textarea
                                                value={answers[q.id] || ""}
                                                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                placeholder="Tulis jawaban Anda di sini..."
                                                rows={4}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#81A6C6] focus:ring-2 focus:ring-[#81A6C6]/20 outline-none transition resize-none"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                                {Object.keys(answers).length} / {questions.length} soal dijawab
                            </p>
                            <button
                                onClick={handleSubmitAnswers}
                                disabled={isSubmitting || Object.keys(answers).length === 0}
                                className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Mengirim...
                                    </>
                                ) : (
                                    <>
                                        <Send size={18} />
                                        Kirim Jawaban
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
