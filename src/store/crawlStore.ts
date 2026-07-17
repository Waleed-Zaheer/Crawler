import { create } from "zustand";
import type { CrawlOptions, JobState, PageResult } from "@/types";

interface CrawlState {
  options: CrawlOptions;
  results: PageResult[];
  jobState: JobState;
  visitedCount: number;
  queuedCount: number;
  error: string | null;
  setOption: <K extends keyof CrawlOptions>(key: K, value: CrawlOptions[K]) => void;
  startCrawl: () => void;
  stopCrawl: () => void;
}

let activeSource: EventSource | null = null;

const defaultOptions: CrawlOptions = {
  seedUrl: "https://example.com",
  maxDepth: 2,
  maxPages: 15,
  concurrency: 3,
  sameOriginOnly: true,
  respectRobots: true,
};

export const useCrawlStore = create<CrawlState>((set, get) => ({
  options: defaultOptions,
  results: [],
  jobState: "idle",
  visitedCount: 0,
  queuedCount: 0,
  error: null,

  setOption: (key, value) =>
    set((state) => ({ options: { ...state.options, [key]: value } })),

  startCrawl: () => {
    if (activeSource) activeSource.close();

    const { options } = get();
    const params = new URLSearchParams({
      seedUrl: options.seedUrl,
      maxDepth: String(options.maxDepth),
      maxPages: String(options.maxPages),
      concurrency: String(options.concurrency),
      sameOriginOnly: String(options.sameOriginOnly),
      respectRobots: String(options.respectRobots),
    });

    set({ results: [], jobState: "running", visitedCount: 0, queuedCount: 0, error: null });

    const source = new EventSource(`/api/crawl?${params.toString()}`);
    activeSource = source;

    source.addEventListener("page", (event) => {
      const data = JSON.parse((event as MessageEvent).data) as PageResult;
      set((state) => ({ results: [...state.results, data] }));
    });

    source.addEventListener("progress", (event) => {
      const data = JSON.parse((event as MessageEvent).data) as {
        visitedCount: number;
        queuedCount: number;
      };
      set({ visitedCount: data.visitedCount, queuedCount: data.queuedCount });
    });

    source.addEventListener("done", (event) => {
      const data = JSON.parse((event as MessageEvent).data) as {
        state: JobState;
        error?: string;
      };
      set({ jobState: data.state, error: data.error ?? null });
      source.close();
      activeSource = null;
    });

    source.onerror = () => {
      if (get().jobState === "running") {
        set({ jobState: "failed", error: "Connection to the crawler was lost." });
      }
      source.close();
      activeSource = null;
    };
  },

  stopCrawl: () => {
    if (activeSource) {
      activeSource.close();
      activeSource = null;
    }
    set({ jobState: "stopped" });
  },
}));
