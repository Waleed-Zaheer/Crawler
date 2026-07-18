# Crawler

A polite web scraper with a dashboard, built to deploy on Vercel's free
(Hobby) tier. It crawls from a seed URL and pulls real content off every page
— images, videos, prices, phone numbers, emails — alongside per-page status,
title, and outbound-link counts, presented in a tabbed data explorer and a 3D
crawl graph.

## Stack

- **Crawl engine** (`api/_lib`) — TypeScript, `cheerio` for HTML parsing and
  content extraction, `robots-parser` for robots.txt/Crawl-delay compliance.
- **API** (`api/crawl.ts`) — a single Vercel serverless function. It runs the
  entire (bounded) crawl inside one invocation and returns every result as one
  JSON response. Serverless functions are request→response — holding a
  streaming/SSE connection open gets buffered or killed by the platform — so a
  single response is the reliable design. Bounded by `vercel.json`'s
  `maxDuration`.
- **Frontend** — React, TypeScript, Vite, Tailwind CSS v4.2, Zustand for
  client state, Framer Motion for row animations, and Three.js (via
  `@react-three/fiber`/`drei`) for the crawl graph. UI primitives are
  hand-built with Tailwind — no component library — matching the components and
  theme of [my-snippets](https://my-snippets-omega.vercel.app).

## How it works

1. You submit a seed URL and crawl settings (max depth, max pages,
   concurrency, same-origin only, respect robots.txt) from the UI.
2. The browser `POST`s those settings as JSON to `/api/crawl`. The function
   runs a breadth-first crawl, checking `robots.txt` and honoring
   `Crawl-delay` before each request, then extracts the title, outbound links,
   images, videos, prices, phones, and emails from each page with `cheerio`.
3. When the crawl finishes (or hits its safety cutoff), the function returns
   all results at once. The dashboard renders them into a tabbed explorer
   (Pages · Images · Prices · Phones · Emails · Videos · Graph).

Because the whole crawl runs inside one serverless function call, depth,
page count, and concurrency are capped server-side (defaults: depth ≤ 3,
pages ≤ 30, concurrency ≤ 5) to comfortably fit inside Vercel Hobby's
function duration limit.

## Project layout

```
crawler/
├── api/
│   ├── crawl.ts        # Vercel function: runs the crawl, returns JSON
│   └── _lib/            # crawl engine (crawler, extractor, robots.txt, types)
├── src/                 # Vite + React dashboard
│   ├── components/ui/   # hand-built Tailwind primitives
│   ├── components/CrawlGraph.tsx  # three.js crawl graph
│   └── store/crawlStore.ts        # zustand store (fetch → /api/crawl)
├── scripts/dev-api.ts   # local stand-in for the Vercel function (no CLI login needed)
└── vercel.json           # function duration config
```

## Running locally

Option A — matches production exactly, via the Vercel CLI (requires
`vercel login` once):

```bash
npm install
npm run dev   # vercel dev — serves the frontend and /api together
```

Option B — no Vercel account needed, two terminals:

```bash
npm install
npm run dev:api        # terminal 1 — stand-in for /api/crawl on :4000
npm run dev:vite-only  # terminal 2 — Vite dev server on :5173, proxies /api to :4000
```

Open the app, enter a seed URL, and start a crawl.

## Deploying

Push to GitHub and import the repo in Vercel — it auto-detects the Vite
frontend and the `api/` function, no extra configuration needed.
