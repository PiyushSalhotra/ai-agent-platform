import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email") || "";
  return handleEnrichment(email);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email || "";
    return handleEnrichment(email);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Invalid JSON body", details: err.message },
      { status: 400 }
    );
  }
}

async function handleEnrichment(email: string) {
  const apiKey = process.env.HUNTER_API_KEY;

  if (!apiKey || apiKey === "hunter_api_key_placeholder") {
    return NextResponse.json(
      { 
        error: "Hunter.io API key is not configured.", 
        help: "Please add HUNTER_API_KEY to your .env.local file with a valid key from hunter.io."
      },
      { status: 500 }
    );
  }

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Invalid or missing email parameter" },
      { status: 400 }
    );
  }

  const domain = email.split("@")[1].toLowerCase();
  
  // Exclude common personal email domains
  const isPersonal = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "aol.com"].includes(domain);

  if (isPersonal) {
    return NextResponse.json({
      success: true,
      email,
      domain,
      company: {
        name: "Individual / Freelancer",
        size: 1,
        funding: "$0",
        industry: "Consumer Goods / Services",
        isPersonalEmail: true
      }
    });
  }

  try {
    const hunterUrl = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${apiKey}`;
    const response = await fetch(hunterUrl);
    
    if (!response.ok) {
      const errDetails = await response.text();
      throw new Error(`Hunter API responded with status ${response.status}: ${errDetails}`);
    }

    const data = await response.json();
    const org = data.data || {};

    console.log("\n==================================================");
    console.log(`[REAL ENRICHMENT API] 🔍 Enriched lead: ${email}`);
    console.log(`Company: ${org.organization || domain} | Industry: ${org.industry || "N/A"}`);
    console.log("==================================================\n");

    return NextResponse.json({
      success: true,
      email,
      domain,
      company: {
        name: org.organization || domain.split(".")[0],
        size: org.emails?.length * 5 || 10, // Hunter returns a list of emails; we can estimate size from it or set a baseline
        funding: "Seed/Growth", // Hunter doesn't output funding; we default it or look it up
        industry: org.industry || "Software & Technology",
        country: org.country || "United States",
        isPersonalEmail: false
      }
    });
  } catch (error: any) {
    console.error("[Enrichment API Error]:", error);
    return NextResponse.json(
      { error: "Failed to enrich email via Hunter.io API", details: error.message },
      { status: 500 }
    );
  }
}
