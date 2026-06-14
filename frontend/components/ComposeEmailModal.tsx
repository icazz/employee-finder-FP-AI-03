"use client";

import { useState } from "react";
import { X, Mail, Send, Loader2 } from "lucide-react";

interface ComposeEmailModalProps {
    isOpen: boolean;
    recipientCount: number;
    onClose: () => void;
    onSend: (subject: string, body: string) => void;
    isSending: boolean;
}

export default function ComposeEmailModal({
    isOpen,
    recipientCount,
    onClose,
    onSend,
    isSending,
}: ComposeEmailModalProps) {
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!subject.trim() || !body.trim()) return;
        onSend(subject, body);
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#E8DED3] rounded-2xl max-w-2xl w-full shadow-2xl border border-[#D9CEBF]">
                <div className="p-5 border-b border-[#D9CEBF] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Mail size={24} className="text-[#81A6C6]" />
                        <h3 className="text-lg font-bold text-[#5A5550]">
                            Compose Email
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[#D9CEBF] rounded-full transition"
                    >
                        <X size={20} className="text-gray-600" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-600">
                        Sending to <span className="font-bold text-[#81A6C6]">{recipientCount}</span> candidate{recipientCount > 1 ? "s" : ""}
                    </p>

                    <div>
                        <label className="text-sm font-medium text-[#5A5550] block mb-2">
                            Subject
                        </label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Enter email subject..."
                            className="w-full px-4 py-3 rounded-xl bg-white border border-[#D9CEBF] text-[#5A5550] outline-none focus:border-[#81A6C6] transition"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-[#5A5550] block mb-2">
                            Message Body
                        </label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Write your message here..."
                            rows={8}
                            className="w-full px-4 py-3 rounded-xl bg-white border border-[#D9CEBF] text-[#5A5550] outline-none focus:border-[#81A6C6] transition resize-none"
                        />
                        <p className="text-xs text-gray-500 mt-2 italic">
                            Note: No need to write "Dear..." — it will be automatically added as the first line with the recipient's name.
                        </p>
                    </div>
                </div>

                <div className="p-5 border-t border-[#D9CEBF] flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSending}
                        className="flex-1 py-3 rounded-xl bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSending || !subject.trim() || !body.trim()}
                        className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSending ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send size={18} />
                                Send Email
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
