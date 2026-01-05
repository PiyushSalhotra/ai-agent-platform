"use client";

import { UserDetailContext } from '@/context/UserDetailContext';
import { api } from '@/convex/_generated/api';
import { Agent } from '@/types/AgentType';
import { useQuery } from 'convex/react';
import { GitBranchPlus } from 'lucide-react';
import React, { useContext } from 'react';
import moment from 'moment';
import Link from 'next/link';

function MyAgents() {
  const { userDetail } = useContext(UserDetailContext);

  // ✅ Reactive, safe, cancellable
  const agentList = useQuery(
    api.agent.GetUserAgents,
    userDetail ? { userId: userDetail._id } : "skip"
  );

  // ⛔ Convex still loading
  if (agentList === undefined) {
    return <div className="mt-5 text-gray-400">Loading agents…</div>;
  }

  // ⛔ No agents
  if (agentList.length === 0) {
    return <div className="mt-5 text-gray-400">No agents found</div>;
  }

  return (
    <div className='w-full mt-5'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
        {agentList.map((agent: Agent) => (
          <Link
            href={`/agent-builder/${agent.agentId}`}
            key={agent._id}
            className='p-3 border rounded-2xl shadow'
          >
            <GitBranchPlus className='bg-yellow-100 p-2 h-8 w-8 rounded-sm' />

            <h2 className='mt-3'>{agent.name}</h2>

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
