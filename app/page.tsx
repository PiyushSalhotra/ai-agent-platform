"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main className="relative min-h-screen text-white bg-black overflow-hidden">

      {/* Background glow orbs */}
      <div className="absolute -top-40 -left-40 h-[500px] w-[500px] bg-purple-600/30 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] bg-blue-600/30 rounded-full blur-[120px] animate-pulse" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-10 py-4">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" alt="logo" width={35} height={35} />
          <span className="text-xl font-semibold tracking-wide">PiAgent</span>
        </div>

        {/* Get Started */}
        <Button
          onClick={() => router.push("/dashboard")}
          className="
            px-6 py-3
            text-lg font-semibold tracking-wide
            bg-white text-black
            hover:bg-gray-200
            hover:scale-105
            transition-all duration-300
          "
        >
          Get Started
        </Button>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 min-h-[calc(100vh-80px)]">

        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight animate-fade-up">
          Empower{" "}
          <span className="relative inline-block">
            <span className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-purple-600 blur-md opacity-60"></span>
            <span className="relative text-white">Ideas</span>
          </span>{" "}
          with Intelligent Agents.
          <br />
          No Code, Just Pure AI.
        </h1>

        <p className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl animate-fade-up delay-150">
          Design agents that understand, think, and take action for you.
          From chatbots to task automators — build smarter, faster, easier.
        </p>

        {/* Explore Now */}
        <div className="mt-12 animate-fade-up delay-300">
          <Button
            onClick={() => router.push("/dashboard")}
            className="
              px-12 py-7
              text-xl font-bold tracking-wide
              bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500
              hover:scale-110
              hover:shadow-[0_0_60px_rgba(139,92,246,0.8)]
              transition-all duration-300
            "
          >
            Explore Now
          </Button>
        </div>
      </section>
    </main>
  );
}
