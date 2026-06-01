import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

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

export const GetAllAgents = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("AgentTable").collect();
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

    const currentNodes = args.nodes !== undefined ? args.nodes : agent.nodes;
    const isPublished = args.published !== undefined ? args.published : agent.published;
    const hasCronNode = Array.isArray(currentNodes) && currentNodes.some((n: any) => n.type === "CronNode");

    let nextVersion = agent.scheduleVersion;

    if (isPublished) {
      if (hasCronNode) {
        nextVersion = (agent.scheduleVersion ?? 0) + 1;
      }
    } else {
      if (agent.published) {
        nextVersion = (agent.scheduleVersion ?? 0) + 1;
      }
    }

    const updateFields: any = {
      ...(args.nodes !== undefined && { nodes: args.nodes }),
      ...(args.edges !== undefined && { edges: args.edges }),
      ...(args.published !== undefined && { published: args.published }),
      ...(nextVersion !== undefined && { scheduleVersion: nextVersion }),
    };

    await ctx.db.patch(agent._id, updateFields);

    if (isPublished && hasCronNode && nextVersion !== undefined) {
      await ctx.scheduler.runAfter(0, api.trigger.runScheduledAgent, {
        agentId: args.agentId,
        scheduleVersion: nextVersion,
      });
    }

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
});

export const LogTriggerRun = mutation({
  args: {
    agentId: v.string(),
    source: v.string(),
    inputPrompt: v.string(),
    response: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("TriggerRunTable", {
      agentId: args.agentId,
      source: args.source,
      inputPrompt: args.inputPrompt,
      response: args.response,
      status: args.status,
      executedAt: Date.now(),
    });
  },
});

export const GetTriggerRuns = query({
  args: {
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("TriggerRunTable")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .collect();
  },
});