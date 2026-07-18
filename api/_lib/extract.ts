import type { CheerioAPI } from "cheerio";

const PRICE_RE = /(?:[$£€¥₹]\s?\d[\d,]*(?:\.\d{1,2})?)|(?:\b\d[\d,]*(?:\.\d{1,2})?\s?(?:USD|EUR|GBP|CAD|AUD)\b)/g;
const PHONE_RE = /\+?\d{1,3}?[-.\s]?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const VIDEO_EMBED_HOSTS = ["youtube.com", "youtu.be", "player.vimeo.com", "vimeo.com"];

export interface ExtractedData {
  images: { src: string; alt: string | null }[];
  videos: string[];
  prices: string[];
  phones: string[];
  emails: string[];
}

function dedupeCapped(values: Iterable<string>, cap: number): string[] {
  return [...new Set(values)].slice(0, cap);
}

function looksLikePhone(match: string): boolean {
  const digits = match.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return false;
  return match.startsWith("+") || /[-.\s()]/.test(match);
}

function normalize(raw: string | undefined, base: string): string | null {
  if (!raw) return null;
  try {
    return new URL(raw, base).toString();
  } catch {
    return null;
  }
}

export function extractPageData($: CheerioAPI, pageUrl: string): ExtractedData {
  const images: { src: string; alt: string | null }[] = [];
  const seenImages = new Set<string>();
  $("img[src]").each((_, el) => {
    const src = normalize($(el).attr("src"), pageUrl);
    if (!src || seenImages.has(src)) return;
    seenImages.add(src);
    if (images.length < 30) {
      images.push({ src, alt: $(el).attr("alt")?.trim() || null });
    }
  });

  const videos = new Set<string>();
  $("video[src], video source[src]").each((_, el) => {
    const src = normalize($(el).attr("src"), pageUrl);
    if (src) videos.add(src);
  });
  $("iframe[src]").each((_, el) => {
    const src = normalize($(el).attr("src"), pageUrl);
    if (!src) return;
    try {
      const host = new URL(src).hostname.replace(/^www\./, "");
      if (VIDEO_EMBED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) videos.add(src);
    } catch {
      // ignore malformed embed URLs
    }
  });

  // Scan visible text only — strip script/style/noscript so we don't match
  // prices/phones/emails buried in JS or CSS.
  const $text = $.root().clone();
  $text.find("script, style, noscript").remove();
  const text = $text.text();

  return {
    images,
    videos: dedupeCapped(videos, 20),
    prices: dedupeCapped(text.match(PRICE_RE) ?? [], 20),
    phones: dedupeCapped((text.match(PHONE_RE) ?? []).filter(looksLikePhone), 15),
    emails: dedupeCapped(text.match(EMAIL_RE) ?? [], 15),
  };
}
