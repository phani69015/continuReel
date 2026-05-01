"use client";

interface ReelCardProps {
  id: string;
  url: string;
  thumbnailUrl?: string;
  isTarget?: boolean;
  position: number;
}

export function ReelCard({
  url,
  isTarget,
  position,
}: ReelCardProps) {
  const label =
    position === 0
      ? "Shared Reel"
      : position > 0
      ? `Reel +${position}`
      : `Reel ${position}`;

  return (
    <div
      className={`group relative w-full rounded-2xl overflow-hidden transition-all hover:scale-[1.03] ${
        isTarget
          ? "bg-purple-600 shadow-xl shadow-purple-500/30"
          : "bg-zinc-800 hover:bg-zinc-700"
      }`}
    >
      <div className="flex items-center justify-between px-5 py-6">
        {/* Left: reel label */}
        <div className="flex items-center gap-3">
          {/* Play circle icon */}
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
              isTarget ? "bg-white/20" : "bg-white/10 group-hover:bg-white/20"
            } transition-colors`}
          >
            <svg
              className="w-6 h-6 text-white ml-0.5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>

          {/* Label */}
          <div>
            <p className={`text-lg font-bold text-white`}>
              {label}
            </p>
            {isTarget && (
              <p className="text-sm text-purple-200">This is the reel you shared</p>
            )}
          </div>
        </div>

        {/* Right: arrow or open link */}
        <div className="flex items-center gap-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            title="Open on Instagram"
          >
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
          <div className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
