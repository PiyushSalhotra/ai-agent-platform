import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import {Agent, tool,run} from '@openai/agents'
import { openai } from "@/config/OpenAiModel";


//post api call for agent chat
export async  function POST(req:NextRequest){
    const {input,tools,agents,conversationId, agentName} = await req.json();
    //Map All tools
    const generatedTools = tools.map((t: any) => {
  // Dynamically build zod object for parameters
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
      // Replace placeholders in URL
      let url = t.url;
      for (const key in params) {
        const value = params[key] !== undefined && params[key] !== null ? params[key] : "";
        url = url.replace(`{{${key}}}`, encodeURIComponent(value));
      }

      // Resolve relative or localhost URLs in production environments
      let baseUrl = process.env.APP_URL;
      if (!baseUrl) {
        const host = req.headers.get("host") || "localhost:3000";
        const protocol = host.includes("localhost") ? "http" : "https";
        baseUrl = `${protocol}://${host}`;
      }

      if (url.startsWith("/")) {
        url = `${baseUrl}${url}`;
      } else if (url.includes("localhost:3000")) {
        url = url.replace("http://localhost:3000", baseUrl);
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

      // Make API request
      const response = await fetch(url, fetchOptions);
      const data = await response.json();
      console.log(data);
      // Return raw data (or transform if needed)
      return data;
    },
  });
});

const createdAgents = agents.map((config:any)=>{
    return new Agent({
        name: config?.name,
        instructions: config?.instructions,
        tools:generatedTools
    })
})

const finalAgent = Agent.create({
    name: agentName,
    instructions: `You determine which agent to use based on the user query.`,
    handoffs: createdAgents
})

const result = await run(finalAgent,input,{
    conversationId: conversationId,
    stream:true
});

const stream = result.toTextStream();
return new Response(stream as any);
}


//we need to generate conversation id, we just write get request for that one
export async function GET(req:NextRequest){
    const {id: conversationId} = await openai.conversations.create({});
        return NextResponse.json(conversationId);
}