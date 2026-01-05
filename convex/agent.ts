//create a mutation just like user.ts

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const CreateAgent= mutation({
    args:{
        name:v.string(),
        agentId:v.string(),
        userId: v.id('UserTable')
    },
    handler: async(ctx , args)=>{
        const result = await ctx.db.insert("AgentTable",{
            name:args.name,
            agentId:args.agentId,
            published:false,
            userId: args.userId
        })
        return result;
    }
})

export const GetUserAgents = query({
    args:{
        userId: v.id('UserTable')
    },
    handler:async(ctx , args)=>{
        const result = await ctx.db.query('AgentTable')
        .filter(q=>q.eq(q.field('userId'), args.userId))
        .order('desc')
        .collect()

        return result;
    }

})

export const GetAgentById = query({
    args: {
        agentId: v.string()
    },
    handler: async(ctx ,args)=>{
        const result = await ctx.db.query('AgentTable')
        .filter(q=>q.eq(q.field('agentId'), args.agentId))
        .order('desc')
        .collect()

        return result[0];
    }
})

export const UpdateAgentDetail = mutation({
  args: {
    agentId: v.string(),
    nodes: v.optional(v.any()),
    edges: v.optional(v.any()),
    published: v.optional(v.boolean()), // ✅ ADD THIS
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("AgentTable")
      .filter(q => q.eq(q.field("agentId"), args.agentId))
      .first();

    if (!agent) {
      throw new Error("Agent not found");
    }

    await ctx.db.patch(agent._id, {
      ...(args.nodes !== undefined && { nodes: args.nodes }),
      ...(args.edges !== undefined && { edges: args.edges }),
      ...(args.published !== undefined && { published: args.published }),
    });

    return { success: true, agentId: args.agentId };
  },
});

// Add this to your agent.ts file temporarily for debugging
export const DebugListAllAgents = query({
    args: {},
    handler: async(ctx) => {
        const result = await ctx.db.query('AgentTable').collect();
        return result;
    }
})

export const UpdateAgentToolConfig = mutation({
    args:{
        id:v.id('AgentTable'),
        agentToolConfig:v.any()
    },
    handler:async(ctx , args)=>{
        await ctx.db.patch(args.id,{
            agentToolConfig:args.agentToolConfig
        })
    }
})