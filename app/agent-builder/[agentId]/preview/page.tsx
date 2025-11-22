"use client";
import React, { useEffect, useState } from "react";
import Header from "../../_components/Header";
import { api } from "@/convex/_generated/api";
import { useConvex, useMutation } from "convex/react";
import { useParams } from "next/navigation";
import axios from "axios";
import { Background, ReactFlow } from "@xyflow/react";
import { nodeTypes } from "../page";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { RefreshCcwIcon } from "lucide-react";
import ChatUi from "./_components/ChatUi";

function PreviewAgent() {
  const convex = useConvex();
  const { agentId } = useParams();
  const [agentDetail, setAgentDetail] = useState<any>(null);
  const [flowConfig, setFlowConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const UpdateAgentToolConfig = useMutation(
    api.agent.UpdateAgentToolConfig
  );
  const [agentOutput, setAgentOutput] = useState<any>(null);

  // ✅ Fetch agent detail
  useEffect(() => {
    GetAgentDetail();
  }, []);

  const GetAgentDetail = async () => {
    const result = await convex.query(api.agent.GetAgentById, {
      agentId: agentId as string,
    });
    setAgentDetail(result);
  };

  // ✅ Workflow generator when agentDetail updates
  useEffect(() => {
    if (agentDetail) {
      GenerateWorkflow();
    }
  }, [agentDetail]);

  const GenerateWorkflow = () => {
    const edgeMap = agentDetail?.edges?.reduce(
      (acc: any, edge: any) => {
        if (!acc[edge.source]) acc[edge.source] = [];
        acc[edge.source].push(edge);
        return acc;
      },
      {}
    );

    const flow = agentDetail?.nodes?.map((node: any) => {
      const connectedEdges = edgeMap[node.id] || [];
      let next: any = null;

      switch (node.type) {
        case "IfElseNode": {
          const ifEdge = connectedEdges.find(
            (e: any) => e.sourceHandle === "if"
          );
          const elseEdge = connectedEdges.find(
            (e: any) => e.sourceHandle === "else"
          );
          next = {
            if: ifEdge?.target || null,
            else: elseEdge?.target || null,
          };
          break;
        }
        case "AgentNode":
        case "ApiNode":
        case "UserApprovalNode":
        case "StartNode":
          if (connectedEdges.length === 1) {
            next = connectedEdges[0].target;
          } else if (connectedEdges.length > 1) {
            next = connectedEdges.map((e: any) => e.target);
          }
          break;
        case "EndNode":
          next = null;
          break;
        default:
          if (connectedEdges.length === 1) {
            next = connectedEdges[0].target;
          } else if (connectedEdges.length > 1) {
            next = connectedEdges.map((e: any) => e.target);
          }
          break;
      }

      return {
        id: node.id,
        type: node.type,
        label: node.data?.label || node.type,
        settings: node.data?.settings || {},
        next,
      };
    });

    const startNode = agentDetail?.nodes?.find(
      (n: any) => n.type === "StartNode"
    );

    const config = {
      startNode: startNode?.id || null,
      flow,
    };

    setFlowConfig(config);
    console.log("✅ Generated Workflow Config:", config);
  };

  // ✅ Generate Agent Tool Config with Ollama
  const GenerateAgentToolConfig = async () => {
    if (!flowConfig) return;

    setLoading(true);

    try {
      const result = await axios.post(
        `/api/generate-agent-tool-config`,
        { jsonConfig: flowConfig }
      );

      console.log("✅ Agent Tool Config:", result.data);

      await UpdateAgentToolConfig({
        id: agentDetail?._id as any,
        agentToolConfig: result.data,
      });

      await GetAgentDetail();
    } catch (err) {
      console.error("❌ GenerateAgentToolConfig Error:", err);
    }

    setLoading(false);
  };

  // ✅ Run agent using Ollama + tools
  const RunAgent = async () => {
    if (!agentDetail?.agentToolConfig) return;

    const res = await fetch("/api/run-agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: "hello",
        agents: agentDetail.agentToolConfig.agents,
        tools: agentDetail.agentToolConfig.tools,
        conversationId: null,
        systemPrompt: agentDetail.agentToolConfig.systemPrompt,
      }),
    });

    const data = await res.json();
    setAgentOutput(data);

    console.log("✅ Final Answer:", data.finalAnswer);
    console.log("🧠 Trace:", data.trace);
  };

  return (
    <div>
      <Header previewHeader={true} agentDetail={agentDetail} />

      <div className="grid grid-cols-4">
        <div className="col-span-3 p-5 border rounded-2xl m-5">
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

        <div className="col-span-1 border rounded-2xl m-5 p-5">
          {!agentDetail?.agentToolConfig ? (
            <Button onClick={GenerateAgentToolConfig} disabled={loading}>
              <RefreshCcwIcon
                className={`${loading && "animate-spin"}`}
              />
              Reboot Agent
            </Button>
          ) : (
            <>
              <ChatUi
                GenerateAgentToolConfig={GenerateAgentToolConfig}
                loading={loading}
                agentDetail={agentDetail}
              />

              <Button className="mt-4" onClick={RunAgent}>
                Run Agent
              </Button>

              {agentOutput && (
                <pre className="text-xs p-2 bg-black text-green-400 rounded mt-2">
                  {JSON.stringify(agentOutput, null, 2)}
                </pre>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PreviewAgent;
