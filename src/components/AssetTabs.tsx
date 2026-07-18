import { lazy, Suspense, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ImageGrid, ValueList } from "@/components/DataViews";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { aggregate } from "@/lib/aggregate";
import type { PageResult } from "@/types";

const CrawlGraph = lazy(() => import("@/components/CrawlGraph").then((m) => ({ default: m.CrawlGraph })));

function PagesTable({ results }: { results: PageResult[] }) {
  return (
    <Table className="max-h-130">
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">#</TableHead>
          <TableHead>URL</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Code</TableHead>
          <TableHead>Title</TableHead>
          <TableHead className="text-right">Imgs</TableHead>
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
              <TableCell className="text-right tabular-nums">{page.data.images.length}</TableCell>
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
  );
}

export function DataViews({ results }: { results: PageResult[] }) {
  const data = useMemo(() => aggregate(results), [results]);
  const [tab, setTab] = useState("pages");

  const items = [
    { value: "pages", label: "Pages", count: results.length },
    { value: "images", label: "Images", count: data.images.length },
    { value: "prices", label: "Prices", count: data.prices.length },
    { value: "phones", label: "Phones", count: data.phones.length },
    { value: "emails", label: "Emails", count: data.emails.length },
    { value: "videos", label: "Videos", count: data.videos.length },
    { value: "graph", label: "Graph" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto">
        <Tabs items={items} value={tab} onValueChange={setTab} />
      </div>

      {tab === "pages" && <PagesTable results={results} />}
      {tab === "images" && <ImageGrid images={data.images} />}
      {tab === "prices" && <ValueList values={data.prices} emptyLabel="prices" />}
      {tab === "phones" && (
        <ValueList values={data.phones} emptyLabel="phone numbers" mono asLink linkPrefix="tel:" />
      )}
      {tab === "emails" && (
        <ValueList values={data.emails} emptyLabel="emails" mono asLink linkPrefix="mailto:" />
      )}
      {tab === "videos" && <ValueList values={data.videos} emptyLabel="videos" mono asLink />}
      {tab === "graph" && (
        <div className="h-100 overflow-hidden rounded-2xl border border-border">
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Loading 3D view…
              </div>
            }
          >
            <CrawlGraph results={results} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
