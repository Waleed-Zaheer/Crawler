// Lightweight local stand-in for Vercel's Node runtime, for developers who
// haven't linked this project to a Vercel account yet. Mirrors what Vercel
// does when it invokes api/crawl.ts: parses the query string onto req.query
// and adds the res.status()/res.json() helpers. Pair with `npm run dev` for
// the Vite dev server (proxies /api here) — or just use `vercel dev` instead,
// which serves both from one process against the real Vercel runtime.
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { URL } from "node:url";
import handler from "../api/crawl.ts";

type DevRequest = IncomingMessage & { query: Record<string, string>; body: unknown };
type DevResponse = ServerResponse & {
  status: (code: number) => DevResponse;
  json: (body: unknown) => void;
};

const PORT = Number(process.env.PORT ?? 4000);

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => resolve(raw));
    req.on("error", reject);
  });
}

const server = createServer(async (req, res) => {
  const devReq = req as DevRequest;
  const devRes = res as DevResponse;

  const url = new URL(req.url ?? "/", "http://localhost");
  devReq.query = Object.fromEntries(url.searchParams.entries());
  devRes.status = (code) => {
    devRes.statusCode = code;
    return devRes;
  };
  devRes.json = (body) => {
    devRes.setHeader("content-type", "application/json");
    devRes.end(JSON.stringify(body));
  };

  if (url.pathname !== "/api/crawl") {
    devRes.status(404).json({ error: "not found" });
    return;
  }

  // Mirror @vercel/node: JSON request bodies arrive pre-parsed on req.body.
  if (req.method === "POST") {
    const raw = await readBody(req);
    try {
      devReq.body = raw ? JSON.parse(raw) : {};
    } catch {
      devReq.body = {};
    }
  }

  await handler(devReq as never, devRes as never);
});

server.listen(PORT, () => {
  console.log(`Local /api/crawl stand-in listening on http://localhost:${PORT}`);
});
