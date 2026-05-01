# ContinuReel

A context reconstruction engine for Instagram Reels. Paste any reel link and instantly see what came before and after it from the same creator.

## Problem

Short-form video is consumed linearly but discovered randomly. When you find a reel via a share link, you have no idea what the creator posted before or after it. ContinuReel fixes that gap.

## How It Works

```
Paste reel URL → Extract creator info → Fetch their reels via API → Show ±N reels around the target
```

1. User pastes an Instagram reel URL
2. Server fetches the reel page, extracts the creator's user ID
3. Paginates Instagram's internal clips API to find the target reel
4. Returns a context window (±10, ±20, or ±25 reels)
5. User can play all reels in a full-screen vertical player

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS 4
- **Caching:** Upstash Redis (optional, for production)
- **Scraping:** Plain `fetch` against Instagram's internal API (no Playwright, no browser)
- **Deployment:** Vercel-ready

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open http://localhost:3000

## Environment Variables

Create a `.env.local` file for caching (optional — app works without it):

```
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

Get these from [Upstash Console](https://console.upstash.com) (free tier: 10k requests/day).

## Deploy to Vercel

1. Push this repo to GitHub
2. Import at [vercel.com/new](https://vercel.com/new)
3. Add environment variables in project settings
4. Deploy

## Project Structure

```
src/
├── app/
│   ├── api/reels/route.ts    # POST endpoint - processes reel URLs
│   ├── page.tsx              # Main page - input form + reel list
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles + mobile utilities
├── components/
│   ├── ReelCard.tsx          # Reel list item component
│   ├── ReelPlayer.tsx        # Full-screen vertical video player
│   ├── ErrorBoundary.tsx     # React error boundary
│   └── Providers.tsx         # Client-side providers wrapper
└── lib/
    ├── scraper.ts            # Instagram data fetcher (plain fetch)
    ├── parse-reel-url.ts     # URL parser - extracts reel ID
    ├── context-builder.ts    # Slices ±N reels around target
    └── cache.ts              # Upstash Redis cache layer
```

## Performance

| Metric | Value |
|--------|-------|
| Response time (cache miss) | ~8 seconds |
| Response time (cache hit) | <100ms |
| Memory per request | ~5MB |
| Concurrent users (free tier) | ~50-100 |

## Limitations

- Relies on Instagram's internal API (undocumented, may change)
- Very old reels require more pagination (slower)
- Instagram may rate-limit at high volume from a single IP
- Vercel free tier has a 10s function timeout (most requests finish in 8s)
- Video URLs from Instagram expire after a few hours

## Roadmap

- [ ] Sequence detection (Part 1, Part 2, etc.)
- [ ] Smart recommendations ("Continue story")
- [ ] Mobile app (React Native with share intent)
- [ ] Proxy rotation for scale
