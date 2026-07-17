import { EventEmitter } from "node:events";
import * as cheerio from "cheerio";
import { getCrawlDelayMs, isAllowed, USER_AGENT } from "./robots";
import type { CrawlOptions, PageResult } from "./types";

interface QueueItem {
  url: string;
  depth: number;
  parentUrl: string | null;
}

const FETCH_TIMEOUT_MS = 10_000;

function normalizeUrl(raw: string, base: string): string | null {
  try {
    const u = new URL(raw, base);
    u.hash = "";
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

export class Crawler extends EventEmitter {
  private readonly options: CrawlOptions;
  private readonly visited = new Set<string>();
  private readonly queue: QueueItem[] = [];
  private readonly seedOrigin: string;
  private active = 0;
  private stopped = false;
  private resolveDone: (() => void) | null = null;

  constructor(options: CrawlOptions) {
    super();
    this.options = options;
    this.seedOrigin = new URL(options.seedUrl).origin;
    this.queue.push({ url: options.seedUrl, depth: 0, parentUrl: null });
  }

  stop(): void {
    this.stopped = true;
  }

  async run(): Promise<void> {
    const done = new Promise<void>((resolve) => {
      this.resolveDone = resolve;
    });
    this.pump();
    await done;
  }

  private get visitedCount(): number {
    return this.visited.size;
  }

  private pump(): void {
    if (this.stopped) {
      this.finish();
      return;
    }

    while (
      this.active < this.options.concurrency &&
      this.queue.length > 0 &&
      this.visitedCount < this.options.maxPages
    ) {
      const item = this.queue.shift();
      if (!item) break;
      if (this.visited.has(item.url)) continue;
      this.visited.add(item.url);
      this.active += 1;
      this.crawlOne(item).finally(() => {
        this.active -= 1;
        this.emitProgress();
        this.pump();
      });
    }

    if (this.active === 0 && (this.queue.length === 0 || this.visitedCount >= this.options.maxPages)) {
      this.finish();
    }
  }

  private finish(): void {
    if (this.resolveDone) {
      const resolve = this.resolveDone;
      this.resolveDone = null;
      resolve();
    }
  }

  private emitProgress(): void {
    this.emit("progress", {
      visitedCount: this.visitedCount,
      queuedCount: this.queue.length,
    });
  }

  private async crawlOne(item: QueueItem): Promise<void> {
    const start = Date.now();
    const base: PageResult = {
      url: item.url,
      parentUrl: item.parentUrl,
      depth: item.depth,
      status: "success",
      statusCode: null,
      title: null,
      contentType: null,
      linksFound: 0,
      error: null,
      fetchedAt: new Date().toISOString(),
      durationMs: 0,
    };

    if (this.options.respectRobots) {
      const allowed = await isAllowed(item.url).catch(() => true);
      if (!allowed) {
        this.emit("page", { ...base, status: "disallowed", durationMs: Date.now() - start });
        return;
      }
      const delay = await getCrawlDelayMs(item.url).catch(() => 0);
      if (delay > 0) await new Promise((r) => setTimeout(r, delay));
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const res = await fetch(item.url, {
        headers: { "User-Agent": USER_AGENT },
        signal: controller.signal,
      });
      clearTimeout(timer);

      const contentType = res.headers.get("content-type");
      base.statusCode = res.status;
      base.contentType = contentType;

      if (!res.ok) {
        this.emit("page", { ...base, status: "error", error: `HTTP ${res.status}`, durationMs: Date.now() - start });
        return;
      }

      if (!contentType || !contentType.includes("text/html")) {
        this.emit("page", { ...base, status: "skipped", durationMs: Date.now() - start });
        return;
      }

      const html = await res.text();
      const $ = cheerio.load(html);
      const title = $("title").first().text().trim() || null;

      const links = new Set<string>();
      $("a[href]").each((_, el) => {
        const href = $(el).attr("href");
        if (!href) return;
        const normalized = normalizeUrl(href, item.url);
        if (!normalized) return;
        if (this.options.sameOriginOnly && new URL(normalized).origin !== this.seedOrigin) return;
        links.add(normalized);
      });

      if (item.depth < this.options.maxDepth) {
        for (const link of links) {
          if (!this.visited.has(link)) {
            this.queue.push({ url: link, depth: item.depth + 1, parentUrl: item.url });
          }
        }
      }

      this.emit("page", {
        ...base,
        title,
        linksFound: links.size,
        durationMs: Date.now() - start,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      this.emit("page", { ...base, status: "error", error: message, durationMs: Date.now() - start });
    }
  }
}
