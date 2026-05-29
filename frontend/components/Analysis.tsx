import {
    XCircle,
    CheckCircle2,
    Clock3,
    Brain,
    Target,
    Zap,
} from "lucide-react";

export default function Analysis() {
    return (
        <section
            id="analisis"
            className="pt-32 pb-20 px-6">

            {/* TITLE */}
            <div className="text-center">
                <h2 className="text-4xl font-serif">
                    See How Employee Finder Works
                </h2>

                <p className="mt-6 text-gray-700">
                    Bandingkan proses screening manual
                    dengan analisis otomatis berbasis AI.
                </p>
            </div>

            {/* CONTENT */}
            <div className="grid lg:grid-cols-2 gap-8 mt-12 max-w-5xl mx-auto">

                {/* BEFORE */}
                <div className="border border-red-300 rounded-3xl p-6 bg-[#E8DED3] shadow-xl">

                    <div className="inline-flex items-center gap-2 border border-red-400 rounded-full px-4 py-2 text-sm">
                        <XCircle size={18} />
                        BEFORE
                    </div>

                    <h3 className="mt-6 text-2xl font-serif">
                        Manual Screening
                    </h3>

                    <p className="mt-4 text-gray-700">
                        Proses screening manual membutuhkan
                        waktu lama dan rentan bias.
                    </p>

                    <div className="space-y-3 mt-6">

                        <div className="bg-[#F3E8DA] rounded-xl p-4">
                            ❌ Screening CV satu per satu
                        </div>

                        <div className="bg-[#F3E8DA] rounded-xl p-4">
                            ❌ Membutuhkan waktu lama
                        </div>

                        <div className="bg-[#F3E8DA] rounded-xl p-4">
                            ❌ Penilaian subjektif
                        </div>

                        <div className="bg-[#F3E8DA] rounded-xl p-4">
                            ❌ Sulit membandingkan kandidat
                        </div>

                        <div className="bg-[#F3E8DA] rounded-xl p-4">
                            ❌ Risiko kehilangan kandidat terbaik
                        </div>
                    </div>

                    <div className="mt-8 flex items-center gap-3 text-gray-700">
                        <Clock3 />
                        <p>
                            Rata-rata screening:{" "}
                            <span className="text-red-500 font-semibold">
                                2-3 hari
                            </span>
                        </p>
                    </div>
                </div>

                {/* AFTER */}
                <div className="border border-blue-300 rounded-3xl p-6 bg-[#E8DED3] shadow-xl">

                    <div className="inline-flex items-center gap-2 border border-blue-400 rounded-full px-4 py-2 text-sm">
                        <CheckCircle2 size={18} />
                        AFTER
                    </div>

                    <h3 className="mt-6 text-2xl font-serif">
                        AI Analysis
                    </h3>

                    <p className="mt-4 text-gray-700">
                        Employee Finder menganalisis
                        dan meranking kandidat secara otomatis.
                    </p>

                    <div className="space-y-3 mt-6">

                        <div className="bg-[#F3E8DA] rounded-xl p-4">
                            ✅ Ranking kandidat otomatis
                        </div>

                        <div className="bg-[#F3E8DA] rounded-xl p-4">
                            ✅ Match score real-time
                        </div>

                        <div className="bg-[#F3E8DA] rounded-xl p-4">
                            ✅ Analisis berbasis IndoBERT
                        </div>

                        <div className="bg-[#F3E8DA] rounded-xl p-4">
                            ✅ Perbandingan kandidat mudah
                        </div>

                        <div className="bg-[#F3E8DA] rounded-xl p-4">
                            ✅ Hasil objektif & akurat
                        </div>
                    </div>

                    {/* STATS */}
                    <div className="grid grid-cols-3 gap-3 mt-8">

                        <div className="bg-[#F3E8DA] rounded-2xl p-5 text-center">
                            <Brain className="mx-auto mb-3" />
                            <h4 className="text-2xl font-bold">
                                50
                            </h4>
                            <p className="text-sm text-gray-600">
                                Kandidat
                            </p>
                        </div>

                        <div className="bg-[#F3E8DA] rounded-2xl p-5 text-center">
                            <Target className="mx-auto mb-3" />
                            <h4 className="text-2xl font-bold">
                                90%
                            </h4>
                            <p className="text-sm text-gray-600">
                                Match
                            </p>
                        </div>

                        <div className="bg-[#F3E8DA] rounded-2xl p-5 text-center">
                            <Zap className="mx-auto mb-3" />
                            <h4 className="text-2xl font-bold">
                                &lt; 1 Jam
                            </h4>
                            <p className="text-sm text-gray-600">
                                Lebih Cepat
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* FOOTER TEXT */}
            <div className="mt-16 text-center">
                <p className="text-xl max-w-4xl mx-auto leading-relaxed text-[#5A5550]">
                    Employee Finder AI membantu HR menemukan
                    kandidat terbaik dengan lebih cepat,
                    akurat, dan objektif.
                </p>

                <div className="flex justify-center gap-10 mt-8 text-sm text-gray-600">
                    <span>⚡ Lebih cepat</span>
                    <span>🎯 Lebih akurat</span>
                    <span>🧠 Lebih objektif</span>
                </div>
            </div>
        </section>
    );
}