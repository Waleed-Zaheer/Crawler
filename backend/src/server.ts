import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { WebSocketServer, WebSocket } from "ws";
import { Crawler } from "./crawler.js";
import type { CrawlEvent, CrawlJob, CrawlOptions } from "./types.js";

const PORT = Number(process.env.PORT ?? 4000);

const app = express();
app.use(cors());
app.use(express.json());

const jobs = new Map<string, CrawlJob>();
const crawlers = new Map<string, Crawler>();
const clients = new Set<WebSocket>();

function broadcast(event: CrawlEvent): void {
  const payload = JSON.stringify(event);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  }
}

function validateOptions(body: Partial<CrawlOptions>): { ok: true; options: CrawlOptions } | { ok: false; error: string } {
  if (!body.seedUrl || typeof body.seedUrl !== "string") {
    return { ok: false, error: "seedUrl is required" };
  }
  try {
    const url = new URL(body.seedUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { ok: false, error: "seedUrl must be http or https" };
    }
  } catch {
    return { ok: false, error: "seedUrl is not a valid URL" };
  }

  const options: CrawlOptions = {
    seedUrl: body.seedUrl,
    maxDepth: clamp(body.maxDepth, 1, 5, 2),
    maxPages: clamp(body.maxPages, 1, 500, 50),
    concurrency: clamp(body.concurrency, 1, 10, 4),
    sameOriginOnly: body.sameOriginOnly ?? true,
    respectRobots: body.respectRobots ?? true,
  };
  return { ok: true, options };
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

app.post("/api/crawl", (req, res) => {
  const validation = validateOptions(req.body ?? {});
  if (!validation.ok) {
    res.status(400).json({ error: validation.error });
    return;
  }

  const id = randomUUID();
  const job: CrawlJob = {
    id,
    options: validation.options,
    state: "running",
    createdAt: new Date().toISOString(),
    results: [],
    visitedCount: 0,
    queuedCount: 1,
  };
  jobs.set(id, job);

  const crawler = new Crawler(validation.options);
  crawlers.set(id, crawler);

  crawler.on("page", (data) => {
    job.results.push(data);
    broadcast({ type: "page", jobId: id, data });
  });
  crawler.on("progress", (data: { visitedCount: number; queuedCount: number }) => {
    job.visitedCount = data.visitedCount;
    job.queuedCount = data.queuedCount;
    broadcast({ type: "progress", jobId: id, data });
  });

  crawler
    .run()
    .then(() => {
      job.state = job.state === "stopped" ? "stopped" : "completed";
      broadcast({ type: "done", jobId: id, data: { state: job.state } });
    })
    .catch(() => {
      job.state = "failed";
      broadcast({ type: "done", jobId: id, data: { state: job.state } });
    })
    .finally(() => crawlers.delete(id));

  res.status(201).json({ jobId: id, options: validation.options });
});

app.post("/api/crawl/:id/stop", (req, res) => {
  const crawler = crawlers.get(req.params.id);
  const job = jobs.get(req.params.id);
  if (!crawler || !job) {
    res.status(404).json({ error: "job not found or already finished" });
    return;
  }
  job.state = "stopped";
  crawler.stop();
  res.json({ ok: true });
});

app.get("/api/crawl/:id", (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) {
    res.status(404).json({ error: "job not found" });
    return;
  }
  res.json(job);
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

wss.on("connection", (ws) => {
  clients.add(ws);
  ws.on("close", () => clients.delete(ws));
});

httpServer.listen(PORT, () => {
  console.log(`Crawler backend listening on http://localhost:${PORT}`);
});
