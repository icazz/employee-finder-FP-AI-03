export default function Navbar() {
    return (
        <nav className="fixed top-5 left-1/2 -translate-x-1/2 z-50">

            <div className="flex items-center gap-8 px-10 py-3 rounded-full bg-white/60 backdrop-blur-xl shadow-xl border border-white/40">

                <a
                    href="#home"
                    className="text-sm hover:text-[#81A6C6] transition"
                >
                    Home
                </a>

                <a
                    href="#layanan"
                    className="text-sm hover:text-[#81A6C6] transition"
                >
                    Layanan
                </a>

                <a
                    href="#proses"
                    className="text-sm hover:text-[#81A6C6] transition"
                >
                    Proses
                </a>

                <a
                    href="#analisis"
                    className="text-sm hover:text-[#81A6C6] transition"
                >
                    Analisis
                </a>

                <a
                    href="#kontak"
                    className="text-sm hover:text-[#81A6C6] transition"
                >
                    Kontak
                </a>
            </div>
        </nav>
    );
}