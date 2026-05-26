import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text") || "";

  console.log("\n==================================================");
  console.log("[PUBLISHER SIMULATOR] 🚀 Simulated Social Media Post:");
  console.log(`Content: "${text}"`);
  console.log("==================================================\n");

  return NextResponse.json({
    success: true,
    platform: "LinkedIn / X (Twitter)",
    status: "Published",
    publishedContent: text,
    timestamp: new Date().toISOString()
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = body.text || body.message || body.content || "";

    console.log("\n==================================================");
    console.log("[PUBLISHER SIMULATOR] 🚀 Simulated Social Media Post (POST):");
    console.log(`Content: "${text}"`);
    console.log("==================================================\n");

    return NextResponse.json({
      success: true,
      platform: "LinkedIn / X (Twitter)",
      status: "Published",
      publishedContent: text,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Invalid JSON body", details: err.message },
      { status: 400 }
    );
  }
}
