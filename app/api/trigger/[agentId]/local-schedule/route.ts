import { NextRequest, NextResponse } from "next/server";

// Keep track of active intervals globally
const globalForIntervals = global as typeof globalThis & {
  cronIntervals: Record<string, NodeJS.Timeout>;
};

if (!globalForIntervals.cronIntervals) {
  globalForIntervals.cronIntervals = {};
}

export async function POST(
  req: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const { agentId } = params;
    const { active, intervalMinutes } = await req.json();

    // 1. Clear previous interval if exists
    if (globalForIntervals.cronIntervals[agentId]) {
      console.log(`[Local Cron Sync] Clearing existing local cron interval for agent ${agentId}`);
      clearInterval(globalForIntervals.cronIntervals[agentId]);
      delete globalForIntervals.cronIntervals[agentId];
    }

    // 2. If active, setup a new interval
    if (active && intervalMinutes) {
      const mins = parseFloat(intervalMinutes);
      if (!isNaN(mins) && mins > 0) {
        console.log(`[Local Cron Sync] Setting up local cron interval for agent ${agentId} every ${mins} minutes`);
        
        const intervalMs = mins * 60 * 1000;
        
        // Resolve request origin dynamically
        const origin = req.nextUrl.origin || "http://localhost:3000";
        const triggerUrl = `${origin}/api/trigger/${agentId}?source=cron`;

        const triggerFn = async () => {
          console.log(`[Local Cron Sync Worker] Triggering agent ${agentId} at ${triggerUrl}`);
          try {
            const res = await fetch(triggerUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ source: "cron" })
            });
            const text = await res.text();
            console.log(`[Local Cron Sync Worker] Agent response for ${agentId}:`, text);
          } catch (err) {
            console.error(`[Local Cron Sync Worker] Error triggering agent ${agentId}:`, err);
          }
        };

        // Fire once immediately in the background for quick testing feedback
        setTimeout(triggerFn, 500);

        // Setup the interval timer
        globalForIntervals.cronIntervals[agentId] = setInterval(triggerFn, intervalMs);
      }
    }

    return NextResponse.json({ success: true, active: !!active, intervalMinutes });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
