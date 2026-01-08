1.schema.ts
v provides a set of validators that describe what type of data each field should store.
create tables

2.layout.tsx
Next.js Root Layout (app/layout.tsx), which wraps your entire application.
Everything inside it loads once and applies to all pages in your app.
<ConvexClientProvider>
Enables Convex queries/mutations anywhere in your app.
<Provider>
  {children}
  <Toaster/>
</Provider>
Wraps all pages with:
global state
theme
context
toast notifications (Toaster)

3.provider.tsx
This file is your global provider wrapper, which:
Gets logged-in user from Clerk
Creates that user in Convex (if not already created)
Stores user details in React Context
Stores workflow nodes & edges in another Context
Makes all this available to your entire app

UserDetailContext → stores Convex user document
WorkflowContext → stores nodes & edges for your AI-agent builder
useMutation(api.user.CreateNewUser)->Calls your Convex backend to create users in DB

4.page.tsx
a page.tsx file is simply a React Server Component that represents a route/page in your application.

5.ConvexClientProvider.tsx
This file connects your Next.js frontend to the Convex backend.
Convex needs a client instance in React so that you can use:
useQuery() → real-time database reads
useMutation() → write/modify data
useAction() → server functions
any API from convex/_generated/api
NEXT_PUBLIC_CONVEX_URL is an environment variable that tells your frontend (Next.js app)
👉 which Convex backend it should connect to.

6.middleware.ts
Allows some routes to be public
Protects all other routes (requires user login)
Ensures all API routes always require authentication
Avoids running on static files & Next.js internal files
createRouteMatcher → helps define which routes are public

7.user.ts
This file defines a Convex mutation that:
Creates a new user in the Convex database
Checks if the user already exists
If yes → returns the existing user
If no → inserts the user into UserTable and returns it

8.UserDetailContext.tsx
A React context allows you to share data globally across your entire app without passing props manually from component to component.
Creates a new context object
Initializes it with a default value of null
Exports it for use throughout the app

9.AppHeader.tsx
10.AppSidebar.tsx
AppSidebar is the left navigation sidebar of your dashboard.
It is responsible for:
Showing navigation links (Dashboard, AI Agents, Pricing, Profile)
Showing remaining credits for free users
Detecting paid vs free plan using Clerk
Fetching user’s agents from Convex to calculate credits

11.Arcjet.ts
This file sets up Arcjet rate limiting for our Next.js backend.

12.route.ts
Protects a GET API route using Arcjet
Deducts 5 tokens from the user’s rate limit bucket
Denies the request if they exceeded their monthly quota
Returns a response depending on the Arcjet decision

13.AiAgentTab.tsx

14.MyAgents.tsx
Fetches all agents created by the current user
(using Convex query api.agent.GetUserAgents)
Uses UserDetailContext to get _id of logged-in user from Convex.
Stores agent list in state to re-render UI.
Displays each agent as a card with name, icon, and "created x time ago".
Allows clicking an agent to open /agent-builder/[agentId] route.

15.CreateAgentSection.tsx
Opens a dialog to enter an AI agent name
Generates a unique agentId using UUID
Creates a new agent in Convex via mutation
Redirects user to /agent-builder/[agentId]
Shows loading spinner while creating

16.Header.tsx

17.AgentToolsPanel.tsx
This panel shows a list of AI workflow tools (Agent, API, If/Else, End, While, etc.).
When you click on a tool:
It creates a new “node”
Adds it to the workflow (using WorkflowContext)
The node appears in your workflow canvas (React Flow)
This is basically your sidebar toolbox for the AI Agent Builder.

when user clicks a tool:
Create a unique node ID
Using tool.id + timestamp
Ensures multiple nodes don’t collide
Set default position
Starts at (x=0, y=100) until user moves it
Node data
Contains:
label (name displayed in node)
bgColor (node color)
id & type
Add node to global workflow state

18.page.tsx[agentId]
This page is your AI Agent Builder canvas, where users can:
View an existing agent workflow
Drag & drop nodes (Agent, API, If/Else, While, End…)
Connect nodes with edges
Load previously saved workflow from database
Save updated workflow back to Convex
See tools panel to add new nodes

Why you fixed it:
Earlier your DB had:
"start"
"StartNode"
So ReactFlow didn’t know how to render "start" ❌
Now:
Both map to StartNode ✅
Backward compatibility restored
🔥 This fix prevents the “start node disappearing” bug.

19.custom nodes

