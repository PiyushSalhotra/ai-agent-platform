import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.LOOPS_API_KEY;

  if (!apiKey || apiKey === "loops_api_key_placeholder" || apiKey === "mock") {
    try {
      const body = await req.json();
      const email = body.email || "";
      const score = body.score || "B/C";
      const company = body.company || {};
      const companyName = company.name || "Individual / Freelancer";

      console.log("\n==================================================");
      console.log("[MOCK EMAIL NURTURE NODE] ✉️ Loops API Key is not configured or set to 'mock'. Returning mock subscription:");
      console.log(`Contact Email: ${email}`);
      console.log(`Company:       ${companyName}`);
      console.log("==================================================\n");

      return NextResponse.json({
        success: true,
        platform: "Loops.so (Mocked)",
        status: "Contact Subscribed (Mocked)",
        email,
        campaignId: "camp_onboarding_drip_v2",
        tags: ["lead-qualification", `score-${score.toLowerCase()}`],
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      return NextResponse.json(
        { error: "Failed to add mock contact to Loops", details: err.message },
        { status: 500 }
      );
    }
  }

  try {
    const body = await req.json();
    const email = body.email || "";
    const score = body.score || "B/C";
    const company = body.company || {};
    const companyName = company.name || "Individual / Freelancer";

    // Loops contact payload
    const contactPayload = {
      email: email,
      company: companyName,
      source: "Lead Scoring Agent",
      subscribed: true,
      userGroup: "Prospects",
      // Custom user properties can be sent if created in Loops setting dashboard
      firstName: email.split("@")[0]
    };

    const response = await fetch("https://ooh.loops.so/api/v1/contacts/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(contactPayload)
    });

    if (!response.ok) {
      const errDetails = await response.text();
      throw new Error(`Loops API responded with status ${response.status}: ${errDetails}`);
    }

    const data = await response.json();

    console.log("\n==================================================");
    console.log("[REAL EMAIL NURTURE NODE] ✉️ Loops Contact Added Live:");
    console.log(`Contact Email: ${email}`);
    console.log(`Loops DB Status: ${data.message || "Contact Created"}`);
    console.log("==================================================\n");

    return NextResponse.json({
      success: true,
      platform: "Loops.so",
      status: "Contact Subscribed",
      email,
      campaignId: "camp_onboarding_drip_v2",
      tags: ["lead-qualification", `score-${score.toLowerCase()}`],
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("[Loops API Error]:", err);
    return NextResponse.json(
      { error: "Failed to add contact to Loops", details: err.message },
      { status: 500 }
    );
  }
}
