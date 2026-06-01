import { NextRequest, NextResponse } from "next/server";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { openai } from "@/config/OpenAiModel";
import z from "zod";
import { Agent, run, tool } from "@openai/agents";

export async function POST(
  req: NextRequest,
  { params }: { params: { agentId: string } }
) {
  const { agentId } = params;
  const isCron = req.nextUrl.searchParams.get("source") === "cron";
  let userInput = "Trigger agent execution";

  try {
    // 1. Fetch agent detail from Convex
    const agentDetail = await fetchQuery(api.agent.GetAgentById, {
      agentId: agentId,
    });

    if (!agentDetail) {
      return NextResponse.json(
        { error: `Agent with ID ${agentId} not found` },
        { status: 404 }
      );
    }

    // Robustly handle agentToolConfig or agentToolConfig.parsedJson cases
    const config = agentDetail.agentToolConfig?.parsedJson || agentDetail.agentToolConfig;
    if (!config) {
      return NextResponse.json(
        {
          error:
            "Agent configuration is not generated yet. Please reboot/publish the agent in the builder interface first.",
        },
        { status: 400 }
      );
    }

    // 2. Parse request query and body to determine trigger source and input
    if (isCron) {
      // For cron triggers, extract prompt from CronNode settings
      const nodes = agentDetail.nodes || [];
      const cronNode = nodes.find((n: any) => n.type === "CronNode");
      userInput =
        cronNode?.data?.settings?.triggerPrompt || "Trigger scheduled execution";
      console.log(
        `[Webhook Trigger API] Scheduled cron run for agent ${agentId} with prompt: "${userInput}"`
      );
    } else {
      // For webhook triggers, read body or default
      const body = await req.json().catch(() => ({}));
      userInput =
        body.message ||
        body.input ||
        body.prompt ||
        "Trigger agent execution workflow";
      console.log(
        `[Webhook Trigger API] External webhook run for agent ${agentId} with input: "${userInput}"`
      );
    }

    // 3. Start a new OpenAI conversation session
    const { id: conversationId } = await openai.conversations.create({});

    // 4. Map tool schemas
    const toolsList = config.tools || [];
    const generatedTools = toolsList.map((t: any) => {
      const paramSchema = z.object(
        Object.fromEntries(
          Object.entries(t.parameters).map(([key, type]) => {
            if (type === "string") return [key, z.string()];
            if (type === "number") return [key, z.number()];
            return [key, z.any()];
          })
        )
      );

      return tool({
        name: t.name,
        description: t.description,
        parameters: paramSchema,
        async execute(params: Record<string, any>) {
          let url = t.url;
          for (const key in params) {
            const value = params[key] !== undefined && params[key] !== null ? params[key] : "";
            url = url.replace(`{{${key}}}`, encodeURIComponent(value));
          }

          // Resolve relative or localhost URLs in production environments
          if (url.startsWith("/")) {
            const baseUrl = process.env.APP_URL || "http://localhost:3000";
            url = `${baseUrl}${url}`;
          } else if (url.includes("localhost:3000") && process.env.APP_URL) {
            url = url.replace("http://localhost:3000", process.env.APP_URL);
          }
 
          if (t.includeApiKey && t.apiKey) {
            url += url.includes("?") ? `&key=${t.apiKey}` : `?key=${t.apiKey}`;
          }

          const fetchOptions: RequestInit = {
            method: t.method || "GET",
          };

          if (fetchOptions.method === "POST") {
            fetchOptions.headers = {
              "Content-Type": "application/json",
            };
            fetchOptions.body = JSON.stringify(params);
          }
 
          const response = await fetch(url, fetchOptions);
          const data = await response.json();
          console.log(`[Tool Execution] URL: ${url}, Response:`, data);
          return data;
        },
      });
    });

    // 5. Map sub-agents
    const agentsList = config.agents || [];
    const createdAgents = agentsList.map((subAgentConfig: any) => {
      return new Agent({
        name: subAgentConfig?.name,
        instructions: subAgentConfig?.instructions,
        tools: generatedTools,
      });
    });

    // 6. Create the parent router agent
    const finalAgent = Agent.create({
      name: agentDetail.name,
      instructions: `You determine which agent to use based on the user query.`,
      handoffs: createdAgents,
    });

    // 7. Run the agent using @openai/agents
    const result = await run(finalAgent, userInput, {
      conversationId: conversationId,
      stream: true,
    });

    // 8. Compile the streamed text response
    const stream = result.toTextStream();

    let compiledResponse = "";
    for await (const chunk of stream) {
      compiledResponse += chunk;
    }

    console.log(
      `[Webhook Trigger API] Execution completed successfully for agent ${agentId}`
    );

    // Log the successful trigger run
    await fetchMutation(api.agent.LogTriggerRun, {
      agentId: agentId,
      source: isCron ? "cron" : "webhook",
      inputPrompt: userInput,
      response: compiledResponse,
      status: "success",
    }).catch((err) => console.error("Failed to log trigger run:", err));

    return NextResponse.json({
      success: true,
      agentId: agentId,
      response: compiledResponse,
      conversationId: conversationId,
    });
  } catch (error: any) {
    console.error(`[Webhook Trigger API] Error executing agent:`, error);

    // Log the failed trigger run
    await fetchMutation(api.agent.LogTriggerRun, {
      agentId: agentId,
      source: isCron ? "cron" : "webhook",
      inputPrompt: userInput,
      response: error.message || String(error),
      status: "failed",
    }).catch((err) => console.error("Failed to log failed trigger run:", err));

    return NextResponse.json(
      { error: "Internal server error occurred", details: error.message || error },
      { status: 500 }
    );
  }
}
