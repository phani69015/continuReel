"use client";

import { useState, useRef, useEffect } from "react";
import { ReelCard } from "@/components/ReelCard";
import { ReelPlayer } from "@/components/ReelPlayer";

interface ReelData {
  id: string;
  code?: string;
  url: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  caption?: string;
  timestamp?: number;
}

interface ContextWindow {
  before: ReelData[];
  target: ReelData;
  after: ReelData[];
  totalReels: number;
  targetPosition: number;
}

interface ApiResponse {
  success?: boolean;
  error?: string;
  warning?: string;
  username?: string;
  contextWindow?: ContextWindow | null;
  reels?: ReelData[];
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [windowSize, setWindowSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [result, setResult] = useState<ContextWindow | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [playerStartIndex, setPlayerStartIndex] = useState(0);
  const targetRef = useRef<HTMLDivElement>(null);

  // Load URL from localStorage on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem("continuReel_url");
    if (savedUrl) setUrl(savedUrl);
  }, []);

  // Save URL to localStorage whenever it changes
  useEffect(() => {
    if (url.trim()) {
      localStorage.setItem("continuReel_url", url);
    }
  }, [url]);

  function clearUrl() {
    setUrl("");
    setResult(null);
    setUsername(null);
    setError(null);
    setWarning(null);
    localStorage.removeItem("continuReel_url");
  }

  // Scroll to target reel when results load
  useEffect(() => {
    if (result && targetRef.current) {
      targetRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [result]);

  // Build flat list of reels for the player
  function getAllReels() {
    if (!result) return [];
    return [
      ...result.before.map((r) => ({ ...r, isTarget: false })),
      { ...result.target, isTarget: true },
      ...result.after.map((r) => ({ ...r, isTarget: false })),
    ];
  }

  function openPlayer(index: number) {
    setPlayerStartIndex(index);
    setPlayerOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setWarning(null);
    setResult(null);
    setUsername(null);
    setLoading(true);

    try {
      const response = await fetch("/api/reels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, windowSize }),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok || data.error) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      if (data.warning) {
        setWarning(data.warning);
      }

      if (data.username) {
        setUsername(data.username);
      }

      if (data.contextWindow) {
        setResult(data.contextWindow);
      }
    } catch (err) {
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("Could not connect to the server. Please check your connection.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800 safe-top">
        <div className="max-w-2xl mx-auto px-4 py-3 sm:py-4">
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
            ContinuReel
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Reconstruct context around any Instagram reel
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 sm:py-8">
        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste Instagram reel link..."
                className="w-full px-4 py-3.5 pr-12 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-base placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                disabled={loading}
                required
              />
              {url && (
                <button
                  type="button"
                  onClick={clearUrl}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 active:bg-zinc-400 transition-colors"
                >
                  <svg className="w-4 h-4 text-zinc-600 dark:text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <select
              value={windowSize}
              onChange={(e) => setWindowSize(Number(e.target.value))}
              disabled={loading}
              className="px-4 py-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            >
              <option value={10}>±10 reels</option>
              <option value={20}>±20 reels</option>
              <option value={25}>±25 reels</option>
            </select>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="w-full px-6 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 disabled:bg-zinc-400 text-white font-semibold text-base transition-colors"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Processing...
                </span>
              ) : (
                "Find Context"
              )}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-500 mt-0.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600 dark:hover:text-red-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <button
              onClick={handleSubmit as unknown as () => void}
              className="mt-3 px-4 py-1.5 text-sm rounded-lg bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Warning Message */}
        {warning && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-amber-500 mt-0.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <p className="flex-1 text-sm text-amber-700 dark:text-amber-300">{warning}</p>
              <button
                onClick={() => setWarning(null)}
                className="text-amber-400 hover:text-amber-600 dark:hover:text-amber-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            <p className="text-zinc-500 dark:text-zinc-400 text-center">
              Scraping reel context... This may take 15-30 seconds.
            </p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Info bar */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  Creator:{" "}
                </span>
                <a
                  href={`https://www.instagram.com/${username}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-purple-600 dark:text-purple-400 hover:underline"
                >
                  @{username}
                </a>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {result.before.length + 1 + result.after.length} reels
                </span>
                <button
                  onClick={() => openPlayer(result.before.length)}
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Play
                </button>
              </div>
            </div>

            {/* Reel List */}
            <div className="flex flex-col gap-3">
              {/* Before reels */}
              {result.before.map((reel, idx) => (
                <div key={reel.id} onClick={() => openPlayer(idx)} className="cursor-pointer">
                  <ReelCard
                    id={reel.id}
                    url={reel.url}
                    thumbnailUrl={reel.thumbnailUrl}
                    position={idx - result.before.length}
                    isTarget={false}
                  />
                </div>
              ))}

              {/* Target reel */}
              <div
                ref={targetRef}
                onClick={() => openPlayer(result.before.length)}
                className="cursor-pointer"
              >
                <ReelCard
                  id={result.target.id}
                  url={result.target.url}
                  thumbnailUrl={result.target.thumbnailUrl}
                  position={0}
                  isTarget={true}
                />
              </div>

              {/* After reels */}
              {result.after.map((reel, idx) => (
                <div
                  key={reel.id}
                  onClick={() => openPlayer(result.before.length + 1 + idx)}
                  className="cursor-pointer"
                >
                  <ReelCard
                    id={reel.id}
                    url={reel.url}
                    thumbnailUrl={reel.thumbnailUrl}
                    position={idx + 1}
                    isTarget={false}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !result && !error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 mb-6 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-purple-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 4V2m0 2a2 2 0 012 2v1a2 2 0 01-2 2 2 2 0 01-2-2V6a2 2 0 012-2zm0 10v2m0-2a2 2 0 01-2-2v-1a2 2 0 012-2 2 2 0 012 2v1a2 2 0 01-2 2zM17 4v2m0-2a2 2 0 00-2 2v1a2 2 0 002 2 2 2 0 002-2V6a2 2 0 00-2-2zm0 10v2m0-2a2 2 0 002-2v-1a2 2 0 00-2-2 2 2 0 00-2 2v1a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
              Paste a reel link to get started
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-md">
              We&apos;ll find the surrounding reels from the same creator, giving
              you context about what came before and after.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-4">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-zinc-400">
          ContinuReel - Context reconstruction for short-form content
        </div>
      </footer>

      {/* Full-screen Reel Player */}
      {playerOpen && result && username && (
        <ReelPlayer
          reels={getAllReels()}
          startIndex={playerStartIndex}
          username={username}
          onClose={() => setPlayerOpen(false)}
        />
      )}
    </div>
  );
}
