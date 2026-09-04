"use client";
import { motion } from "framer-motion";

export function ThinkingIndicator() {
  return (
    <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg w-fit">
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-primary rounded-full"
            animate={{
              y: ["0%", "-50%", "0%"],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      <span className="text-sm font-medium text-muted-foreground animate-pulse">
        AI is thinking...
      </span>
    </div>
  );
}
