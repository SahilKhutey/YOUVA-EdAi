"use client";

import { FileText, X } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function NotesCard({ notes }: { notes?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className="flex-1 bg-white rounded-2xl shadow-sm border border-border p-6 flex flex-col items-center justify-center gap-4 hover:border-accent/50 transition-colors cursor-pointer group h-[240px]"
      >
        <div className="w-16 h-16 bg-amber-50 text-accent rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
          <FileText className="h-8 w-8" />
        </div>
        <h4 className="font-semibold text-foreground">Structured Text</h4>
        <p className="text-sm text-muted-foreground text-center">
          Read the organized transcript.
        </p>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-accent" />
                  Structured Notes
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto whitespace-pre-wrap leading-relaxed text-foreground/80">
                {notes ||
                  "No notes available for this session yet. Try asking AI to generate an explanation first."}
              </div>

              <div className="p-4 border-t border-border bg-muted/10 flex justify-end">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
