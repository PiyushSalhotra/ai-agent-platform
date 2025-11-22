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

19.custom nodes

20.Settingpanel.tsx
SettingPanel is a React component that displays the correct settings form based on whichever workflow node is currently selected.
Different node types (Agent, If/Else, While, API, End, User Approval) have different settings components.

21.node_settings

22.preview->page.tsx
Fetches an agent by ID from Convex
Loads its nodes & edges
Generates a workflow config (mapping execution order)
Displays the workflow visually using ReactFlow
repares the config to send to backend for tool generation

23.gemini.ts
This file initializes and exports a Google Generative AI client (Gemini) using an API key stored in environment variables.

24.api->generate-agent-tool-config->route.ts
This API endpoint:

Receives a jsonConfig (the workflow config you generated earlier)
Sends it to Gemini along with a predefined prompt
Gemini returns a JSON-based agent + tools configuration
The API returns that response back to the client

STEP 1 — The frontend sends data to this API
STEP 2 — The API sends that data to Gemini
STEP 3 — Gemini Generates a JSON Output
STEP 4 — The API sends this result back to the frontend

This API endpoint takes the workflow jsonConfig sent from the frontend, combines it with a predefined prompt, and sends both to the Gemini model, instructing it to analyze the flow and convert it into a structured JSON containing system prompts, agents, tools, methods, parameters, and other settings; Gemini then generates this JSON-based agent-and-tool configuration and returns it to the API, which finally sends that generated JSON back to the frontend for display, saving, or further execution.

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

✅ No billing

There is nobody to charge you.

✅ No rate limits

Only your hardware limits performance.

⚙ How Ollama responds to your requests

When you run:

fetch("http://localhost:11434/api/generate", ...)


Here’s what happens:

✅ Step 1 — Your request hits the local Ollama server

(no internet involved)

✅ Step 2 — Ollama loads the model (llama3) from disk

(stored after ollama pull llama3)

✅ Step 3 — Model generates text on CPU/GPU

(computation happens on your hardware)

✅ Step 4 — Ollama returns JSON response

(your API parses it)

📡 So does it need internet?
✅ To download models initially → YES
❌ To run models after download → NO

With Ollama, you need to build your own:
✅ tool registry
✅ tool execution router
✅ agent loop
✅ message history
✅ reasoning step handler

1. Send prompt to model
2. Model decides whether to call a tool
3. You detect tool call in text
4. You execute tool manually
5. Send result back to model
6. Loop until finished

Zod is a TypeScript-first validation and schema definition library.
It allows you to define data structures, types, and runtime validators