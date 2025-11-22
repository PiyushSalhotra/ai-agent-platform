export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt: "Reply with just: OK",
        stream: false
      }),
    });

    const data = await response.json();

    const reply = data?.response ?? null;

    return NextResponse.json({ reply, raw: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
