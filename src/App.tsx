import { lazy, Suspense, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Globe, Loader2, Play, Square } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCrawlStore } from "@/store/crawlStore";
import type { PageResult } from "@/types";

const CrawlGraph = lazy(() => import("@/components/CrawlGraph").then((m) => ({ default: m.CrawlGraph })));

const STATUS_VARIANT: Record<PageResult["status"], "success" | "destructive" | "muted" | "default"> = {
  success: "success",
  error: "destructive",
  skipped: "muted",
  disallowed: "default",
};

function App() {
  const {
    options,
    setOption,
    startCrawl,
    stopCrawl,
    results,
    jobState,
    visitedCount,
    queuedCount,
    error,
  } = useCrawlStore();

  const isRunning = jobState === "running";

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    startCrawl();
  };

  return (
    <div className="mx-auto flex min-h-svh max-w-6xl flex-col gap-6 px-4 py-10">
      <header className="flex items-center gap-3">
        <Globe className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Crawler</h1>
          <p className="text-sm text-muted-foreground">
            A polite, robots.txt-respecting web crawler with a live dashboard.
          </p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Start a crawl</CardTitle>
          <CardDescription>
            Bounded to {options.maxDepth} levels deep and {options.maxPages} pages to fit inside a
            single serverless function call.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="seedUrl">Seed URL</Label>
              <Input
                id="seedUrl"
                type="url"
                required
                placeholder="https://example.com"
                value={options.seedUrl}
                disabled={isRunning}
                onChange={(e) => setOption("seedUrl", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="maxDepth">Max depth</Label>
                <Select
                  id="maxDepth"
                  disabled={isRunning}
                  value={options.maxDepth}
                  onChange={(e) => setOption("maxDepth", Number(e.target.value))}
                >
                  {[1, 2, 3].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="maxPages">Max pages</Label>
                <Select
                  id="maxPages"
                  disabled={isRunning}
                  value={options.maxPages}
                  onChange={(e) => setOption("maxPages", Number(e.target.value))}
                >
                  {[5, 10, 15, 20, 30].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="concurrency">Concurrency</Label>
                <Select
                  id="concurrency"
                  disabled={isRunning}
                  value={options.concurrency}
                  onChange={(e) => setOption("concurrency", Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="sameOriginOnly"
                  checked={options.sameOriginOnly}
                  disabled={isRunning}
                  onCheckedChange={(v) => setOption("sameOriginOnly", v)}
                />
                <Label htmlFor="sameOriginOnly">Same origin only</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="respectRobots"
                  checked={options.respectRobots}
                  disabled={isRunning}
                  onCheckedChange={(v) => setOption("respectRobots", v)}
                />
                <Label htmlFor="respectRobots">Respect robots.txt</Label>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isRunning ? (
                <Button type="button" variant="outline" onClick={stopCrawl}>
                  <Square className="h-4 w-4" />
                  Stop
                </Button>
              ) : (
                <Button type="submit">
                  <Play className="h-4 w-4" />
                  Start crawl
                </Button>
              )}
              {isRunning && (
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Crawling…
                </span>
              )}
              {jobState !== "idle" && !isRunning && (
                <Badge variant={jobState === "completed" ? "success" : "muted"}>{jobState}</Badge>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        </CardContent>
      </Card>

      {(results.length > 0 || isRunning) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Progress</CardTitle>
                <CardDescription>
                  {visitedCount} visited · {queuedCount} queued · target {options.maxPages}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={visitedCount} max={options.maxPages} />
          </CardContent>
        </Card>
      )}

      {(results.length > 0 || isRunning) && (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Crawl graph</CardTitle>
            <CardDescription>Each node is a page; edges follow the link that found it.</CardDescription>
          </CardHeader>
          <CardContent className="h-[360px] p-0">
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Loading 3D view…
                </div>
              }
            >
              <CrawlGraph results={results} />
            </Suspense>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>Every crawled page, as it's fetched.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Depth</TableHead>
                <TableHead>Links</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence initial={false}>
                {results.map((page, i) => (
                  <motion.tr
                    key={page.url}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-b border-border transition-colors hover:bg-muted/40 last:border-0"
                  >
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="max-w-xs truncate font-mono text-xs" title={page.url}>
                      {page.url}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[page.status]}>{page.status}</Badge>
                    </TableCell>
                    <TableCell>{page.statusCode ?? "—"}</TableCell>
                    <TableCell className="max-w-xs truncate">{page.title ?? "—"}</TableCell>
                    <TableCell>{page.depth}</TableCell>
                    <TableCell>{page.linksFound}</TableCell>
                    <TableCell className="text-muted-foreground">{page.durationMs}ms</TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {results.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    No results yet — start a crawl above.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
