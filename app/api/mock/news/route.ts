import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  console.log("[Mock News API] News feed requested.");
  return NextResponse.json({
    news: [
      {
        id: 1,
        title: "Google DeepMind unveils Gemini 2 Ultra with 10M token context window",
        category: "Artificial Intelligence",
        source: "TechCrunch",
        summary: "Gemini 2 Ultra sets a new benchmark for long-context reasoning, enabling developers to analyze entire codebases and books in seconds."
      },
      {
        id: 2,
        title: "Rust adoption surges across big tech companies for kernel development",
        category: "Software Engineering",
        source: "Dev.to",
        summary: "Major cloud providers report a 40% reduction in memory-safety vulnerabilities after transitioning core microservices to Rust."
      },
      {
        id: 3,
        title: "Visual AI agent builders become the leading trend in developer tooling",
        category: "AI Tools",
        source: "Hacker News",
        summary: "No-code and low-code visual agent platforms like AI-Agent-Platform enable teams to deploy production-ready AI agents in minutes."
      }
    ]
  });
}
