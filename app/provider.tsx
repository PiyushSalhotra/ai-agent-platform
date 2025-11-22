"use client"

import { UserDetailContext } from "@/context/UserDetailContext";
import { WorkflowContext } from "@/context/WorkflowContext";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Position, ReactFlowProvider } from "@xyflow/react";
import { useMutation } from "convex/react";
import React, { useEffect, useState } from "react";

function Provider({ children }: { children: React.ReactNode }) {

  // Clerk user object + loading state
  const { user, isLoaded } = useUser();
  //user → Clerk user object (name, email, etc.)
  //isLoaded → ensures user data is ready

  // Convex mutation for creating/fetching user in database
  const createUser = useMutation(api.user.CreateNewUser);

  // Store Convex user document globally
  const [userDetail, setUserDetail] = useState<any>(null);

  const [selectedNode,setSelectedNode] = useState<any>()

  // Store all nodes for workflow/agent builder
  const [addedNodes, setAddedNodes] = useState([
    {
      id: 'start',
      position: { x: 0, y: 0 },
      data: { label: 'Start' },
      type: 'StartNode'  // Initial start node in your flow
    }
  ]);

  // Store edges (connections between nodes)
  const [nodeEdges, setNodeEdges] = useState([]);

  // Create or get user from Convex database
  const CreateAndGetUser = async () => {
    console.log("🚀 Calling Convex mutation for:", user?.primaryEmailAddress?.emailAddress);

    const result = await createUser({
      name: user?.fullName ?? "",
      email: user?.primaryEmailAddress?.emailAddress ?? "",
    });

    console.log("Convex mutation result:", result);

    // Save Convex user record to state
    setUserDetail(result);
  };

  // Runs when Clerk user is loaded → creates/fetches user from Convex
  useEffect(() => {
    if (isLoaded && user) {
      CreateAndGetUser();
    }
  }, [isLoaded, user]);

  return (
    // Provide Convex user detail to entire app
    <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
      <ReactFlowProvider>
      {/* Provide workflow nodes & edges globally */}
      <WorkflowContext.Provider value={{ addedNodes, setAddedNodes, nodeEdges, setNodeEdges,selectedNode,setSelectedNode }}>
        
        <div>{children}</div>
      </WorkflowContext.Provider>
        </ReactFlowProvider>
    </UserDetailContext.Provider>
  );
}

export default Provider;
