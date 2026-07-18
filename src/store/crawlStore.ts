import { create } from "zustand";
import type { CrawlOptions, JobState, PageResult } from "@/types";

interface CrawlResponse {
  state: JobState;
  error: string | null;
  results: PageResult[];
  visitedCount: number;
}

interface CrawlState {
  options: CrawlOptions;
  results: PageResult[];
  jobState: JobState;
  visitedCount: number;
  error: string | null;
  setOption: <K extends keyof CrawlOptions>(key: K, value: CrawlOptions[K]) => void;
  startCrawl: () => Promise<void>;
  stopCrawl: () => void;
}

let controller: AbortController | null = null;

const defaultOptions: CrawlOptions = {
  seedUrl: "https://example.com",
  maxDepth: 2,
  maxPages: 12,
  concurrency: 3,
  sameOriginOnly: true,
  respectRobots: true,
};

export const useCrawlStore = create<CrawlState>((set, get) => ({
  options: defaultOptions,
  results: [],
  jobState: "idle",
  visitedCount: 0,
  error: null,

  setOption: (key, value) =>
    set((state) => ({ options: { ...state.options, [key]: value } })),

  startCrawl: async () => {
    if (controller) controller.abort();
    controller = new AbortController();

    const { options } = get();
    set({ results: [], jobState: "running", visitedCount: 0, error: null });

    try {
      const res = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Crawl failed (HTTP ${res.status})`);
      }

      const data = (await res.json()) as CrawlResponse;
      set({
        results: data.results,
        visitedCount: data.visitedCount,
        jobState: data.state,
        error: data.error,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // stopCrawl() already set the stopped state.
        return;
      }
      set({
        jobState: "failed",
        error: err instanceof Error ? err.message : "Crawl request failed.",
      });
    } finally {
      controller = null;
    }
  },

  stopCrawl: () => {
    if (controller) {
      controller.abort();
      controller = null;
    }
    set({ jobState: "stopped" });
  },
}));
