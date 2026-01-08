"use client"
import React, { useEffect, useState } from 'react'
import Header from '../../_components/Header'
import { useConvex, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams } from 'next/navigation';
import { Agent } from '@/types/AgentType';
import { Background, ReactFlow } from '@xyflow/react';
import { nodeTypes } from '../nodeTypes';

import "@xyflow/react/dist/style.css";
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { RefreshCcwIcon } from 'lucide-react';
import ChatUi from './_components/ChatUi';
import PublishCodeDialog from './_components/PublishCodeDialog';

function PreviewAgent() {
  const convex = useConvex();
  const {agentId} = useParams();

// Stores:
// nodes
// edges
// agentToolConfig
  const [agentDetail, setAgentDetail] = React.useState<Agent>();
  const [config, setConfig] = useState<any>();
  //result generated from previous workflow we need to saved
  const [flowConfig, setFlowConfig] = React.useState<any>(null);
  //whenever config is generated, it will take some time, so we need to maintain loading state
  const [loading, setLoading] = useState(false);
  //define the mutation
  const updateAgentToolConfig = useMutation(api.agent.UpdateAgentToolConfig);

  const [openDialog, setOpenDialog] = useState(false);

//Used by ChatUi so the agent:
// remembers chat history
// maintains context
  const [conversationId, setConversationId] = useState<string | null>(null);

  //fetching agent data
  useEffect(() => {
      GetAgentDetail();
    }, []);
  
    const GetAgentDetail = async () => {
      const result = await convex.query(api.agent.GetAgentById, {
        agentId: agentId as string,
      });
      setAgentDetail(result);

      //Get Conversation ID if not present
// Creates / fetches a conversation session
// Used later by Chat UI
      const conversationIdResult = await axios.get('/api/agent-chat');
      console.log(conversationIdResult.data)
      setConversationId(conversationIdResult.data);
    };


// 🧩 Generate workflow once agent data is loaded
useEffect(() => {
    if (agentDetail) {
        GenerateWorkflow()
    }
}, [agentDetail])

// ⚙️ Generate workflow config (node/edge relationship)
const GenerateWorkflow = () => {
    // 🧩 Build Edge Map for quick source → target lookup
    const edgeMap = agentDetail?.edges?.reduce((acc: any, edge: any) => {
        if (!acc[edge.source]) acc[edge.source] = [];
        acc[edge.source].push(edge);
        return acc;
    }, {});

    // 🔄 Build flow array by mapping each node
    // Convert UI Nodes → Logic Nodes
    const flow = agentDetail?.nodes?.map((node: any) => {
        const connectedEdges = edgeMap[node.id] || [];
        let next: any = null;

        switch (node.type) {
            // 🧭 Conditional branching node with "if" and "else"
            case "IfElseNode": {
                const ifEdge = connectedEdges.find((e: any) => e.sourceHandle === "if");
                const elseEdge = connectedEdges.find((e: any) => e.sourceHandle === "else");

                //Handle Node Types Properly
                //branch logic
                next = {
                    if: ifEdge?.target || null,
                    else: elseEdge?.target || null,
                };
                break;
            }

            // 🧠 Agent or AI Node
            case "AgentNode": {
                if (connectedEdges.length === 1) {
                    next = connectedEdges[0].target;
                } else if (connectedEdges.length > 1) {
                    next = connectedEdges.map((e: any) => e.target);
                }
                break;
            }

            // 🔗 API Call Node
            case "ApiNode": {
                if (connectedEdges.length === 1) {
                    next = connectedEdges[0].target;
                }
                break;
            }

            // ✅ User Approval Node (manual checkpoint)
            case "UserApprovalNode": {
                if (connectedEdges.length === 1) {
                    next = connectedEdges[0].target;
                }
                break;
            }

            // 🚀 Start Node
            case "StartNode": {
                if (connectedEdges.length === 1) {
                    next = connectedEdges[0].target;
                }
                break;
            }

            // 🏁 End Node
            case "EndNode": {
                next = null; // No next node
                break;
            }

            // 🔧 Default handling for any unknown node type
            default: {
                if (connectedEdges.length === 1) {
                    next = connectedEdges[0].target;
                } else if (connectedEdges.length > 1) {
                    next = connectedEdges.map((e: any) => e.target);
                }
                break;
            }
        }

        // 🧱 Return a simplified node configuration
        return {
            id: node.id,
            type: node.type,
            label: node.data?.label || node.type,
            settings: node.data?.settings || {},
            next,
        };
    });

    // 🎯 Find the Start Node
    const startNode = agentDetail?.nodes?.find((n: any) => n.type === "StartNode");

    // 🧱 Final Config structure
    const config = {
        startNode: startNode?.id || null,
        flow,
    };
    setFlowConfig(config);

    console.log("✅ Generated Workflow Config:", config);
    //setConfig(config);
}

//Sends workflow JSON to backend
// Backend:
// Converts workflow → AI tools
// Creates tool schemas
// Builds agent instructions
// Saves generated config to DB
  const GenerateAgentToolConfig= async ()=>{
    setLoading(true);
    const result = await axios.post('/api/generate-agent-tool-config',{
      jsonConfig:flowConfig
    })
    console.log(result.data);

    //update to our DB
    await updateAgentToolConfig({
      id: agentDetail?._id as any,
      agentToolConfig: result.data
    })
    GetAgentDetail();//hide reboot button
    setLoading(false);
  }

  //need to open dialog box to publish
  const onPublish = () => {
    setOpenDialog(true);
  }

  return (
    
    <div>
      <Header previewHeader={true} agentDetail={agentDetail} onPublish={onPublish}/>
      <div className='grid grid-cols-4'>
      <div className='col-span-3 p-5 border rounded-2xl m-5'>
        <h2>Preview</h2>
       <div style={{ width: "100%", height: "90vh" }}>
      <ReactFlow
          nodes={agentDetail?.nodes || []}
          edges={agentDetail?.edges || []}
          fitView
          nodeTypes={nodeTypes} 
          draggable={false}  
        >
          {/* @ts-ignore */}
                    <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
        </div>
    </div>
    <div className='col-span-1 border rounded-2xl m-5 p-5'>
      
        {/* chatui function only shows when there is tool config */}
      {!agentDetail?.agentToolConfig ? <div className='flex items-center justify-center h-full'>
      <Button onClick={GenerateAgentToolConfig} disabled={loading}> <RefreshCcwIcon className= {`${loading && 'animate-spin'}`}/> Reboot Agent</Button>
      </div>:
      <ChatUi GenerateAgentToolConfig={GenerateAgentToolConfig} loading={loading}
      agentDetail= {agentDetail} conversationId={conversationId}/>
      }
    </div>
    </div>
    <PublishCodeDialog openDialog={openDialog} setOpenDialog={setOpenDialog}/>
    </div>
  )
}

export default PreviewAgent
