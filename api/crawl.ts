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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST" && req.method !== "GET") {
    res.status(405).json({ error: "Use POST (or GET) to start a crawl." });
    return;
  }

  // POST sends a JSON body; GET (handy for quick manual tests) uses query params.
  const input: Record<string, unknown> =
    req.method === "POST"
      ? typeof req.body === "string"
        ? safeParse(req.body)
        : (req.body ?? {})
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

  const options: CrawlOptions = {
    seedUrl,
    maxDepth: clamp(input.maxDepth, 1, 3, 2),
    maxPages: clamp(input.maxPages, 1, 30, 15),
    concurrency: clamp(input.concurrency, 1, 5, 3),
    sameOriginOnly: parseBool(input.sameOriginOnly, true),
    respectRobots: parseBool(input.respectRobots, true),
  };

  const results: PageResult[] = [];
  const crawler = new Crawler(options);
  crawler.on("page", (data: PageResult) => results.push(data));

  // Stop with a safety margin so we return the pages gathered so far instead
  // of being hard-killed when maxDuration is hit.
  const safetyTimer = setTimeout(() => crawler.stop(), 50_000);

  let state: JobState = "completed";
  let error: string | null = null;
  try {
    await crawler.run();
  } catch (err) {
    state = "failed";
    error = err instanceof Error ? err.message : "unknown error";
  } finally {
    clearTimeout(safetyTimer);
  }

  res.status(200).json({ state, error, results, visitedCount: results.length });
}

function safeParse(body: string): Record<string, unknown> {
  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
}
