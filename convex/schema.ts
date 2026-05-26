import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

//convex automatically create unique id for u, so dont need to create id field
export default defineSchema({
    UserTable:defineTable({
        name:v.string(),
        email:v.string(),
        Subscribtion:v.optional(v.string()),
        token:v.number()
    }),

    AgentTable: defineTable({
  agentId: v.string(),
  name: v.string(),
  config: v.optional(v.any()),
  nodes: v.optional(v.any()),
  edges: v.optional(v.any()),
  published: v.boolean(),
  userId: v.id("UserTable"),//connect with userTable
  agentToolConfig: v.optional(v.any()),
  scheduleVersion: v.optional(v.number()),
})
.index("by_user", ["userId"]), //to check how many agents a user has created


    ConversationTable:defineTable({
        conversationId: v.string(),
        agentId: v.id('AgentTable'),
        userId: v.id('UserTable'),
    }),

    TriggerRunTable: defineTable({
      agentId: v.string(),
      source: v.string(),
      inputPrompt: v.string(),
      response: v.string(),
      status: v.string(),
      executedAt: v.number(),
    }).index("by_agent", ["agentId"]),
})