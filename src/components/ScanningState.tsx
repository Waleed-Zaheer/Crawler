import { motion } from "framer-motion";
import { Radar } from "lucide-react";

export function ScanningState({ seedUrl }: { seedUrl: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-primary/40"
          initial={{ scale: 0.6, opacity: 0.8 }}
          animate={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-primary/40"
          initial={{ scale: 0.6, opacity: 0.8 }}
          animate={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut", delay: 0.8 }}
        />
        <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary">
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <Radar className="h-5 w-5" />
          </motion.span>
        </div>
      </div>
      <div>
        <p className="font-medium text-foreground">Scanning the site…</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Fetching pages from{" "}
          <span className="font-mono text-xs text-foreground">{seedUrl}</span> and extracting
          images, prices, and contacts. Results appear when the crawl finishes.
        </p>
      </div>
    </div>
  );
}
