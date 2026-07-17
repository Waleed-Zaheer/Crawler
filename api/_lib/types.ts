export interface CrawlOptions {
  seedUrl: string;
  maxDepth: number;
  maxPages: number;
  concurrency: number;
  sameOriginOnly: boolean;
  respectRobots: boolean;
}

export type PageStatus = "success" | "error" | "skipped" | "disallowed";

export interface PageResult {
  url: string;
  depth: number;
  status: PageStatus;
  statusCode: number | null;
  title: string | null;
  contentType: string | null;
  linksFound: number;
  error: string | null;
  fetchedAt: string;
  durationMs: number;
}

export type JobState = "running" | "completed" | "stopped" | "failed";

export interface CrawlJob {
  id: string;
  options: CrawlOptions;
  state: JobState;
  createdAt: string;
  results: PageResult[];
  visitedCount: number;
  queuedCount: number;
}

export type CrawlEvent =
  | { type: "page"; jobId: string; data: PageResult }
  | { type: "progress"; jobId: string; data: { visitedCount: number; queuedCount: number } }
  | { type: "done"; jobId: string; data: { state: JobState } };
