# Crawler

A polite web crawler with a live dashboard, built to deploy on Vercel's free
(Hobby) tier. Every crawled page — URL, status, title, links found, timing —
streams into a results table the instant it's fetched, alongside a live 3D
graph of the pages and links discovered.

## Stack

- **Crawl engine** (`api/_lib`) — TypeScript, `cheerio` for HTML parsing,
  `robots-parser` for robots.txt/Crawl-delay compliance.
- **API** (`api/crawl.ts`) — a single Vercel serverless function that runs the
  crawl and streams results back over Server-Sent Events (SSE). Vercel
  doesn't support long-lived processes or raw WebSocket servers, so the whole
  crawl happens inside one function invocation, bounded by `vercel.json`'s
  `maxDuration`.
- **Frontend** — React, TypeScript, Vite, Tailwind CSS v4.2, Zustand for
  client state, Framer Motion for the results table's row animations, and
  Three.js (via `@react-three/fiber`/`drei`) for the live crawl graph. UI
  primitives are hand-built with Tailwind — no component library — themed
  with the color tokens from
  [my-snippets](https://my-snippets-omega.vercel.app).

## How it works

1. You submit a seed URL and crawl settings (max depth, max pages,
   concurrency, same-origin only, respect robots.txt) from the UI.
2. The browser opens an `EventSource` to `/api/crawl` with those settings as
   query params. The function runs a breadth-first crawl, checking
   `robots.txt` and honoring `Crawl-delay` before each request, and
   extracting the page title and outbound links with `cheerio`.
3. Each crawled page is emitted as an SSE `page` event the instant it's
   fetched — no polling. The frontend appends it to the results table and to
   the 3D graph as it arrives. Closing the connection (the Stop button) tells
   the function to stop crawling.

Because the whole crawl runs inside one serverless function call, depth,
page count, and concurrency are capped server-side (defaults: depth ≤ 3,
pages ≤ 30, concurrency ≤ 5) to comfortably fit inside Vercel Hobby's
function duration limit.

## Project layout

```
crawler/
├── api/
│   ├── crawl.ts        # Vercel function: SSE crawl endpoint
│   └── _lib/            # crawl engine (crawler, robots.txt, types)
├── src/                 # Vite + React dashboard
│   ├── components/ui/   # hand-built Tailwind primitives
│   ├── components/CrawlGraph.tsx  # three.js live crawl graph
│   └── store/crawlStore.ts        # zustand store wired to the SSE stream
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
