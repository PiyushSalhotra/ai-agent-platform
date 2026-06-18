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

  if (!apiKey || apiKey === "hunter_api_key_placeholder" || apiKey === "mock") {
    console.log("\n==================================================");
    console.log(`[MOCK ENRICHMENT API] 🔍 Hunter API key is not configured or set to 'mock'. Returning mock data.`);
    console.log(`Email to enrich: ${email}`);
    console.log("==================================================\n");

    const domain = email.includes("@") ? email.split("@")[1].toLowerCase() : "unknown.com";
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

    // Mock high-quality B2B profiles
    const mockCompanies: Record<string, any> = {
      "stripe.com": { name: "Stripe", size: 8500, funding: "$2.2B", industry: "Financial Technology", country: "United States" },
      "vercel.com": { name: "Vercel", size: 450, funding: "$313M", industry: "Cloud Infrastructure", country: "United States" },
      "openai.com": { name: "OpenAI", size: 1000, funding: "$13B", industry: "Artificial Intelligence", country: "United States" },
      "google.com": { name: "Google", size: 180000, funding: "IPO", industry: "Technology", country: "United States" },
    };

    const companyData = mockCompanies[domain] || {
      name: domain.split(".")[0].charAt(0).toUpperCase() + domain.split(".")[0].slice(1),
      size: Math.floor(Math.random() * 480) + 20, // 20 to 500 employees
      funding: `$${Math.floor(Math.random() * 50) + 1}M`,
      industry: "Software & Technology",
      country: "United States"
    };

    return NextResponse.json({
      success: true,
      email,
      domain,
      company: {
        ...companyData,
        isPersonalEmail: false
      }
    });
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

    // Known company sizes — Hunter.io free tier only returns ~10 emails
    // so email count * 5 is wildly inaccurate for large companies
    const knownSizes: Record<string, number> = {
      "google.com": 180000,
      "microsoft.com": 220000,
      "apple.com": 164000,
      "amazon.com": 1500000,
      "meta.com": 70000,
      "facebook.com": 70000,
      "stripe.com": 8500,
      "shopify.com": 12000,
      "vercel.com": 450,
      "openai.com": 1700,
      "netflix.com": 13000,
      "airbnb.com": 6000,
      "uber.com": 30000,
      "twitter.com": 1500,
      "x.com": 1500,
      "salesforce.com": 70000,
      "hubspot.com": 7000,
    };

    const estimatedSize = knownSizes[domain]
      || (org.emails?.length ? org.emails.length * 5 : 10);

    return NextResponse.json({
      success: true,
      email,
      domain,
      company: {
        name: org.organization || domain.split(".")[0],
        size: estimatedSize,
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