20.Settingpanel.tsx
SettingPanel is a React component that displays the correct settings form based on whichever workflow node is currently selected.
Different node types (Agent, If/Else, While, API, End, User Approval) have different settings components.

21.node_settings
Click "Agent" in AgentToolsPanel
        ↓
New Agent node is added to ReactFlow
        ↓
User clicks the Agent node on canvas
        ↓
ReactFlow marks it as selected
        ↓
useOnSelectionChange fires
        ↓
selectedNode is set in WorkflowContext
        ↓
SettingPanel re-renders
        ↓
AgentSettings component opens


22.preview->page.tsx
This page:
Fetches an agent (nodes + edges) from Convex DB
Converts the visual flow (ReactFlow graph) into a runtime workflow config
Generates an executable agent-tool configuration
Stores that config back to DB
Shows either
a “Reboot Agent” button, or
a Chat UI to talk to the agent
So this page is the bridge between visual workflow → runnable AI agent.

Case 1: “Reboot Agent” button is shown
The agent does NOT yet have an executable tool configuration

This happens when:
Agent is newly created
Workflow was edited
Tool config was never generated
Tool config was cleared / invalid

Case 2: Chat UI is shown
The agent already has a valid tool config
This happens when:
GenerateAgentToolConfig() has run successfully
Tool config is stored in DB
Agent is ready to execute

use of axios
Call Next.js API routes
Trigger server-side logic
Generate runtime AI configs
Create conversation sessions

23.OpenAiModel.ts
This file initializes a single reusable OpenAI client using a secure environment variable. It centralizes OpenAI configuration so that all server-side AI operations—like agent execution and tool generation—can safely and consistently use the same client without exposing API keys to the frontend.

24.api->generate-agent-tool-config->route.ts
This API endpoint:

Receives a jsonConfig (the workflow config you generated earlier)
Sends it to openai along with a predefined prompt
openai returns a JSON-based agent + tools configuration
The API returns that response back to the client

STEP 1 — The frontend sends data to this API
STEP 2 — The API sends that data to openai
STEP 3 — openai Generates a JSON Output
STEP 4 — The API sends this result back to the frontend

This API endpoint takes the workflow jsonConfig sent from the frontend, combines it with a predefined prompt, and sends both to the openai model, instructing it to analyze the flow and convert it into a structured JSON containing system prompts, agents, tools, methods, parameters, and other settings; openai then generates this JSON-based agent-and-tool configuration and returns it to the API, which finally sends that generated JSON back to the frontend for display, saving, or further execution.

🔹 Purpose of the prompt
from this flow, Generate a agent instruction prompt with all details along with tools


👉 Tells the model:

Input = workflow flow

Output = agent instructions + tools

🔹 Strict output rule
Do not add any extra text just written JSON data.


This is CRITICAL because:

You are doing JSON.parse()

Any extra text would crash parsing

🔹 Required output structure
{
  systemPrompt: "",
  primaryAgentName: "",
  agents: [ ... ],
  tools: [ ... ]
}


This defines a contract between:

AI output

Your execution engine

🔹 Agents schema
"agents": [{
  "id": "agent-id",
  "name": "",
  "model": "",
  "includeHistory": true,
  "output": "",
  "tools": ["tool-id"],
  "instruction": ""
}]


Meaning:

Each agent:

has its own model

memory setting

instructions

allowed tools

This allows:

multi-agent systems

specialized agents

tool-restricted agents

🔹 Tools schema
"tools": [{
  "id": "",
  "name": "",
  "description": "",
  "method": "GET/POST",
  "url": "",
  "includeApiKey": true,
  "apiKey": "",
  "parameters": {
    "key": "datatype"
  },
  "usage": [],
  "assignedAgent": ""
}]


This enables:

API calling agents

Secure API key injection

GET vs POST differentiation

Dynamic parameter validation

🔹 Important instruction
make sure to mention parameters depend on Get or Post request


This forces the LLM to:

put params in:

query (GET)

body (POST)

prevents incorrect API usage

Ollama is a local AI model runner.

It allows you to:
✅ download AI models (like Llama3, Mistral, Phi3, DeepSeek, etc.)
✅ run them locally on your own computer
✅ without internet
✅ without cloud accounts
✅ without API keys
✅ without usage fees

🏠 Why does Ollama not need API keys?

Because:

✅ Ollama runs on your own device

It starts a local server at:

http://localhost:11434

✅ You are not calling a remote company server

So no authentication is required.

✅ You are the provider

Your computer = the AI cloud


