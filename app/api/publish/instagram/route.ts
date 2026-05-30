import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const caption = searchParams.get("caption") || "";
  // Instagram requires a publicly accessible image URL to publish a feed post.
  // We use a pool of self-hosted images from our own Vercel domain as default fallbacks.
  // This guarantees Meta's crawler can always fetch it (Unsplash blocks Meta bots) and provides variety.
  const FALLBACK_IMAGES = [
    "https://ai-agent-platform-n48i.vercel.app/tech-bg.jpg",
    "https://ai-agent-platform-n48i.vercel.app/tech-bg-2.jpg",
    "https://ai-agent-platform-n48i.vercel.app/tech-bg-3.jpg",
    "https://ai-agent-platform-n48i.vercel.app/tech-bg-4.jpg"
  ];
  
  let imageUrl = searchParams.get("imageUrl") || "";
  const isPlaceholder = !imageUrl || 
                        imageUrl.includes("example.com") || 
                        imageUrl.includes("placeholder") || 
                        imageUrl.includes("unsplash.com") ||
                        !imageUrl.startsWith("http");
                        
  if (isPlaceholder) {
    imageUrl = FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
  }
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
    // Step 1: Create an Instagram Media Container using a POST body (handles long captions & special characters)
    const containerRes = await fetch(
      `https://graph.facebook.com/v19.0/${IG_USER_ID}/media`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          image_url: imageUrl,
          caption: caption,
          access_token: FB_ACCESS_TOKEN || "",
        }),
      }
    );
    const containerData = await containerRes.json();
    if (!containerData.id) {
      throw new Error(containerData.error?.message || "Failed to create media container");
    }

    // Step 2: Poll container status until it is FINISHED (required by Instagram for background processing)
    const containerId = containerData.id;
    let isReady = false;
    for (let i = 0; i < 8; i++) {
      // Wait 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const statusRes = await fetch(
        `https://graph.facebook.com/v19.0/${containerId}?fields=status_code&access_token=${FB_ACCESS_TOKEN}`
      );
      const statusData = await statusRes.json();
      console.log(`[Instagram publisher] Container ${containerId} status: ${statusData.status_code}`);

      if (statusData.status_code === "FINISHED") {
        isReady = true;
        break;
      }
      if (statusData.status_code === "ERROR") {
        throw new Error(statusData.error?.message || "Media container processing failed");
      }
    }

    if (!isReady) {
      throw new Error("Instagram timeout: Media container processing took too long.");
    }

    // Step 3: Publish the Media Container to the feed
    const publishRes = await fetch(
      `https://graph.facebook.com/v19.0/${IG_USER_ID}/media_publish`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          creation_id: containerId,
          access_token: FB_ACCESS_TOKEN || "",
        }),
      }
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
