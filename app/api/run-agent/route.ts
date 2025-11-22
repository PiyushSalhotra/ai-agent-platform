export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

type RawTool = {
  id: string;
  name: string;
  description: string;
  method: string;
  url: string;
  includeApiKey: boolean;
  apiKey?: string;
  parameters: Record<string, string>; // { key: "string" | "number" | ... }
  usage: any[];
  assignedAgent: string;
};

type AgentConfig = {
  id: string;
  name: string;
  model: string;            // we’ll use this, but default to "llama3"
  includeHistory: boolean;
  output: string;
  tools: string[];          // tool IDs
  instruction: string;
};

type ExecutionStep =
  | {
      type: "llm";
      content: string;
      role: "assistant" | "system" | "user";
    }
  | {
      type: "tool";
      toolId: string;
      toolName: string;
      params: any;
      result: any;
    }
  | {
      type: "error";
      message: string;
      detail?: any;
    };

// ------------ Tool registry builder (no OpenAI dependency) ------------

function buildTools(rawTools: RawTool[]) {
  return rawTools.map((t) => {
    const paramSchema = z.object(
      Object.fromEntries(
        Object.entries(t.parameters || {}).map(([key, type]) => {
          if (type === "string") return [key, z.string()];
          if (type === "number") return [key, z.number()];
          if (type === "boolean") return [key, z.boolean()];
          return [key, z.any()];
        })
      )
    );

    return {
      id: t.id,
      name: t.name,
      description: t.description,
      parametersSchema: paramSchema,
      async execute(params: Record<string, any>) {
        // Validate params
        const safeParams = paramSchema.parse(params);

        // Replace dynamic params in URL like {{userId}}
        let url = t.url;
        for (const key in safeParams) {
          url = url.replace(`{{${key}}}`, encodeURIComponent(String(safeParams[key])));
        }

        // Append apiKey if required
        if (t.includeApiKey && t.apiKey) {
          url += url.includes("?") ? `&key=${t.apiKey}` : `?key=${t.apiKey}`;
        }

        const res = await fetch(url, { method: t.method || "GET" });
        const data = await res.json();
        return data;
      },
    };
  });
}

// ------------ Tool call detection & parsing ------------

// We enforce this pattern in LLM output:
// CALL_TOOL(toolId, { "param": "value" })
function detectToolCall(output: string):
  | { toolId: string; args: any }
  | null {
  const match = output.match(/CALL_TOOL\s*\(\s*([a-zA-Z0-9\-_]+)\s*,\s*(\{[\s\S]*\})\s*\)/);

  if (!match) return null;

  const toolId = match[1].trim();
  const argsRaw = match[2];

  try {
    const args = JSON.parse(argsRaw);
    return { toolId, args };
  } catch {
    return null;
  }
}

// ------------ Ollama LLM call ------------

async function callOllamaLLM(opts: {
  model: string;
  systemPrompt: string;
  agentInstruction: string;
  userInput: string;
  history: { role: "user" | "assistant"; content: string }[];
}) {
  const { model, systemPrompt, agentInstruction, userInput, history } = opts;

  const conversationText = history
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  const fullPrompt = `
SYSTEM:
${systemPrompt}

AGENT INSTRUCTION:
${agentInstruction}

CONVERSATION SO FAR:
${conversationText}

USER:
${userInput}

RULES FOR TOOL USE:
- If you need external data, respond ONLY with:
  CALL_TOOL(toolId, { "param": "value" })
- toolId must exactly match one of the provided tool IDs.
- The argument object MUST be valid JSON.
- If you can answer without tools, just answer normally (no CALL_TOOL).
`.trim();

  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: model || "llama3",
      prompt: fullPrompt,
      stream: false,
    }),
  });

  const data = await response.json();
  const text: string = data?.response ?? "";
  return text.trim();
}

// ------------ MAIN ROUTE: /api/run-agent ------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const input: string = body.input;           // user message
    const agents: AgentConfig[] = body.agents;  // from agentToolConfig.agents
    const tools: RawTool[] = body.tools;        // from agentToolConfig.tools
    const conversationId: string | null = body.conversationId ?? null;
    const systemPrompt: string = body.systemPrompt ?? "";

    if (!input || !agents?.length) {
      return NextResponse.json(
        { error: "input and at least one agent are required" },
        { status: 400 }
      );
    }

    // For now, we use the primary/first agent
    const agent = agents[0];
    const modelName = agent.model || "llama3";

    const allTools = buildTools(tools);
    // Filter to only tools assigned to this agent
    const agentTools = allTools.filter((t) => agent.tools.includes(t.id));

    // Execution trace for Q3: C
    const trace: ExecutionStep[] = [];

    // In-memory history (Q2: A → only for this run)
    const history: { role: "user" | "assistant"; content: string }[] = [];

    let currentUserMessage = input;
    let finalAnswer: string | null = null;

    // Safety: max 5 tool-call turns
    for (let step = 0; step < 5; step++) {
      const llmOutput = await callOllamaLLM({
        model: modelName,
        systemPrompt,
        agentInstruction: agent.instruction,
        userInput: currentUserMessage,
        history,
      });

      trace.push({
        type: "llm",
        role: "assistant",
        content: llmOutput,
      });

      history.push({ role: "user", content: currentUserMessage });
      history.push({ role: "assistant", content: llmOutput });

      // Detect tool call
      const toolCall = detectToolCall(llmOutput);

      if (!toolCall) {
        // No tool call → treat as final answer
        finalAnswer = llmOutput;
        break;
      }

      const { toolId, args } = toolCall;
      const tool = agentTools.find((t) => t.id === toolId);

      if (!tool) {
        trace.push({
          type: "error",
          message: `Tool with id "${toolId}" not found for this agent`,
        });
        finalAnswer = `Error: Tool "${toolId}" not found.`;
        break;
      }

      // Execute tool
      try {
        const result = await tool.execute(args);

        trace.push({
          type: "tool",
          toolId: tool.id,
          toolName: tool.name,
          params: args,
          result,
        });

        // Feed result back as new "user" message so LLM can continue
        currentUserMessage = `The tool "${tool.name}" returned this result: ${JSON.stringify(
          result
        )}. Now continue and answer the user.`;
      } catch (err: any) {
        trace.push({
          type: "error",
          message: `Tool "${tool.name}" execution failed`,
          detail: err?.message ?? err,
        });
        finalAnswer = `Error while executing tool "${tool.name}".`;
        break;
      }
    }

    if (!finalAnswer) {
      finalAnswer = "No final answer produced after tool calls.";
    }

    return NextResponse.json({
      conversationId: conversationId ?? null,
      finalAnswer,
      trace,
    });
  } catch (error: any) {
    console.error("🔥 run-agent API error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong in agent execution" },
      { status: 500 }
    );
  }
}

