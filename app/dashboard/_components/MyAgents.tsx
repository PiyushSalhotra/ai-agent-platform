"use client";

import { UserDetailContext } from '@/context/UserDetailContext';
import { api } from '@/convex/_generated/api';
import { Agent } from '@/types/AgentType';
import { useConvex } from 'convex/react';
import { GitBranchPlus } from 'lucide-react';
import React, { useContext, useEffect, useState } from 'react';
import moment from 'moment';
import Link from 'next/link';

function MyAgents() {

  // Access logged-in user's Convex user data from global context
  const { userDetail } = useContext(UserDetailContext);

  // Local state to store the list of agents associated with the user
  const [agentList, setAgentList] = useState<Agent[]>([]);

  // Convex client instance used to call queries & mutations
  const convex = useConvex();

  // Run once userDetail becomes available (after authentication + Convex fetch)
  useEffect(() => {
    // Only fetch agents if userDetail is loaded
    userDetail && GetUserAgents();
  }, [userDetail]);


  // Fetch all agents for the logged-in user from Convex backend
  const GetUserAgents = async () => {
    const result = await convex.query(api.agent.GetUserAgents, {
      userId: userDetail?._id,  // Send Convex user document ID
    });

    console.log(result);    
    setAgentList(result);      // Save the list to state
  };


  return (
    <div className='w-full mt-5'>
      
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:gid-cols-4'>
        
        {agentList.map((agent, index) => (
          
          <Link
            href={'/agent-builder/' + agent.agentId}  // Navigate to specific agent builder page
            key={index}
            className='p-3 border rounded-2xl shadow'
          >
            {/* Icon for the agent */}
            <GitBranchPlus className='bg-yellow-100 p-2 h-8 w-8 rounded-sm' />

            {/* Agent name */}
            <h2 className='mt-3'>{agent.name}</h2>

            {/* Creation time displayed in "x days ago" format */}
            <h2 className='text-sm text-gray-400 mt-2'>
              {moment(agent._creationTime).fromNow()}
            </h2>
          </Link>

        ))}
      </div>

    </div>
  );
}

export default MyAgents;
