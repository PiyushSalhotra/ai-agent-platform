"use client"
import React, { useCallback, useContext, useEffect, useState } from 'react'
import Header from '../_components/Header'
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge, Background, MiniMap, Controls, Panel, useOnSelectionChange, OnSelectionChangeParams } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import StartNode from '../_customNodes/StartNode';
import AgentNode from '../_customNodes/AgentNode';
import AgentToolsPanel from '../_components/AgentToolsPanel';
import { WorkflowContext } from '@/context/WorkflowContext';
import { useConvex, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams } from 'next/navigation';
import { Agent } from '@/types/AgentType';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import EndNode from '../_customNodes/EndNode';
import IfElseNode from '../_customNodes/IfElseNode';
import WhileNode from '../_customNodes/WhileNode';
import UserApprovalNode from '../_customNodes/UserApprovalNode';
import ApiNode from '../_customNodes/ApiNode';
import SettingPanel from '../_components/SettingPanel';

//define nodes
export const nodeTypes = {
  StartNode: StartNode,
  AgentNode: AgentNode,
  EndNode: EndNode,
  IfElseNode:IfElseNode,
  WhileNode:WhileNode,
  UserApprovalNode:UserApprovalNode,
  ApiNode:ApiNode
};

function AgentBuilder() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const {agentId} = useParams();

  const {addedNodes, setAddedNodes, nodeEdges, setNodeEdges,setSelectedNode} = useContext(WorkflowContext);
  const convex = useConvex();
  const UpdateAgentDetail = useMutation(api.agent.UpdateAgentDetail)
  const [agentDetail, setAgentDetail] = useState<Agent>();
  const [isSaving, setIsSaving] = useState(false);

  // Debug query - added INSIDE the component
  const allAgents = useQuery(api.agent.DebugListAllAgents);

  useEffect(() => {
    if (allAgents) {
      console.log('=== ALL AGENTS IN DATABASE ===');
      console.log('Total agents:', allAgents.length);
      allAgents.forEach((agent, index) => {
        console.log(`Agent ${index + 1}:`, {
          _id: agent._id,
          agentId: agent.agentId,
          name: agent.name
        });
      });
      console.log('Looking for agentId:', agentId);
      console.log('===========================');
    }
  }, [allAgents, agentId]);

  useEffect(() => {
    console.log('Component mounted, agentId:', agentId);
    if (agentId) {
      GetAgentDetail();
    }
  }, [agentId])

  const GetAgentDetail = async() => {
    try {
      console.log('Fetching agent with ID:', agentId);
      const result = await convex.query(api.agent.GetAgentById, {
        agentId: agentId as string
      });
      console.log('Agent Detail Loaded:', result);
      
      if (result) {
        setAgentDetail(result);
        console.log('Agent detail state updated:', result);
      } else {
        console.error('No result returned from GetAgentById');
      }
    } catch (error) {
      console.error('Error loading agent:', error);
    }
  }

  useEffect(() => {
    //for saving previous data
    if(agentDetail){
      setNodes(agentDetail.nodes);
      setEdges(agentDetail.edges);
      setAddedNodes(agentDetail.nodes);
      setNodeEdges(agentDetail.edges);
    }
    
  }, [agentDetail])

  useEffect(()=>{
    addedNodes&&setNodes(addedNodes)
  },[addedNodes])
  useEffect(() => {
    edges && setNodeEdges(edges);
  }, [edges])

  
  const SaveNodeAndEdges = async() => {
    console.log('Save button clicked');
    console.log('Agent Detail:', agentDetail);
    console.log('Agent ID from params:', agentId);
    
    if (!agentId) {
      console.error('No agent ID available');
      alert('No agent ID available');
      return;
    }

    setIsSaving(true);
    try {
      console.log('Saving with agentId:', agentId);
      console.log('Nodes:', addedNodes || nodes);
      console.log('Edges:', nodeEdges || edges);
      
      const result = await UpdateAgentDetail({
        agentId: agentId as string,
        edges: nodeEdges || edges,
        nodes: addedNodes || nodes
      });
      console.log('Saved successfully:', result);
      toast.success('Saved!')
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error saving: ' + error);
    } finally {
      setIsSaving(false);
    }
  }
 
  const onNodesChange = useCallback(
    (changes: any) => setNodes((nodesSnapshot) => {
      const updated = applyNodeChanges(changes, nodesSnapshot)
      setAddedNodes(updated);
      return updated;
    }),
    [setAddedNodes],
  );
  
  const onEdgesChange = useCallback(
    (changes: any) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [],
  );
  
  const onConnect = useCallback(
    //@ts-ignore
    (params: any) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [],
  );

  const onNodeSelect = useCallback(({nodes,edges}:OnSelectionChangeParams)=>{
    setSelectedNode(nodes[0]);
    console.log(nodes[0])
  },[])
  useOnSelectionChange({
    onChange: onNodeSelect
  })

  return (
    <div>
      <Header agentDetail={agentDetail}/>
      <div style={{ width: '100vw', height: '90vh' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          nodeTypes={nodeTypes}
        >
          <MiniMap/>
          <Controls/>
          {/* @ts-ignore */}
          <Background variant='dots' gap={12} size={1}/>
          <Panel position='top-left'>
            <AgentToolsPanel/>
          </Panel>
          <Panel position='top-right'>
            <SettingPanel/>
          </Panel>
          <Panel position='bottom-center'>
            <Button 
              onClick={SaveNodeAndEdges}
              disabled={isSaving}
            >
              <Save/> {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  )
}

export default AgentBuilder