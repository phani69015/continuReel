import { ReelData } from "./scraper";

export interface ContextWindow {
  before: ReelData[];
  target: ReelData;
  after: ReelData[];
  totalReels: number;
  targetPosition: number;
}

/**
 * Given a list of reels and the target index, builds a context window
 * of ±N reels around the target.
 */
export function buildContextWindow(
  reels: ReelData[],
  targetIndex: number,
  windowSize: number = 10
): ContextWindow | null {
  if (targetIndex < 0 || targetIndex >= reels.length) {
    return null;
  }

  const target = reels[targetIndex];

  // Slice before (up to windowSize items before the target)
  const startBefore = Math.max(0, targetIndex - windowSize);
  const before = reels.slice(startBefore, targetIndex);

  // Slice after (up to windowSize items after the target)
  const endAfter = Math.min(reels.length, targetIndex + windowSize + 1);
  const after = reels.slice(targetIndex + 1, endAfter);

  return {
    before,
    target,
    after,
    totalReels: reels.length,
    targetPosition: targetIndex,
  };
}
