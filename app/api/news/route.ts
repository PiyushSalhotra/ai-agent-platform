import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Fetch frontpage stories from Hacker News Algolia API (free, no auth key needed)
    const res = await fetch("https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=5", {
      next: { revalidate: 60 } // cache for 60 seconds
    });
    
    if (!res.ok) throw new Error("Failed to fetch from Hacker News");
    
    const data = await res.json();
    const news = data.hits.map((hit: any) => ({
      title: hit.title,
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      author: hit.author
    }));

    return NextResponse.json({ success: true, news });
  } catch (error: any) {
    console.error("[News API] Error fetching news, falling back to mock news:", error.message);
    
    // Fallback tech news articles
    return NextResponse.json({
      success: true,
      news: [
        {
          title: "Next.js 15 officially released with Compiler support and React 19 integration",
          url: "https://nextjs.org/blog/next-15"
        },
        {
          title: "Convex introduces direct background actions for serverless scheduling",
          url: "https://convex.dev"
        },
        {
          title: "OpenAI showcases next-generation agentic workflows using GPT models",
          url: "https://openai.com"
        }
      ]
    });
  }
}