Zod is a TypeScript-first validation and schema definition library.
It allows you to define data structures, types, and runtime validators

✅ What the OpenAI API key actually does
✅ 1. It allows the LLM to run

The agent’s brain is the model (GPT-4o, GPT-4.1-mini, etc.)

Without the API key:

❌ No natural language understanding
❌ No reasoning
❌ No instruction execution
❌ No context handling

🧠 1. AI Model

An AI model (like GPT-4o, Llama3, Gemini, DeepSeek) is:

✅ A text prediction engine
✅ Takes input → produces output
✅ Has NO memory (unless you give it)
✅ Has NO goals
✅ Cannot act on its own
✅ Cannot call APIs or tools unless instructed externally

🤖 2. AI Agent

An Agent is built on top of a model, and adds:

✅ Goals and instructions
✅ Ability to use tools / APIs
✅ Decision making
✅ Multi-step reasoning
✅ Memory or context history
✅ Workflow execution
✅ Conditional logic (If/Else)
✅ Ability to call other agents

✅ Example using your system
🔹 Model Only:

User: "Book me a flight to Mumbai"
Output: "I cannot book flights."

🔹 Agent in Your Platform:

✅ Understand intent
✅ Ask missing info
✅ Call API tool
✅ Compare prices
✅ Show best option
✅ Request user approval

AI Model = Brain
Agent = Brain + Body + Tools + Goals
✅ Want even more advanced types?

There are 3 levels:

Level 1 — LLM

Just text generation.

Level 2 — Agent

LLM + memory + tools + reasoning

Level 3 — Multi-Agent System

Agents talk to each other and divide tasks
(Your platform supports this!)

agent-chat/route.ts
This file defines a Next.js API route that powers live agent chat and tool execution. In the POST request, it receives the user’s input, agent definitions, tool definitions, conversation ID, and the primary agent name from the frontend. It first dynamically converts each tool definition into a real executable tool using @openai/agents: Zod is used to build a runtime-validated parameter schema based on the tool’s declared parameters, and each tool’s execute function constructs the API URL by replacing placeholders with actual values, optionally appending an API key, calling the external API via fetch, and returning the JSON response. Next, it creates multiple specialized Agent instances using the provided agent configs and attaches the generated tools to them. A final routing agent is then created whose job is to decide which sub-agent should handle the user’s query, using OpenAI’s agent handoff mechanism. The run() function executes this final agent with the user input while maintaining conversation continuity using conversationId and enabling streaming. The streamed AI response is converted into a Node-compatible text stream and returned directly to the client, allowing real-time chat updates.

1.Receive user input
The API gets the user’s message, agent ID, and user ID from the request.

2.Load agent and conversation data
It fetches the agent configuration from the database.
If a conversation already exists, it continues that conversation.
If not, it creates a new OpenAI conversation so the chat can remember past messages.

3.Convert tool definitions into real tools
Each tool stored in the database is converted into an executable AI tool.
Zod is used to validate tool inputs at runtime.
When a tool is called:
URL placeholders are replaced with real values
API keys are added if required
The external API is called using fetch
The API response is returned to the AI

4.Create multiple specialized agents
Different agents are created for different tasks.
All agents can access the generated tools.

5.Run the agent with streaming
The agent processes the user’s message.
The response is generated in real time using streaming.
Conversation context is maintained using the conversation ID.

6.Send live response to the frontend
The streamed AI output is returned directly to the client.
This allows the user to see the response appear live, like ChatGPT.

chatui.tsx
This ChatUi component handles real-time interaction with an AI agent by maintaining user input, message history, and loading states. When a user sends a message, it immediately updates the UI, calls a backend agent API with the agent configuration, tools, and conversation ID, and then streams the AI’s response chunk by chunk into the chat interface. The UI differentiates between user and assistant messages, shows a live “thinking” indicator during execution, and provides a reboot option to regenerate agent tools when the workflow changes.

agent-sdk/route.ts
This file creates a Next.js API route that:
Receives a user’s chat message
Loads an AI agent and its tools from the database
Maintains conversation memory
Lets the AI call external APIs as tools
Streams the AI response back to the user in real time

PublishCodeDialog.tsx
PublishCodeDialog is a reusable dialog component that shows copy-able sample code explaining how to call the AI agent chat API and read streamed responses on the client side.

Opens a modal dialog

Displays example API usage code

Supports:

Syntax highlighting

File name display

Language selection

One-click copy

This is useful when users want to integrate your agent API into their own apps