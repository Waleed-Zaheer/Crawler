import robotsParserImport from "robots-parser";

interface Robot {
  isAllowed(url: string, ua?: string): boolean | undefined;
  isDisallowed(url: string, ua?: string): boolean | undefined;
  getCrawlDelay(ua?: string): number | undefined;
}

const robotsParser = robotsParserImport as unknown as (url: string, body: string) => Robot;

const USER_AGENT = "MySnippetsCrawler/1.0 (+https://my-snippets-omega.vercel.app)";
const cache = new Map<string, Promise<Robot | null>>();

async function fetchRobots(origin: string): Promise<Robot | null> {
  const robotsUrl = `${origin}/robots.txt`;
  try {
    const res = await fetch(robotsUrl, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return null;
    const body = await res.text();
    return robotsParser(robotsUrl, body);
  } catch {
    return null;
  }
}

function getParser(origin: string): Promise<Robot | null> {
  let entry = cache.get(origin);
  if (!entry) {
    entry = fetchRobots(origin);
    cache.set(origin, entry);
  }
  return entry;
}

export async function isAllowed(url: string): Promise<boolean> {
  const origin = new URL(url).origin;
  const robot = await getParser(origin);
  if (!robot) return true;
  return robot.isAllowed(url, USER_AGENT) ?? true;
}

export async function getCrawlDelayMs(url: string): Promise<number> {
  const origin = new URL(url).origin;
  const robot = await getParser(origin);
  const delay = robot?.getCrawlDelay(USER_AGENT);
  return delay ? delay * 1000 : 0;
}

export { USER_AGENT };
