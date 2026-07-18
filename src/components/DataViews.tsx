import { ExternalLink, ImageOff } from "lucide-react";
import type { AggregatedImage, AggregatedValue } from "@/lib/aggregate";

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center text-sm text-muted-foreground">
      <ImageOff className="h-6 w-6 opacity-50" />
      No {label} found yet.
    </div>
  );
}

export function ImageGrid({ images }: { images: AggregatedImage[] }) {
  if (images.length === 0) return <EmptyState label="images" />;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {images.map((img) => (
        <a
          key={img.src}
          href={img.src}
          target="_blank"
          rel="noreferrer"
          className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted"
          title={img.alt ?? img.src}
        >
          <img
            src={img.src}
            alt={img.alt ?? ""}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            onError={(e) => {
              (e.currentTarget.style.display = "none");
            }}
          />
          {img.alt && (
            <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 py-1 text-xs text-white">
              {img.alt}
            </span>
          )}
        </a>
      ))}
    </div>
  );
}

export function ValueList({
  values,
  emptyLabel,
  mono,
  asLink,
  linkPrefix,
}: {
  values: AggregatedValue[];
  emptyLabel: string;
  mono?: boolean;
  asLink?: boolean;
  linkPrefix?: string;
}) {
  if (values.length === 0) return <EmptyState label={emptyLabel} />;
  return (
    <div className="flex flex-col divide-y divide-border">
      {values.map((v, i) => (
        <div key={`${v.value}-${i}`} className="flex items-center justify-between gap-3 py-2.5">
          <div className="min-w-0">
            {asLink ? (
              <a
                href={`${linkPrefix ?? ""}${v.value}`}
                target="_blank"
                rel="noreferrer"
                className={`truncate text-primary hover:underline ${mono ? "font-mono text-sm" : ""}`}
              >
                {v.value}
              </a>
            ) : (
              <span className={`truncate ${mono ? "font-mono text-sm" : "font-medium"}`}>
                {v.value}
              </span>
            )}
          </div>
          <a
            href={v.pageUrl}
            target="_blank"
            rel="noreferrer"
            className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            title={v.pageUrl}
          >
            {hostOf(v.pageUrl)}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      ))}
    </div>
  );
}
