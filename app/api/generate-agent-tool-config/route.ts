import { openai } from "@/config/OpenAiModel";
import { NextRequest, NextResponse } from "next/server";

const PROMPT = `from this flow, Generate a agent instruction prompt with all details along with tools with all setting info in JSON format,
Do not add any extra text just written JSON data. make sure to mention parameters depend on Get or Post request
only:{ systemPrompt:'' ,primaryAgentName:'', "agents":[{"id": "agent-id", "name": "", "model": "", "includeHistory": true|false,
"output": "", "tools": ["toold-d"], "instruction": ""},],
"tools": [{"id": "id", "name": "", "description": "", "method": "GET/POST",
"url": "", "includeApiKey": true, "apiKey": "", "parameters": {"key": "datatype"}, "usage": [ ], "assignedAgent":""}]}`
export async function POST(req:NextRequest)
{
    const {jsonConfig} = await req.json();
    const response = await openai.responses.create({
        model: 'gpt-4.1-mini',
        input: JSON.stringify(jsonConfig) + PROMPT,
    })

    const outputText = response.output_text;
    //parse the response to JSON
    let parsedJson;
    try{
        parsedJson = JSON.parse(outputText.replace('```json','').replace('```',''));
    }catch(err){
        return NextResponse.json({error:'Failed to parse JSON from AI response', details: err}, {status:500});
    }
    return NextResponse.json({parsedJson});
}