import { lazy, Suspense, useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Clock3, Globe, Loader2, Moon, Play, Square, Sun, Target } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { applyTheme, getInitialTheme, type Theme } from "@/lib/theme";
import { useCrawlStore } from "@/store/crawlStore";

const CrawlGraph = lazy(() => import("@/components/CrawlGraph").then((m) => ({ default: m.CrawlGraph })));

function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

function LiveStatus({ isRunning }: { isRunning: boolean }) {
  if (!isRunning) return null;
  return (
    <Badge variant="success" className="gap-1.5">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
      </span>
      Live
    </Badge>
  );
}

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
  const showStats = results.length > 0 || isRunning;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    startCrawl();
  };

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Globe className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <h1 className="text-sm font-semibold">Crawler</h1>
              <p className="text-xs text-muted-foreground">robots.txt-aware · live via SSE</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LiveStatus isRunning={isRunning} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[340px_1fr] lg:items-start">
        <div className="lg:sticky lg:top-20">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>New crawl</CardTitle>
              <CardDescription>
                Up to {options.maxDepth} levels deep, {options.maxPages} pages.
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

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="maxDepth">Depth</Label>
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
                    <Label htmlFor="maxPages">Pages</Label>
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
                    <Label htmlFor="concurrency">Concur.</Label>
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

                <div className="flex flex-col gap-3 border-t border-border pt-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sameOriginOnly" className="font-normal">
                      Same origin only
                    </Label>
                    <Switch
                      id="sameOriginOnly"
                      checked={options.sameOriginOnly}
                      disabled={isRunning}
                      onCheckedChange={(v) => setOption("sameOriginOnly", v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="respectRobots" className="font-normal">
                      Respect robots.txt
                    </Label>
                    <Switch
                      id="respectRobots"
                      checked={options.respectRobots}
                      disabled={isRunning}
                      onCheckedChange={(v) => setOption("respectRobots", v)}
                    />
                  </div>
                </div>

                {isRunning ? (
                  <Button type="button" variant="outline" onClick={stopCrawl}>
                    <Square className="h-4 w-4" />
                    Stop crawl
                  </Button>
                ) : (
                  <Button type="submit">
                    <Play className="h-4 w-4" />
                    Start crawl
                  </Button>
                )}

                {isRunning && (
                  <span className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Crawling…
                  </span>
                )}
                {jobState !== "idle" && !isRunning && (
                  <Badge variant={jobState === "completed" ? "success" : "secondary"} className="mx-auto">
                    {jobState}
                  </Badge>
                )}
                {error && <p className="text-center text-sm text-destructive">{error}</p>}
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          {showStats && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <StatCard label="Visited" value={visitedCount} icon={CheckCircle2} accent />
                <StatCard label="Queued" value={queuedCount} icon={Clock3} />
                <StatCard label="Target" value={options.maxPages} icon={Target} />
              </div>
              <Card>
                <CardContent className="flex items-center gap-4">
                  <Progress value={visitedCount} max={options.maxPages} className="flex-1" />
                  <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">
                    {Math.min(100, Math.round((visitedCount / options.maxPages) * 100))}%
                  </span>
                </CardContent>
              </Card>
            </>
          )}

          {showStats && (
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Crawl graph</CardTitle>
                <CardDescription>Each node is a page; edges follow the link that found it.</CardDescription>
              </CardHeader>
              <CardContent className="h-100 p-0">
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
            <CardHeader className="border-b">
              <CardTitle>Results</CardTitle>
              <CardDescription>Every crawled page, as it's fetched.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table className="max-h-130">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="text-right">Depth</TableHead>
                    <TableHead className="text-right">Links</TableHead>
                    <TableHead className="text-right">Time</TableHead>
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
                        className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                      >
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="max-w-xs truncate font-mono text-xs" title={page.url}>
                          {page.url}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={page.status} />
                        </TableCell>
                        <TableCell className="tabular-nums">{page.statusCode ?? "—"}</TableCell>
                        <TableCell className="max-w-xs truncate text-muted-foreground">
                          {page.title ?? "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{page.depth}</TableCell>
                        <TableCell className="text-right tabular-nums">{page.linksFound}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {page.durationMs}ms
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {results.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                        No results yet — start a crawl on the left.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default App;
