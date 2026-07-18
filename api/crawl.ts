import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Crawler } from "./_lib/crawler";
import type { CrawlOptions, JobState, PageResult } from "./_lib/types";

// Serverless functions are request→response: holding an SSE stream open the
// way res.write() needs gets buffered/killed on Vercel, which is why the
// browser saw "connection lost". Instead we run the whole (bounded) crawl
// inside one invocation and return every result as a single JSON response.
// vercel.json's maxDuration caps us; we self-stop with a margin below it.
function clamp(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  const resolved = Number.isFinite(n) ? n : fallback;
  return Math.min(max, Math.max(min, Math.round(resolved)));
}

function parseBool(value: unknown, fallback: boolean): boolean {
  if (value === undefined || value === null) return fallback;
  return value === true || value === "true" || value === "1";
}

function safeParse(body: string): Record<string, unknown> {
  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
}

async function runCrawl(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== "POST" && req.method !== "GET") {
    res.status(405).json({ error: "Use POST (or GET) to start a crawl." });
    return;
  }

  // POST sends a JSON body; GET (handy for quick manual tests) uses query params.
  const input: Record<string, unknown> =
    req.method === "POST"
      ? typeof req.body === "string"
        ? safeParse(req.body)
        : ((req.body as Record<string, unknown> | undefined) ?? {})
      : req.query;

  const seedUrl = input.seedUrl;

  if (!seedUrl || typeof seedUrl !== "string") {
    res.status(400).json({ error: "seedUrl is required" });
    return;
  }

  try {
    const url = new URL(seedUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("bad protocol");
  } catch {
    res.status(400).json({ error: "seedUrl must be a valid http(s) URL" });
    return;
  }

  // Bounds kept conservative so a run comfortably fits inside the function's
  // memory and time budget on Vercel's free tier (large/slow sites are what
  // pushed earlier runs into platform-level 5xx crashes).
  const options: CrawlOptions = {
    seedUrl,
    maxDepth: clamp(input.maxDepth, 1, 3, 2),
    maxPages: clamp(input.maxPages, 1, 25, 12),
    concurrency: clamp(input.concurrency, 1, 8, 6),
    sameOriginOnly: parseBool(input.sameOriginOnly, true),
    respectRobots: parseBool(input.respectRobots, true),
  };

  const results: PageResult[] = [];
  const crawler = new Crawler(options);
  crawler.on("page", (data: PageResult) => results.push(data));
  // EventEmitter throws if an "error" event is emitted with no listener, which
  // would crash the whole function. Absorb any into the response instead.
  let crawlError: string | null = null;
  crawler.on("error", (err: unknown) => {
    crawlError = err instanceof Error ? err.message : String(err);
  });

  // Stop early enough that in-flight fetches (≤8s) can finish and we still
  // respond well before maxDuration — being hard-killed mid-response is what
  // produced the 502s. 45s stop + ~8s drain ≈ 53s, under the 60s limit.
  const safetyTimer = setTimeout(() => crawler.stop(), 45_000);

  let state: JobState = "completed";
  try {
    await crawler.run();
  } catch (err) {
    state = "failed";
    crawlError = err instanceof Error ? err.message : "unknown error";
  } finally {
    clearTimeout(safetyTimer);
  }

  res.status(200).json({ state, error: crawlError, results, visitedCount: results.length });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await runCrawl(req, res);
  } catch (err) {
    // Last-resort guard: surface the real reason instead of an opaque 500 so
    // failures are diagnosable from the browser's network tab.
    if (!res.headersSent) {
      res.status(500).json({
        error: err instanceof Error ? `${err.name}: ${err.message}` : "Unexpected server error",
      });
    }
  }
}
