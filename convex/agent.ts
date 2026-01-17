import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const CreateAgent = mutation({
  args: {
    name: v.string(),
    agentId: v.string(),
    userId: v.id("UserTable"),
  },
  handler: async (ctx, args) => {
    // 1️⃣ Fetch user
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    // 2️⃣ Check subscription (handle undefined/null)
    const isPaidUser = user.Subscribtion === "unlimited_plans";

    // 3️⃣ Count user's agents
    const agents = await ctx.db
      .query("AgentTable")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .collect();

    const FREE_LIMIT = 2;

    // 4️⃣ Enforce limit (BACKEND RULE)
    if (!isPaidUser && agents.length >= FREE_LIMIT) {
      throw new Error("FREE_AGENT_LIMIT_REACHED");
    }

    // 5️⃣ Create agent
    const result = await ctx.db.insert("AgentTable", {
      name: args.name,
      agentId: args.agentId,
      published: false,
      userId: args.userId,
    });

    return result;
  },
});

export const GetUserAgents = query({
    args:{
        userId: v.id('UserTable')
    },
    handler:async(ctx, args) => {
        const result = await ctx.db.query('AgentTable')
        .filter(q => q.eq(q.field('userId'), args.userId))
        .order('desc')
        .collect()

        return result;
    }
})

export const GetAgentById = query({
    args: {
        agentId: v.string()
    },
    handler: async(ctx, args) => {
        const result = await ctx.db.query('AgentTable')
        .filter(q => q.eq(q.field('agentId'), args.agentId))
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
    published: v.optional(v.boolean()),
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

export const UpdateAgentToolConfig = mutation({
    args:{
        id: v.id('AgentTable'),
        agentToolConfig: v.any()
    },
    handler:async(ctx, args) => {
        await ctx.db.patch(args.id, {
            agentToolConfig: args.agentToolConfig
        })
    }
})