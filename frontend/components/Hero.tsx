export default function Hero() {
    return (
        <section
            id="home"
            className="min-h-screen flex items-center overflow-hidden">
            <div className="grid lg:grid-cols-2 w-full">

                {/* LEFT */}
                <div className="flex flex-col justify-center px-8 md:px-20 py-20">

                    <h1 className="text-5xl md:text-7xl leading-[1.1] font-serif text-[#726B66]">
                        WELCOME
                        <br />
                        EMPLOYEE
                        <br />
                        FINDER
                    </h1>

                    <h2 className="mt-8 text-3xl md:text-4xl font-serif text-black">
                        Smart Hiring Starts Here!
                    </h2>

                    <p className="mt-8 text-lg leading-9 text-gray-700 max-w-xl">
                        Employee Finder helps HR professionals analyze,
                        match, and rank candidate resumes instantly using
                        AI-powered insights tailored to your job requirements.
                    </p>

                    <div className="mt-12 flex gap-4 items-center">
                        <a
                            href="/upload"
                            className="w-fit px-10 py-4 rounded-full bg-white shadow-xl hover:scale-105 transition duration-300 inline-block font-semibold"
                        >
                            Mulai
                        </a>
                        <a
                            href="/interview"
                            className="w-fit px-10 py-4 rounded-full bg-[#81A6C6] text-white shadow-xl hover:scale-105 transition duration-300 inline-block font-semibold"
                        >
                            Interview
                        </a>
                    </div>
                </div>

                {/* RIGHT */}
                <div className="relative h-screen">
                    <img
                        src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
                        alt="team"
                        className="w-full h-full object-cover opacity-60"
                    />

                    <div className="absolute inset-0 bg-[#D2C4B4]/20" />
                </div>
            </div>
        </section>
    );
}