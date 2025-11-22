export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

const PROMPT = `from this flow, Generate an agent instruction prompt with all details along with
tools with all setting info in JSON format. Do not add any extra text, just return JSON data.
Make sure to mention parameters depending on GET or POST request.

Return JSON in this exact shape only:

{
  "systemPrompt": "",
  "primaryAgentName": "",
  "agents": [
    {
      "id": "agent-id",
      "name": "",
      "model": "",
      "includeHistory": true,
      "output": "",
      "tools": ["tool-id"],
      "instruction": ""
    }
  ],
  "tools": [
    {
      "id": "id",
      "name": "",
      "description": "",
      "method": "GET",
      "url": "",
      "includeApiKey": true,
      "apiKey": "",
      "parameters": { "key": "dataType" },
      "usage": [],
      "assignedAgent": ""
    }
  ]
}`;

export async function POST(req: NextRequest) {
  try {
    const { jsonConfig } = await req.json();

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt: `${PROMPT}\nFLOW CONFIG:\n${JSON.stringify(jsonConfig, null, 2)}`,
        stream: false
      }),
    });

    const data = await response.json();
    const rawText = data?.response ?? "";

    // ✅ Extract only the JSON portion
    const start = rawText.indexOf("{");
    const end = rawText.lastIndexOf("}") + 1;
    const jsonText = rawText.substring(start, end);

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      console.error("❌ Still invalid JSON after extraction:", jsonText);
      return NextResponse.json(
        { error: "Ollama returned invalid JSON", raw: jsonText },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("🔥 API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
