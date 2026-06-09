import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl || webhookUrl === "slack_webhook_url_placeholder" || webhookUrl === "mock") {
    try {
      const body = await req.json();
      const email = body.email || "";
      const company = body.company || {};
      const score = body.score || "A";
      
      const companyName = company.name || "Unknown Company";
      const companySize = company.size || "Unknown";
      const funding = company.funding || "N/A";
      const industry = company.industry || "Unknown";

      const slackMessage = `🚨 *New High-Value Lead Signed Up!* 🚨\n\n` +
        `• *Email:* \`${email}\`\n` +
        `• *Company:* *${companyName}*\n` +
        `• *Size:* \`${companySize} employees\`\n` +
        `• *Funding:* \`${funding}\`\n` +
        `• *Industry:* \`${industry}\`\n` +
        `• *Lead Score:* ⭐️ *Score ${score}* (High ICP Match)\n\n` +
        `👉 *HubSpot Deal created automatically.* Follow up immediately!`;

      console.log("\n==================== MOCK SLACK NOTIFICATION ====================");
      console.log(`[MOCK SLACK API] Slack Webhook URL is not configured or set to 'mock'. Alert printed to console:`);
      console.log(slackMessage);
      console.log("============================================================\n");

      return NextResponse.json({
        success: true,
        platform: "Slack (Mocked)",
        status: "Message Sent (Console)",
        deliveredMessage: slackMessage,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      return NextResponse.json(
        { error: "Failed to send mock Slack alert", details: err.message },
        { status: 500 }
      );
    }
  }

  try {
    const body = await req.json();
    const email = body.email || "";
    const company = body.company || {};
    const score = body.score || "A";
    
    const companyName = company.name || "Unknown Company";
    const companySize = company.size || "Unknown";
    const funding = company.funding || "N/A";
    const industry = company.industry || "Unknown";

    const slackMessage = `🚨 *New High-Value Lead Signed Up!* 🚨\n\n` +
      `• *Email:* \`${email}\`\n` +
      `• *Company:* *${companyName}*\n` +
      `• *Size:* \`${companySize} employees\`\n` +
      `• *Funding:* \`${funding}\`\n` +
      `• *Industry:* \`${industry}\`\n` +
      `• *Lead Score:* ⭐️ *Score ${score}* (High ICP Match)\n\n` +
      `👉 *HubSpot Deal created automatically.* Follow up immediately!`;

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: slackMessage })
    });

    if (!response.ok) {
      const errDetails = await response.text();
      throw new Error(`Slack webhook responded with status ${response.status}: ${errDetails}`);
    }

    console.log("\n==================== SLACK NOTIFICATION ====================");
    console.log(`[REAL SLACK API] Alert sent to live Slack channel.`);
    console.log("============================================================\n");

    return NextResponse.json({
      success: true,
      platform: "Slack",
      status: "Message Sent",
      deliveredMessage: slackMessage,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("[Slack API Error]:", err);
    return NextResponse.json(
      { error: "Failed to send Slack alert", details: err.message },
      { status: 500 }
    );
  }
}
