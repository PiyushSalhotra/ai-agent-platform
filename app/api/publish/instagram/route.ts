import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const caption = searchParams.get("caption") || "";
  // Instagram requires a publicly accessible image URL to publish a feed post.
  // We use a beautiful, live tech-abstract background image as a default fallback.
  const imageUrl = searchParams.get("imageUrl") || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80";
  const IG_USER_ID = process.env.INSTAGRAM_USER_ID; 
  const FB_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN; 

  // Sandbox Mock Mode if credentials are not set
  if (!IG_USER_ID || !FB_ACCESS_TOKEN) {
    console.log("[Instagram publisher] Running in SANDBOX MOCK MODE (Credentials missing).");
    console.log(`[Instagram publisher] Simulated publication:`);
    console.log(`  - Caption: "${caption}"`);
    console.log(`  - Image URL: "${imageUrl}"`);
    
    // Simulate standard network latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    const mockPostId = `mock_ig_post_${Math.floor(Math.random() * 1000000000)}`;
    console.log(`[Instagram publisher] Post successfully published (MOCK)! ID: ${mockPostId}`);
    return NextResponse.json({ 
      success: true, 
      postId: mockPostId,
      mock: true,
      message: "Running in Sandbox Mode. Configure environment variables to connect to a real account."
    });
  }

  try {
    // Step 1: Create an Instagram Media Container
    const containerRes = await fetch(
      `https://graph.facebook.com/v19.0/${IG_USER_ID}/media?image_url=${encodeURIComponent(imageUrl)}&caption=${encodeURIComponent(caption)}&access_token=${FB_ACCESS_TOKEN}`,
      { method: "POST" }
    );
    const containerData = await containerRes.json();
    if (!containerData.id) {
      throw new Error(containerData.error?.message || "Failed to create media container");
    }

    // Step 2: Publish the Media Container to the feed
    const publishRes = await fetch(
      `https://graph.facebook.com/v19.0/${IG_USER_ID}/media_publish?creation_id=${containerData.id}&access_token=${FB_ACCESS_TOKEN}`,
      { method: "POST" }
    );
    const publishData = await publishRes.json();
    if (publishData.error) {
      throw new Error(publishData.error.message);
    }

    console.log(`[Instagram publisher] Post successfully published! ID: ${publishData.id}`);
    return NextResponse.json({ success: true, postId: publishData.id });
  } catch (error: any) {
    console.error("[Instagram publisher] Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
