import { useMemo, type FormEvent } from "react";
import {
  AtSign,
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  Globe,
  Image as ImageIcon,
  Loader2,
  Play,
  Square,
} from "lucide-react";
import { DataViews } from "@/components/AssetTabs";
import { ScanningState } from "@/components/ScanningState";
import { StatCard } from "@/components/StatCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { aggregate } from "@/lib/aggregate";
import { useCrawlStore } from "@/store/crawlStore";

function LiveStatus({ isRunning }: { isRunning: boolean }) {
  if (!isRunning) return null;
  return (
    <Badge variant="success" className="gap-1.5">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
      </span>
      Crawling
    </Badge>
  );
}

export function Dashboard({ onHome }: { onHome: () => void }) {
  const { options, setOption, startCrawl, stopCrawl, results, jobState, visitedCount, error } =
    useCrawlStore();

  const isRunning = jobState === "running";
  const hasResults = results.length > 0;
  const showStats = hasResults;
  const scanning = isRunning && !hasResults;

  const totals = useMemo(() => {
    const data = aggregate(results);
    return {
      images: data.images.length,
      prices: data.prices.length,
      contacts: data.phones.length + data.emails.length,
    };
  }, [results]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    startCrawl();
  };

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onHome}
            className="flex items-center gap-2.5 text-left transition-opacity hover:opacity-80"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Globe className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <h1 className="text-sm font-semibold">Crawler</h1>
              <p className="text-xs text-muted-foreground">robots.txt-aware web scraper</p>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <LiveStatus isRunning={isRunning} />
            <Button variant="ghost" size="sm" onClick={onHome} className="hidden sm:inline-flex">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Button>
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
                      {[5, 10, 15, 20, 25].map((n) => (
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
                      {[1, 2, 3, 4, 6, 8].map((n) => (
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
                    Crawling… this runs to completion, then results appear.
                  </span>
                )}
                {jobState !== "idle" && jobState !== "running" && (
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
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard label="Pages" value={visitedCount} icon={CheckCircle2} accent />
                <StatCard label="Images" value={totals.images} icon={ImageIcon} />
                <StatCard label="Prices" value={totals.prices} icon={DollarSign} />
                <StatCard label="Contacts" value={totals.contacts} icon={AtSign} />
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

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Scraped data</CardTitle>
              <CardDescription>
                Pages, images, prices, contacts, and videos found across the crawl.
              </CardDescription>
            </CardHeader>
            {scanning && <Progress indeterminate className="rounded-none" />}
            <CardContent>
              {scanning ? <ScanningState seedUrl={options.seedUrl} /> : <DataViews results={results} />}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
