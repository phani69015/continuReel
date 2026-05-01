export interface ReelData {
  id: string;
  code: string;
  url: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  caption?: string;
  timestamp?: number;
}

export interface ScrapeResult {
  username: string;
  reels: ReelData[];
  targetIndex: number;
}

const INSTAGRAM_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
};

/**
 * Fetches the reel page HTML and extracts username, userId, and cookies.
 */
async function fetchReelPageData(reelId: string): Promise<{
  username: string;
  userId: string;
  csrfToken: string;
  cookies: string;
} | null> {
  const reelUrl = `https://www.instagram.com/reel/${reelId}/`;

  const response = await fetch(reelUrl, {
    headers: INSTAGRAM_HEADERS,
    redirect: "follow",
  });

  if (!response.ok) {
    return null;
  }

  // Extract cookies from response headers
  const setCookieHeaders = response.headers.getSetCookie?.() || [];
  const cookieMap: Record<string, string> = {};
  for (const header of setCookieHeaders) {
    const match = header.match(/^([^=]+)=([^;]*)/);
    if (match) {
      cookieMap[match[1]] = match[2];
    }
  }

  const csrfToken = cookieMap["csrftoken"] || "";
  const cookieString = Object.entries(cookieMap)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");

  const html = await response.text();

  // Extract username from og:url meta tag
  const ogUrlMatch = html.match(
    /property="og:url"\s+content="https?:\/\/www\.instagram\.com\/([^/]+)\//
  );
  // Also try the reverse attribute order
  const ogUrlMatch2 = html.match(
    /content="https?:\/\/www\.instagram\.com\/([^/]+)\/[^"]*"\s+property="og:url"/
  );

  let username: string | null = null;
  const excluded = ["reel", "reels", "p", "explore"];

  if (ogUrlMatch && !excluded.includes(ogUrlMatch[1])) {
    username = ogUrlMatch[1];
  } else if (ogUrlMatch2 && !excluded.includes(ogUrlMatch2[1])) {
    username = ogUrlMatch2[1];
  }

  if (!username) {
    // Fallback: look for "username":"<value>" pattern
    const usernameMatch = html.match(/"username":"([^"]+)"/);
    if (usernameMatch) {
      username = usernameMatch[1];
    }
  }

  if (!username) {
    return null;
  }

  // Extract userId from owner pattern
  const ownerMatch = html.match(/"owner":\{[^}]*"id":"(\d+)"/);
  const userIdMatch = html.match(/"user_id":"(\d+)"/);
  const userId = ownerMatch?.[1] || userIdMatch?.[1] || null;

  if (!userId) {
    return null;
  }

  return { username, userId, csrfToken, cookies: cookieString };
}

/**
 * Fetches user's reels using Instagram's internal API with plain fetch.
 */
async function fetchReelsViaApi(
  userId: string,
  targetCode: string,
  csrfToken: string,
  cookies: string
): Promise<{ reels: ReelData[]; targetIndex: number }> {
  let allReels: ReelData[] = [];
  let maxId = "";
  let hasMore = true;
  let pageNum = 0;
  const maxPages = 25;

  while (hasMore && pageNum < maxPages) {
    const response = await fetch(
      "https://www.instagram.com/api/v1/clips/user/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-CSRFToken": csrfToken,
          "X-IG-App-ID": "936619743392459",
          "X-Requested-With": "XMLHttpRequest",
          "User-Agent": INSTAGRAM_HEADERS["User-Agent"],
          Cookie: cookies,
          Referer: "https://www.instagram.com/",
          Origin: "https://www.instagram.com",
        },
        body: `target_user_id=${userId}&page_size=50&max_id=${maxId}`,
      }
    );

    if (!response.ok) {
      break;
    }

    let data: {
      items?: {
        media: {
          pk: string;
          code: string;
          taken_at: number;
          caption?: { text: string };
          image_versions2?: {
            candidates?: { url: string; width: number; height: number }[];
          };
          video_versions?: { url: string }[];
        };
      }[];
      paging_info?: { more_available: boolean; max_id: string };
    };

    try {
      data = await response.json();
    } catch {
      break;
    }

    if (!data.items) {
      break;
    }

    const newReels: ReelData[] = data.items.map((item) => ({
      id: item.media.pk,
      code: item.media.code,
      url: `https://www.instagram.com/reel/${item.media.code}/`,
      thumbnailUrl: item.media.image_versions2?.candidates?.[0]?.url,
      videoUrl: item.media.video_versions?.[0]?.url,
      caption: item.media.caption?.text,
      timestamp: item.media.taken_at,
    }));

    allReels = allReels.concat(newReels);
    hasMore = data.paging_info?.more_available || false;
    maxId = data.paging_info?.max_id || "";
    pageNum++;

    // Check if target found with enough context
    const targetIdx = allReels.findIndex((r) => r.code === targetCode);
    if (targetIdx !== -1) {
      const hasEnoughAfter = allReels.length - targetIdx > 25;
      if (hasEnoughAfter || !hasMore) {
        return { reels: allReels, targetIndex: targetIdx };
      }
    }
  }

  const targetIndex = allReels.findIndex((r) => r.code === targetCode);
  return { reels: allReels, targetIndex };
}

/**
 * Main scraping function using plain fetch (no Playwright).
 */
export async function scrapeReelContext(reelId: string): Promise<ScrapeResult> {
  // Step 1: Fetch reel page to get username, userId, cookies
  const pageData = await fetchReelPageData(reelId);
  if (!pageData) {
    throw new Error(
      "Could not load this reel. It may be private, deleted, or Instagram is blocking the request."
    );
  }

  // Step 2: Fetch reels via internal API
  const { reels, targetIndex } = await fetchReelsViaApi(
    pageData.userId,
    reelId,
    pageData.csrfToken,
    pageData.cookies
  );

  return {
    username: pageData.username,
    reels,
    targetIndex,
  };
}
