/**
 * Parses an Instagram reel URL and extracts the reel ID.
 * Supports formats:
 *   - https://www.instagram.com/reel/<id>/
 *   - https://www.instagram.com/reels/<id>/
 *   - https://instagram.com/reel/<id>/
 *   - https://www.instagram.com/p/<id>/ (posts that are reels)
 */
export interface ParsedReelUrl {
  reelId: string;
}

export function parseReelUrl(url: string): ParsedReelUrl | null {
  try {
    const parsed = new URL(url.trim());

    if (
      !parsed.hostname.includes("instagram.com")
    ) {
      return null;
    }

    // Match /reel/<id> or /reels/<id> or /p/<id>
    const match = parsed.pathname.match(
      /^\/(reel|reels|p)\/([A-Za-z0-9_-]+)/
    );

    if (!match) {
      return null;
    }

    return {
      reelId: match[2],
    };
  } catch {
    return null;
  }
}
