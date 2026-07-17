# Crawler

A polite web crawler with a live dashboard. Crawl results (URL, status, title,
links found, timing) stream into a table in real time as pages are fetched.

## Stack

- **Backend** — Node.js, TypeScript, Express, `ws` (WebSocket), `cheerio` for
  HTML parsing, `robots-parser` for robots.txt compliance.
- **Frontend** — React, TypeScript, Vite, Tailwind CSS, shadcn/ui components
  (styled to match [my-snippets](https://my-snippets-omega.vercel.app)),
  Zustand for client state.

## How it works

1. You submit a seed URL and crawl settings (max depth, max pages,
   concurrency, same-origin only, respect robots.txt) from the UI.
2. The backend runs a breadth-first crawl, checking `robots.txt` and honoring
   `Crawl-delay` before each request, extracting the page title and outbound
   links with `cheerio`.
3. Each crawled page is pushed over a WebSocket the instant it's fetched and
   appended to the results table — no polling, no waiting for the whole job
   to finish.

## Project layout

```
crawler/
├── backend/   # Express + WebSocket crawler service
└── frontend/  # Vite + React dashboard
```

## Running locally

```bash
# Terminal 1 — backend (http://localhost:4000)
cd backend
npm install
npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
```

Open the frontend URL, enter a seed URL, and start a crawl.
