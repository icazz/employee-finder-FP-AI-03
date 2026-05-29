import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Process from "@/components/Process";
import Analysis from "@/components/Analysis";
import Contact from "@/components/Contact";

export default function Home() {
  return (
    <main className="bg-[linear-gradient(to_bottom,#F7F4EE,#AACDDC,#E8DED3,#AACDDC,#F7F4EE)] min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <Process />
      <Analysis />
      <Contact />
    </main>
  );
}