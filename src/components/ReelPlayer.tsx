"use client";

import { useRef, useEffect, useState, useCallback } from "react";

interface ReelPlayerItem {
  id: string;
  code?: string;
  url: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  caption?: string;
  isTarget?: boolean;
}

interface ReelPlayerProps {
  reels: ReelPlayerItem[];
  startIndex: number;
  username: string;
  onClose: () => void;
}

export function ReelPlayer({
  reels,
  startIndex,
  username,
  onClose,
}: ReelPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [muted, setMuted] = useState(true);
  const [showCaption, setShowCaption] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Play the visible video, pause all others
  const handleVisibility = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        const index = Number(entry.target.getAttribute("data-index"));
        const video = videoRefs.current[index];

        if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
          setCurrentIndex(index);
          if (video) {
            video.play().catch(() => {});
          }
        } else {
          if (video) {
            video.pause();
          }
        }
      });
    },
    []
  );

  // Set up intersection observer
  useEffect(() => {
    observerRef.current = new IntersectionObserver(handleVisibility, {
      root: containerRef.current,
      threshold: 0.6,
    });

    const container = containerRef.current;
    if (container) {
      const items = container.querySelectorAll("[data-reel-item]");
      items.forEach((item) => observerRef.current?.observe(item));
    }

    return () => observerRef.current?.disconnect();
  }, [handleVisibility, reels]);

  // Scroll to start index on mount
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      const targetEl = container.children[startIndex] as HTMLElement;
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "instant", block: "start" });
      }
    }
    // Prevent body scroll when player is open
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [startIndex]);

  // Sync muted state across all videos
  useEffect(() => {
    videoRefs.current.forEach((video) => {
      if (video) video.muted = muted;
    });
  }, [muted]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        goToReel(currentIndex + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        goToReel(currentIndex - 1);
      } else if (e.key === "m") {
        setMuted((m) => !m);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentIndex, onClose]);

  function goToReel(index: number) {
    if (index < 0 || index >= reels.length) return;
    const container = containerRef.current;
    if (container) {
      const targetEl = container.children[index] as HTMLElement;
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col safe-top">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 safe-top">
        <div className="flex items-center justify-between px-4 pt-3 pb-2 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-white text-sm font-semibold truncate">
              @{username}
            </span>
            <span className="text-white/50 text-xs shrink-0">
              {currentIndex + 1}/{reels.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 active:bg-white/30 transition-colors"
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Reel container - vertical snap scroll */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{ height: "100dvh" }}
      >
        {reels.map((reel, index) => (
          <div
            key={reel.id}
            data-reel-item
            data-index={index}
            className="relative snap-start snap-always flex items-center justify-center"
            style={{ height: "100dvh" }}
          >
            {/* Video */}
            {reel.videoUrl ? (
              <video
                ref={(el) => {
                  videoRefs.current[index] = el;
                }}
                src={reel.videoUrl}
                poster={reel.thumbnailUrl}
                className="h-full w-full object-contain bg-black"
                loop
                muted={muted}
                playsInline
                preload={
                  Math.abs(index - currentIndex) <= 1 ? "auto" : "none"
                }
                onClick={(e) => {
                  const video = e.currentTarget;
                  if (video.paused) {
                    video.play().catch(() => {});
                  } else {
                    video.pause();
                  }
                }}
              />
            ) : reel.thumbnailUrl ? (
              <img
                src={reel.thumbnailUrl}
                alt=""
                className="h-full w-full object-contain bg-black"
              />
            ) : (
              <div className="h-full w-full bg-zinc-900 flex items-center justify-center">
                <p className="text-zinc-500 text-sm">No video available</p>
              </div>
            )}

            {/* Target indicator */}
            {reel.isTarget && (
              <div className="absolute top-20 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-purple-500/90 text-white text-sm font-semibold shadow-lg">
                Shared Reel
              </div>
            )}

            {/* Bottom overlay */}
            <div className="absolute bottom-0 left-0 right-0 safe-bottom">
              <div className="px-4 pb-6 pt-16 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                {/* Caption */}
                {reel.caption && (
                  <div
                    className="mb-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCaption(!showCaption);
                    }}
                  >
                    <p
                      className={`text-white text-sm ${
                        showCaption ? "" : "line-clamp-2"
                      }`}
                    >
                      {reel.caption}
                    </p>
                    {reel.caption.length > 80 && (
                      <span className="text-white/50 text-xs">
                        {showCaption ? "Show less" : "More..."}
                      </span>
                    )}
                  </div>
                )}

                <a
                  href={reel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 text-xs active:text-white/90"
                >
                  Open on Instagram
                </a>
              </div>
            </div>

            {/* Side controls */}
            <div className="absolute right-3 bottom-32 flex flex-col gap-4 safe-bottom">
              {/* Mute/unmute */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMuted(!muted);
                }}
                className="w-11 h-11 flex items-center justify-center rounded-full bg-black/40 active:bg-black/60 backdrop-blur-sm transition-colors"
              >
                {muted ? (
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.536 8.464a5 5 0 010 7.072M12 6l-4 4H4v4h4l4 4V6z"
                    />
                  </svg>
                )}
              </button>

              {/* Nav up */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToReel(currentIndex - 1);
                }}
                disabled={currentIndex === 0}
                className="w-11 h-11 flex items-center justify-center rounded-full bg-black/40 active:bg-black/60 backdrop-blur-sm disabled:opacity-30 transition-colors"
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              </button>

              {/* Nav down */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToReel(currentIndex + 1);
                }}
                disabled={currentIndex === reels.length - 1}
                className="w-11 h-11 flex items-center justify-center rounded-full bg-black/40 active:bg-black/60 backdrop-blur-sm disabled:opacity-30 transition-colors"
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
