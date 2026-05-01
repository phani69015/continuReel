import { NextRequest, NextResponse } from "next/server";
import { parseReelUrl } from "@/lib/parse-reel-url";
import { scrapeReelContext } from "@/lib/scraper";
import { buildContextWindow } from "@/lib/context-builder";
import { getCachedResult, setCachedResult } from "@/lib/cache";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, windowSize: rawWindowSize } = body;

    // Validate and clamp windowSize
    const windowSize = Math.min(25, Math.max(1, Number(rawWindowSize) || 10));

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Please provide a valid Instagram reel URL." },
        { status: 400 }
      );
    }

    // Parse the URL
    const parsed = parseReelUrl(url);
    if (!parsed) {
      return NextResponse.json(
        {
          error:
            "Invalid URL format. Please provide a link like: https://www.instagram.com/reel/ABC123/",
        },
        { status: 400 }
      );
    }

    // Check cache first
    const cached = await getCachedResult(parsed.reelId, windowSize);
    if (cached) {
      const data = typeof cached === "string" ? JSON.parse(cached) : cached;
      return NextResponse.json({ ...data, fromCache: true });
    }

    // Scrape context
    const scrapeResult = await scrapeReelContext(parsed.reelId);

    if (scrapeResult.targetIndex === -1) {
      const responseData = {
        success: true,
        warning:
          "We found the creator but couldn't locate this specific reel in their grid. It may have been deleted or is very old.",
        username: scrapeResult.username,
        reels: scrapeResult.reels,
        contextWindow: null,
      };
      // Don't cache failures — might work on retry
      return NextResponse.json(responseData);
    }

    // Build context window
    const contextWindow = buildContextWindow(
      scrapeResult.reels,
      scrapeResult.targetIndex,
      windowSize
    );

    const responseData = {
      success: true,
      username: scrapeResult.username,
      contextWindow,
    };

    // Cache successful result
    await setCachedResult(parsed.reelId, windowSize, responseData);

    return NextResponse.json(responseData);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";

    let userMessage = message;
    if (message.includes("Could not load this reel")) {
      userMessage =
        "Couldn't load this reel. It may be private, deleted, or Instagram is blocking the request. Try again in a moment.";
    } else if (message.includes("timeout") || message.includes("Timeout")) {
      userMessage =
        "The request timed out. Instagram may be slow right now. Please try again.";
    } else if (message.includes("net::") || message.includes("ECONNREFUSED")) {
      userMessage =
        "Network error while connecting to Instagram. Check your connection and try again.";
    }

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
