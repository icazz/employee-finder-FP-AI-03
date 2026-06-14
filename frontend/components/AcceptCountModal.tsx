"use client";

import { useState } from "react";
import { X, Send, Users } from "lucide-react";

interface AcceptCountModalProps {
    isOpen: boolean;
    totalCandidates: number;
    onClose: () => void;
    onNext: (count: number) => void;
}

export default function AcceptCountModal({
    isOpen,
    totalCandidates,
    onClose,
    onNext,
}: AcceptCountModalProps) {
    const [count, setCount] = useState(1);

    if (!isOpen) return null;

    const handleSubmit = () => {
        onNext(count);
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#E8DED3] rounded-2xl max-w-md w-full shadow-2xl border border-[#D9CEBF]">
                <div className="p-5 border-b border-[#D9CEBF] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Users size={24} className="text-[#81A6C6]" />
                        <h3 className="text-lg font-bold text-[#5A5550]">
                            How Many to Accept?
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
                        You have <span className="font-bold text-[#81A6C6]">{totalCandidates}</span> candidates.
                        How many top candidates do you want to send the email to?
                    </p>

                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-[#5A5550]">
                            Number to accept:
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={totalCandidates}
                            value={count}
                            onChange={(e) => setCount(Math.max(1, Math.min(totalCandidates, parseInt(e.target.value) || 1)))}
                            className="flex-1 px-4 py-3 rounded-xl bg-white border border-[#D9CEBF] text-[#5A5550] font-semibold text-center text-lg outline-none focus:border-[#81A6C6] transition"
                        />
                    </div>

                    <p className="text-xs text-gray-500">
                        Emails will be sent to the top {count} candidate{count > 1 ? "s" : ""} based on ranking.
                    </p>
                </div>

                <div className="p-5 border-t border-[#D9CEBF] flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 py-3 rounded-xl bg-[#81A6C6] text-white font-medium hover:bg-[#6c93b5] transition flex items-center justify-center gap-2"
                    >
                        <Send size={18} />
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
