import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const runScheduledAgent = action({
  args: {
    agentId: v.string(),
    scheduleVersion: v.number(),
  },
  handler: async (ctx, args) => {
    // 1. Fetch the agent details using runQuery
    const agent = await ctx.runQuery(api.agent.GetAgentById, {
      agentId: args.agentId,
    });

    if (!agent) {
      console.log(`[Scheduler] Agent ${args.agentId} not found`);
      return;
    }

    // 2. Verify agent is published and scheduleVersion matches
    if (!agent.published) {
      console.log(`[Scheduler] Agent ${args.agentId} is not published. Stopping schedule.`);
      return;
    }

    if (agent.scheduleVersion !== args.scheduleVersion) {
      console.log(
        `[Scheduler] Schedule version mismatch: expected ${args.scheduleVersion}, but agent is at ${agent.scheduleVersion}. Stopping job.`
      );
      return;
    }

    // 3. Find the cron node and get interval minutes
    const nodes = agent.nodes || [];
    const cronNode = nodes.find((n: any) => n.type === "CronNode");
    if (!cronNode) {
      console.log(`[Scheduler] No CronNode found for agent ${args.agentId}. Stopping schedule.`);
      return;
    }

    const intervalMinutes = parseInt(cronNode.data?.settings?.interval || "60", 10);
    if (isNaN(intervalMinutes) || intervalMinutes <= 0) {
      console.log(`[Scheduler] Invalid interval (${intervalMinutes}) for agent ${args.agentId}.`);
      return;
    }

    // 4. Fire the HTTP POST request to /api/trigger/[agentId]?source=cron
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const triggerUrl = `${appUrl}/api/trigger/${args.agentId}?source=cron`;

    console.log(`[Scheduler] Triggering agent ${args.agentId} at ${triggerUrl}`);

    try {
      const response = await fetch(triggerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: "cron",
        }),
      });

      if (!response.ok) {
        console.error(`[Scheduler] Failed to trigger agent: ${response.statusText}`);
      } else {
        const data = await response.json();
        console.log(`[Scheduler] Successfully triggered agent. Response:`, data);
      }
    } catch (error) {
      console.error(`[Scheduler] Error triggering agent:`, error);
    }

    // 5. Reschedule itself for the next run
    const delayMs = intervalMinutes * 60 * 1000;
    console.log(`[Scheduler] Rescheduling agent ${args.agentId} in ${intervalMinutes} minutes (${delayMs} ms)`);
    await ctx.scheduler.runAfter(delayMs, api.trigger.runScheduledAgent, {
      agentId: args.agentId,
      scheduleVersion: args.scheduleVersion,
    });
  },
});
