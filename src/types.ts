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
  parentUrl: string | null;
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

export type JobState = "idle" | "running" | "completed" | "stopped" | "failed";
