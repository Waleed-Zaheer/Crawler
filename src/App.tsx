import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Dashboard } from "@/components/Dashboard";
import { Landing } from "@/components/landing/Landing";
import { useCrawlStore } from "@/store/crawlStore";

type View = "landing" | "app";

function App() {
  const [view, setView] = useState<View>("landing");
  const setOption = useCrawlStore((s) => s.setOption);
  const startCrawl = useCrawlStore((s) => s.startCrawl);

  const launch = (seedUrl: string) => {
    setOption("seedUrl", seedUrl);
    setView("app");
    void startCrawl();
  };

  return (
    <AnimatePresence mode="wait">
      {view === "landing" ? (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.4 }}
        >
          <Landing onLaunch={launch} />
        </motion.div>
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Dashboard onHome={() => setView("landing")} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;
