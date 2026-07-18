export interface CrawlOptions {
  seedUrl: string;
  maxDepth: number;
  maxPages: number;
  concurrency: number;
  sameOriginOnly: boolean;
  respectRobots: boolean;
}

export type PageStatus = "success" | "error" | "skipped" | "disallowed";

export interface PageImage {
  src: string;
  alt: string | null;
}

export interface PageData {
  images: PageImage[];
  videos: string[];
  prices: string[];
  phones: string[];
  emails: string[];
}

export interface PageResult {
  url: string;
  parentUrl: string | null;
  depth: number;
  status: PageStatus;
  statusCode: number | null;
  title: string | null;
  contentType: string | null;
  linksFound: number;
  data: PageData;
  error: string | null;
  fetchedAt: string;
  durationMs: number;
}
