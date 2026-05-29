import { Mail, Users } from "lucide-react";
import { FaLinkedin, FaGithub } from "react-icons/fa";

export default function Contact() {
    return (
        <section
            id="kontak"
            className="min-h-screen grid lg:grid-cols-2">

            {/* LEFT IMAGE */}
            <div className="relative h-[500px] lg:h-auto">

                <img
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
                    alt="team"
                    className="w-full h-full object-cover opacity-70"
                />

                <div className="absolute inset-0 bg-[#D2C4B4]/20" />
            </div>

            {/* RIGHT CONTENT */}
            <div className="flex flex-col justify-center px-10 lg:px-20 py-20">

                <h2 className="text-6xl font-serif leading-tight text-[#5A5550]">
                    Let’s Build
                    <br />
                    Smarter Hiring
                </h2>

                <p className="mt-8 text-gray-700 leading-8 max-w-xl">
                    Hubungi kami untuk memulai proses
                    rekrutmen yang lebih cepat,
                    akurat, dan efisien bersama
                    Employee Finder AI.
                </p>

                {/* CONTACT */}
                <div className="space-y-6 mt-12">

                    <div className="flex items-center gap-4">
                        <Mail className="text-[#5A5550]" />
                        <p>employeefinder@gmail.com</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <FaLinkedin className="text-[#5A5550]" />
                        <p>linkedin.com/company/employeefinder</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <FaGithub className="text-[#5A5550]" />
                        <p>github.com/employeefinderAI</p>
                    </div>
                </div>

                {/* CONSULT BOX */}
                <div className="mt-14 bg-[#E8DED3] rounded-3xl p-8 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-lg">

                    <div className="flex items-center gap-5">
                        <Users
                            size={45}
                            className="text-[#5A5550]"
                        />

                        <div>
                            <h3 className="text-2xl font-serif">
                                Butuh Konsultasi?
                            </h3>

                            <p className="text-gray-700 mt-2">
                                Kami siap membantu kebutuhan
                                rekrutmenmu.
                            </p>
                        </div>
                    </div>

                    <button className="px-8 py-4 rounded-full bg-white shadow-lg hover:scale-105 transition duration-300">
                        Jadwalkan Demo
                    </button>
                </div>

                {/* FOOTER */}
                <div className="mt-16">

                    <p className="text-gray-700">
                        AI powered recruitment platform
                        untuk menemukan kandidat terbaik.
                    </p>

                    {/* SOCIAL */}
                    <div className="flex gap-6 mt-8">
                        <Mail className="cursor-pointer hover:text-[#81A6C6] transition" />
                        <FaLinkedin className="cursor-pointer hover:text-[#81A6C6] transition" />
                        <FaGithub className="cursor-pointer hover:text-[#81A6C6] transition" />
                    </div>

                    <p className="mt-10 text-sm text-gray-500">
                        © 2026 Employee Finder AI.
                        All rights reserved.
                    </p>
                </div>
            </div>
        </section>
    );
}