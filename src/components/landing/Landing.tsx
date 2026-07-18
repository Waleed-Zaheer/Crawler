import { Suspense, lazy, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { ArrowRight, DollarSign, Globe, ImageIcon, Phone, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const HeroScene = lazy(() => import("./HeroScene").then((m) => ({ default: m.HeroScene })));

const FEATURES = [
  { icon: ImageIcon, label: "Images" },
  { icon: DollarSign, label: "Prices" },
  { icon: Phone, label: "Contacts" },
  { icon: Globe, label: "Links" },
  { icon: ShieldCheck, label: "robots.txt-safe" },
];

const fade = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function Landing({ onLaunch }: { onLaunch: (seedUrl: string) => void }) {
  const [url, setUrl] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onLaunch(url.trim() || "https://books.toscrape.com");
  };

  return (
    <div className="relative min-h-svh overflow-hidden bg-background">
      {/* 3D animated crawl-network background */}
      <div className="pointer-events-none absolute inset-0">
        <Suspense fallback={null}>
          <HeroScene />
        </Suspense>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background" />

      <div className="relative mx-auto flex min-h-svh max-w-3xl flex-col items-center justify-center px-4 py-20 text-center">
        <motion.div
          custom={0}
          variants={fade}
          initial="hidden"
          animate="show"
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-sm text-muted-foreground backdrop-blur"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          A real web scraper, not a link checker
        </motion.div>

        <motion.h1
          custom={1}
          variants={fade}
          initial="hidden"
          animate="show"
          className="font-heading text-4xl font-medium leading-[1.05] tracking-tight text-foreground sm:text-6xl"
        >
          Crawl any site.
          <br />
          <span className="text-primary">Extract everything.</span>
        </motion.h1>

        <motion.p
          custom={2}
          variants={fade}
          initial="hidden"
          animate="show"
          className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg"
        >
          Point it at a URL and it politely spiders the site — pulling images, videos, prices,
          phone numbers, and emails from every page into one live dashboard.
        </motion.p>

        <motion.form
          custom={3}
          variants={fade}
          initial="hidden"
          animate="show"
          onSubmit={submit}
          className="mt-9 flex w-full max-w-md flex-col gap-2.5 sm:flex-row"
        >
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="h-11 flex-1 bg-card/80 text-center backdrop-blur sm:text-left"
          />
          <Button type="submit" size="default" className="h-11 px-5">
            Start crawling
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.form>

        <motion.div
          custom={4}
          variants={fade}
          initial="hidden"
          animate="show"
          className="mt-8 flex flex-wrap items-center justify-center gap-2"
        >
          {FEATURES.map((f) => (
            <span
              key={f.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur"
            >
              <f.icon className="h-3.5 w-3.5 text-primary" />
              {f.label}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
