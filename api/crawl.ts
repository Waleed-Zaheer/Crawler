import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Crawler } from "./_lib/crawler";
import type { CrawlOptions } from "./_lib/types";

// Vercel Hobby caps function duration (see vercel.json's maxDuration); we
// bound crawl size/depth to fit comfortably inside it and self-stop with a
// safety margin before that limit is hit.
function clamp(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  const resolved = Number.isFinite(n) ? n : fallback;
  return Math.min(max, Math.max(min, Math.round(resolved)));
}

function parseBool(value: unknown, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === "true" || value === "1";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "GET only — this endpoint streams via EventSource" });
    return;
  }

  const { seedUrl, maxDepth, maxPages, concurrency, sameOriginOnly, respectRobots } = req.query;

  if (!seedUrl || typeof seedUrl !== "string") {
    res.status(400).json({ error: "seedUrl query param is required" });
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
    maxDepth: clamp(maxDepth, 1, 3, 2),
    maxPages: clamp(maxPages, 1, 30, 15),
    concurrency: clamp(concurrency, 1, 5, 3),
    sameOriginOnly: parseBool(sameOriginOnly, true),
    respectRobots: parseBool(respectRobots, true),
  };

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const crawler = new Crawler(options);
  crawler.on("page", (data) => send("page", data));
  crawler.on("progress", (data) => send("progress", data));

  req.on("close", () => crawler.stop());

  // Stop with a safety margin so we close the stream cleanly instead of
  // being hard-killed mid-response when maxDuration is hit.
  const safetyTimer = setTimeout(() => crawler.stop(), 50_000);

  send("start", { options });

  try {
    await crawler.run();
    send("done", { state: "completed" });
  } catch (err) {
    send("done", { state: "failed", error: err instanceof Error ? err.message : "unknown error" });
  } finally {
    clearTimeout(safetyTimer);
    res.end();
  }
}
