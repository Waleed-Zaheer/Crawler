import type { PageImage, PageResult } from "@/types";

export interface AggregatedImage extends PageImage {
  pageUrl: string;
}

export interface AggregatedValue {
  value: string;
  pageUrl: string;
}

export interface Aggregated {
  images: AggregatedImage[];
  videos: AggregatedValue[];
  prices: AggregatedValue[];
  phones: AggregatedValue[];
  emails: AggregatedValue[];
}

export function aggregate(results: PageResult[]): Aggregated {
  const images: AggregatedImage[] = [];
  const videos: AggregatedValue[] = [];
  const prices: AggregatedValue[] = [];
  const phones: AggregatedValue[] = [];
  const emails: AggregatedValue[] = [];

  const seenImg = new Set<string>();
  const seenVid = new Set<string>();
  const seenPhone = new Set<string>();
  const seenEmail = new Set<string>();

  for (const page of results) {
    for (const img of page.data.images) {
      if (seenImg.has(img.src)) continue;
      seenImg.add(img.src);
      images.push({ ...img, pageUrl: page.url });
    }
    for (const v of page.data.videos) {
      if (seenVid.has(v)) continue;
      seenVid.add(v);
      videos.push({ value: v, pageUrl: page.url });
    }
    // Prices repeat legitimately across pages, so keep them per-page.
    for (const p of page.data.prices) prices.push({ value: p, pageUrl: page.url });
    for (const ph of page.data.phones) {
      if (seenPhone.has(ph)) continue;
      seenPhone.add(ph);
      phones.push({ value: ph, pageUrl: page.url });
    }
    for (const em of page.data.emails) {
      if (seenEmail.has(em)) continue;
      seenEmail.add(em);
      emails.push({ value: em, pageUrl: page.url });
    }
  }

  return { images, videos, prices, phones, emails };
}
