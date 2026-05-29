import {
    Upload,
    BarChart3,
    Search,
} from "lucide-react";

export default function Features() {
    return (
        <section
            id="layanan"
            className="pt-32 pb-20 px-8">

            {/* TITLE */}
            <div className="text-center">
                <h2 className="text-4xl font-serif text-black">
                    AI Features for Smarter Hiring
                </h2>

                <p className="mt-6 text-gray-700 max-w-2xl mx-auto leading-8">
                    Platform intelligent recruitment yang membantu
                    proses seleksi kandidat menjadi lebih objektif
                    dan terstruktur.
                </p>
            </div>

            {/* CARDS */}
            <div className="grid md:grid-cols-3 gap-6 mt-12 max-w-5xl mx-auto">

                {/* CARD 1 */}
                <div className="bg-[#E8DED3] rounded-3xl p-5 shadow-xl hover:-translate-y-2 transition duration-300">

                    <Upload
                        size={40}
                        className="text-[#5A5550]"
                    />

                    <h3 className="text-2xl font-serif mt-6 leading-tight">
                        Multi CV Upload & Ranking
                    </h3>

                    <div className="w-20 h-1 bg-[#DCCFF2] mt-5 rounded-full" />

                    <p className="mt-6 text-gray-700 leading-8">
                        Upload banyak CV sekaligus.
                        Sistem otomatis akan melakukan
                        ranking kandidat berdasarkan
                        skor kemiripan dengan Job Description.
                    </p>

                    {/* MINI BOX */}
                    <div className="mt-10 bg-[#F3E8DA] rounded-2xl p-5">

                        <div className="flex justify-between text-sm text-gray-600">
                            <span>file1.pdf</span>
                            <span>file2.pdf</span>
                            <span>file3.pdf</span>
                        </div>

                        <div className="mt-5">
                            <div className="w-full bg-white rounded-full h-3">
                                <div className="bg-[#AACDDC] h-3 rounded-full w-[78%]" />
                            </div>

                            <p className="text-xs mt-2 text-gray-500">
                                Uploading... 78%
                            </p>
                        </div>
                    </div>
                </div>

                {/* CARD 2 */}
                <div className="bg-[#E8DED3] rounded-3xl p-5 shadow-xl hover:-translate-y-2 transition duration-300">

                    <BarChart3
                        size={40}
                        className="text-[#5A5550]"
                    />

                    <h3 className="text-2xl font-serif mt-6 leading-tight">
                        Match Score Dashboard
                    </h3>

                    <div className="w-20 h-1 bg-[#DCCFF2] mt-5 rounded-full" />

                    <p className="mt-6 text-gray-700 leading-8">
                        Visualisasi skor setiap kandidat
                        dalam bentuk gauge dengan breakdown
                        setiap aspek yang mudah dipahami.
                    </p>

                    {/* MINI SCORE */}
                    <div className="mt-10 bg-[#F3E8DA] rounded-2xl p-5">

                        <div className="space-y-3">

                            <div className="flex justify-between">
                                <span>Michael Steven</span>
                                <span className="text-green-600">
                                    98%
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span>Sarah Johnson</span>
                                <span className="text-yellow-600">
                                    89%
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span>Budi Santoso</span>
                                <span className="text-red-500">
                                    70%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CARD 3 */}
                <div className="bg-[#E8DED3] rounded-3xl p-5 shadow-xl hover:-translate-y-2 transition duration-300">

                    <Search
                        size={40}
                        className="text-[#5A5550]"
                    />

                    <h3 className="text-2xl font-serif mt-6 leading-tight">
                        Semantic Similarity dengan IndoBERT
                    </h3>

                    <div className="w-20 h-1 bg-[#DCCFF2] mt-5 rounded-full" />

                    <p className="mt-6 text-gray-700 leading-8">
                        Model AI yang memahami konteks
                        bahasa Indonesia, bukan hanya
                        keyword. Lebih akurat dan relevan.
                    </p>

                    {/* MINI AI */}
                    <div className="mt-10 bg-[#F3E8DA] rounded-2xl p-5 flex items-center justify-between">

                        <div className="bg-white rounded-xl p-4">
                            CV
                        </div>

                        <div className="text-[#81A6C6] font-bold">
                            IndoBERT
                        </div>

                        <div className="bg-white rounded-xl p-4">
                            JD
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}