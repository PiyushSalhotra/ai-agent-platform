import { NextRequest } from "next/server";
import {fetchQuery} from "convex/nextjs"
import { api } from "@/convex/_generated/api";
import { openai } from "@/config/OpenAiModel";
import z from "zod";
import { Agent, run, tool } from "@openai/agents";

//testing whether our AI agent chat pipeline works end-to-end with real-time streaming.
//This function runs whenever the frontend sends a POST request to this route.
export async function POST(req:NextRequest){
    const {userId,agentId, userInput} = await req.json();

    const agentDetail= await fetchQuery(api.agent.GetAgentById,{
        agentId:agentId
    })
    //check if conversation id exist?
    //inside conversation table we need to check if user id is there or not
    let conversationId_=null
    const conversationDetail= await fetchQuery(api.conversation.GetConversationById,{
        agentId:agentDetail?._id,
        userId:userId
    })

    conversationId_ = conversationDetail?.conversationId;
    if(!conversationDetail.conversationId){
        const {id: conversationId} = await openai.conversations.create({});
        conversationId_ = conversationId;
    }

    //Map All tools
    //Convert tool definitions into real tools
    //Each tool stored in the database is converted into an executable AI tool.
        const generatedTools = agentDetail?.agentToolConfig?.tools?.map((t: any) => {
      // Dynamically build zod object for parameters
      //Dynamically creates validation rules
      //Ensures tools receive correct inputs
     //Prevents invalid API calls
      const paramSchema = z.object(
        Object.fromEntries(
          Object.entries(t.parameters).map(([key, type]) => {
            if (type === "string") return [key, z.string()];
            if (type === "number") return [key, z.number()];
            return [key, z.any()];
          })
        )
      );
    
      //This registers the tool with OpenAI.
      return tool({
        name: t.name,
        description: t.description,
        parameters: paramSchema,
        async execute(params: Record<string, any>) {
          // Replace placeholders in URL
          let url = t.url;
          for (const key in params) {
            url = url.replace(`{{${key}}}`, encodeURIComponent(params[key]));
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
    
//     Each agent:
// Has its own instructions
// Uses the same tools
// Handles specific tasks
    const createdAgents = agentDetail?.agentToolConfig?.agents.map((config:any)=>{
        return new Agent({
            name: config?.name,
            instructions: config?.instructions,
            tools:generatedTools
        })
    })
    
//     This agent:
// Does not answer directly
// Decides which sub-agent should handle the request
// Enables multi-agent routing
    const finalAgent = Agent.create({
        name: agentDetail?.name,
        instructions: `You determine which agent to use based on the user query.`,
        handoffs: createdAgents
    })
    
    //Run the agent with streaming
// Sends the user’s message to the agent
// Keeps conversation context
// Enables real-time streaming
    const result = await run(finalAgent,userInput,{
        conversationId: conversationId_,
        stream:true
    });
    
    //This converts the AI output into a stream suitable for the browser.
    const stream = result.toTextStream();
    return new Response(stream as any);
}