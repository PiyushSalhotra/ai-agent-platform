"use client";
import { nodeTypes } from "./nodeTypes";

import React, { useCallback, useContext, useEffect, useState, useRef } from "react";
import Header from "../_components/Header";
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Background,
  MiniMap,
  Controls,
  Panel,
  useOnSelectionChange,
  OnSelectionChangeParams,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import StartNode from "../_customNodes/StartNode";
import AgentNode from "../_customNodes/AgentNode";
import EndNode from "../_customNodes/EndNode";
import IfElseNode from "../_customNodes/IfElseNode";
import WhileNode from "../_customNodes/WhileNode";
import UserApprovalNode from "../_customNodes/UserApprovalNode";
import ApiNode from "../_customNodes/ApiNode";

import AgentToolsPanel from "../_components/AgentToolsPanel";
import SettingPanel from "../_components/SettingPanel";

import { WorkflowContext } from "@/context/WorkflowContext";
import { useConvex, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { Agent } from "@/types/AgentType";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { toast } from "sonner";

/* FIXED: Added 'start' key for StartNode */

function AgentBuilder() {
  const { agentId } = useParams();
//   Used to:
// Fetch agent from Convex
// Save workflow changes

  const {
    addedNodes,
    setAddedNodes,
    nodeEdges,
    setNodeEdges,
    setSelectedNode,
  } = useContext(WorkflowContext);

  const convex = useConvex();
  const UpdateAgentDetail = useMutation(api.agent.UpdateAgentDetail);
//   useConvex() → read data
// useMutation() → write/update data

  const [agentDetail, setAgentDetail] = useState<Agent | null>(null);
  const [isSaving, setIsSaving] = useState(false);
//   agentDetail → full agent info from DB
// isSaving → disables Save button + UX feedback

  const isInternalUpdate = useRef(false);
// When you load nodes from DB:
// setAddedNodes() triggers
// onNodesChange() fires
// Infinite loop / overwrites happen 

  //Fetch Agent from DB
  useEffect(() => {
    if (agentId) GetAgentDetail();
  }, [agentId]);

  const GetAgentDetail = async () => {
    const result = await convex.query(api.agent.GetAgentById, {
      agentId: agentId as string,
    });
    if (result) setAgentDetail(result as Agent);
  };

  /* ✅ FIXED: Check for both "start" and "StartNode" types */
  useEffect(() => {
    if (!agentDetail) return;

    let safeNodes = Array.isArray(agentDetail.nodes)
      ? [...agentDetail.nodes]
      : [];
    const safeEdges = Array.isArray(agentDetail.edges)
      ? agentDetail.edges
      : [];

    // ✅ Check for both possible start node types
    const hasStart = safeNodes.some((n) => n.type === "start" || n.type === "StartNode" || n.id === "start");

    //Guarantees:
//Every workflow has a start
//User can’t delete it
    if (!hasStart) {
      // ✅ Add start node at the beginning
      safeNodes.unshift({
        id: "start",
        type: "start",
        position: { x: 250, y: 100 },
        data: { label: "Start" },
        deletable: false,
      });
    }

    console.log("Loading nodes:", safeNodes);

    isInternalUpdate.current = true;
    setAddedNodes(safeNodes);
    setNodeEdges(safeEdges);
    isInternalUpdate.current = false;
  }, [agentDetail, setAddedNodes, setNodeEdges]);

// Disable button
// Save nodes + edges to Convex
// Show toast
// Re-enable button
  const SaveNodeAndEdges = async () => {
    if (!agentId) return;

    setIsSaving(true);
    try {
      console.log("Saving nodes:", addedNodes);
      await UpdateAgentDetail({
        agentId: agentId as string,
        nodes: addedNodes,
        edges: nodeEdges,
      });
      toast.success("Saved!");
    } finally {
      setIsSaving(false);
    }
  };

  //Nodes Change, handles drag,resize,delete, position updates
  const onNodesChange = useCallback(
    (changes: any) => {
      if (isInternalUpdate.current) return;
      
      setAddedNodes((prev: any[]) => {
        const updated = applyNodeChanges(changes, prev || []);
        console.log("Nodes after change:", updated);
        return updated;
      });
    },
    [setAddedNodes]
  );

  //edges changes handles edge delete,move
  const onEdgesChange = useCallback(
    (changes: any) => {
      setNodeEdges((prev: any[]) =>
        applyEdgeChanges(changes, prev || [])
      );
    },
    [setNodeEdges]
  );

  //Connect Nodes
  const onConnect = useCallback(
    (params: any) => {
      setNodeEdges((prev: any[]) => addEdge(params, prev || []));
    },
    [setNodeEdges]
  );

//When user clicks a node:
//That node becomes active
//Settings panel updates
  const onNodeSelect = useCallback(
    ({ nodes }: OnSelectionChangeParams) => {
      setSelectedNode(nodes?.[0] || null);
    },
    [setSelectedNode]
  );

  useOnSelectionChange({ onChange: onNodeSelect });

  console.log("Rendering with nodes:", addedNodes);

  const onPublish = async () => {
  if (!agentId) return;

  try {
    await UpdateAgentDetail({
      agentId: agentId as string,
      published: true,
    });
    toast.success("Agent published successfully!");
  } catch (err) {
    toast.error("Failed to publish agent");
  }
};


  return (
    <div>
      <Header agentDetail={agentDetail || undefined} onPublish={onPublish} />
      <div style={{ width: "100vw", height: "90vh" }}>
        <ReactFlow
          nodes={addedNodes || []}
          edges={nodeEdges || []}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <MiniMap />
          <Controls />
          {/* @ts-ignore */}
          <Background variant="dots" gap={12} size={1} />

          <Panel position="top-left">
            <AgentToolsPanel />
          </Panel>

          <Panel position="top-right">
            <SettingPanel />
          </Panel>

          <Panel position="bottom-center">
            <Button onClick={SaveNodeAndEdges} disabled={isSaving}>
              <Save className="mr-1" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

export default AgentBuilder;