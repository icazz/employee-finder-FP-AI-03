import {
    FileText,
    Upload,
    Brain,
    BarChart3,
} from "lucide-react";

export default function Process() {
    return (
        <section
            id="proses"
            className="pt-32 pb-20 px-6">

            {/* TITLE */}
            <div className="text-center">
                <h2 className="text-4xl font-serif">
                    How Employee Finder Works
                </h2>

                <p className="mt-6 text-gray-700">
                    Proses screening kandidat berbasis AI
                    dalam empat langkah sederhana.
                </p>
            </div>

            {/* PROCESS CARDS */}
            <div className="grid lg:grid-cols-4 gap-6 mt-12 max-w-6xl mx-auto">

                {/* CARD 1 */}
                <div className="relative rounded-3xl p-8 shadow-xl">

                    <div className="absolute -top-6 left-8 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-serif shadow-lg">
                        1
                    </div>

                    <div className="mt-6 flex justify-center">
                        <FileText size={48} className="text-[#5A5550]" />
                    </div>

                    <h3 className="mt-6 text-xl font-serif text-center">
                        Tentukan Kriteria
                    </h3>

                    <p className="mt-5 text-center text-gray-700 leading-8">
                        Masukkan deskripsi pekerjaan,
                        keahlian, kompetensi, dan
                        kualifikasi yang dibutuhkan.
                    </p>
                </div>

                {/* CARD 2 */}
                <div className="relative bg-[#E8DED3] rounded-3xl p-8 shadow-xl">

                    <div className="absolute -top-6 left-8 bg-[#F3E3D0] w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-serif shadow-lg">
                        2
                    </div>

                    <div className="mt-6 flex justify-center">
                        <Upload size={48} className="text-[#5A5550]" />
                    </div>

                    <h3 className="mt-6 text-xl font-serif text-center">
                        Upload CV
                    </h3>

                    <p className="mt-5 text-center text-gray-700 leading-8">
                        Unggah satu atau banyak file CV.
                        Sistem akan mengekstrak teks
                        otomatis.
                    </p>
                </div>

                {/* CARD 3 */}
                <div className="relative bg-[#E8DED3] rounded-3xl p-8 shadow-xl">

                    <div className="absolute -top-6 left-8 bg-[#F3E3D0] w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-serif shadow-lg">
                        3
                    </div>

                    <div className="mt-6 flex justify-center">
                        <Brain size={48} className="text-[#5A5550]" />
                    </div>

                    <h3 className="mt-6 text-xl font-serif text-center">
                        AI Analisis
                    </h3>

                    <p className="mt-5 text-center text-gray-700 leading-8">
                        AI menghitung semantic matching,
                        keyword gap analysis, dan
                        skor kecocokan kandidat.
                    </p>
                </div>

                {/* CARD 4 */}
                <div className="relative bg-[#E8DED3] rounded-3xl p-8 shadow-xl">

                    <div className="absolute -top-6 left-8 bg-[#F3E3D0] w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-serif shadow-lg">
                        4
                    </div>

                    <div className="mt-6 flex justify-center">
                        <BarChart3 size={48} className="text-[#5A5550]" />
                    </div>

                    <h3 className="mt-6 text-xl font-serif text-center">
                        Ranking Kandidat
                    </h3>

                    <p className="mt-5 text-center text-gray-700 leading-8">
                        Lihat ranking kandidat dari
                        skor tertinggi dan bandingkan
                        hasil analisis dengan mudah.
                    </p>
                </div>
            </div>

            {/* BOTTOM FLOW */}
            <div className="hidden lg:flex items-center justify-center gap-10 mt-12">

                <FileText size={40} />
                <div className="w-32 h-1 bg-[#F3DDF8]" />

                <Upload size={40} />
                <div className="w-32 h-1 bg-[#F3DDF8]" />

                <Brain size={40} />
                <div className="w-32 h-1 bg-[#F3DDF8]" />

                <BarChart3 size={40} />
            </div>
        </section>
    );
}