import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;

  if (!token || token === "hubspot_access_token_placeholder" || token === "mock") {
    try {
      const body = await req.json();
      const email = body.email || "";
      const company = body.company || {};
      const score = body.score || "A";
      
      const companyName = company.name || "Unknown Company";
      const dealName = `${companyName} - Enterprise Contract (Auto-Scored)`;
      const dealValue = company.size ? Math.min(120000, company.size * 120) : 10000;

      console.log("\n==================================================");
      console.log("[MOCK CRM HUBSPOT NODE] 💼 HubSpot Access Token is not configured or set to 'mock'. Returning mock deal:");
      console.log(`Deal Name:   ${dealName}`);
      console.log(`Mock Deal ID: mock_deal_${Math.floor(Math.random() * 1000000)}`);
      console.log("==================================================\n");

      return NextResponse.json({
        success: true,
        crm: "HubSpot (Mocked)",
        status: "Deal Created (Mocked)",
        dealId: `mock_deal_${Math.floor(Math.random() * 1000000)}`,
        dealName,
        value: dealValue,
        pipelineStage: "Qualified Lead (Score A)",
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      return NextResponse.json(
        { error: "Failed to create mock HubSpot Deal", details: err.message },
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
    const dealName = `${companyName} - Enterprise Contract (Auto-Scored)`;
    const dealValue = company.size ? Math.min(120000, company.size * 120) : 10000;

    // HubSpot Deal Creation API payload
    const dealPayload = {
      properties: {
        dealname: dealName,
        amount: String(dealValue),
        dealstage: "appointmentscheduled", // Default starter deal stage in HubSpot
        pipeline: "default",
        description: `Lead Email: ${email}\nICP Qualification Score: ${score}\nCompany Size: ${company.size || "Unknown"}\nIndustry: ${company.industry || "Unknown"}`
      }
    };

    const response = await fetch("https://api.hubapi.com/crm/v3/objects/deals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(dealPayload)
    });

    if (!response.ok) {
      const errDetails = await response.text();
      throw new Error(`HubSpot API responded with status ${response.status}: ${errDetails}`);
    }

    const data = await response.json();

    console.log("\n==================================================");
    console.log("[REAL CRM HUBSPOT NODE] 💼 HubSpot Deal Created Live:");
    console.log(`Deal Name:  ${dealName}`);
    console.log(`Live Deal ID: ${data.id}`);
    console.log("==================================================\n");

    return NextResponse.json({
      success: true,
      crm: "HubSpot",
      status: "Deal Created",
      dealId: data.id,
      dealName,
      value: dealValue,
      pipelineStage: "Qualified Lead (Score A)",
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("[HubSpot API Error]:", err);
    return NextResponse.json(
      { error: "Failed to create HubSpot Deal", details: err.message },
      { status: 500 }
    );
  }
}
