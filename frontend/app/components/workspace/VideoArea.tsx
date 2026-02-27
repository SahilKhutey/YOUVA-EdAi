"use client";

import { Bookmark, Sparkles, Settings2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

// Dynamically import ReactPlayer to avoid SSR issues
const ReactPlayer = dynamic(() => import("react-player"), {
  ssr: false,
}) as any;

export default function VideoArea({
  videoUrl,
  topic,
  isLoading,
}: {
  videoUrl: string;
  topic: string;
  isLoading: boolean;
}) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-border flex flex-col overflow-hidden aspect-video relative">
      {/* Video Player Area */}
      <div className="flex-1 bg-black relative group cursor-pointer overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-white/80 text-sm font-medium animate-pulse">
                Finding best video...
              </p>
            </div>
          </div>
        )}

        {hasMounted && (
          <div className="w-full h-full">
            {/* @ts-ignore */}
            <ReactPlayer
              url={videoUrl}
              width="100%"
              height="100%"
              controls={true}
              light={false}
              playing={false}
            />
          </div>
        )}

        {/* Bookmark Button (Top Right Absolute) */}
        <button className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors text-primary z-10">
          <Bookmark className="h-5 w-5" />
        </button>

        {/* AI Explain Button (Bottom Right Floating) */}
        <button className="absolute bottom-16 right-4 flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full shadow-md hover:bg-primary-hover transition-all duration-200 group-hover:scale-105 z-10">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-medium">AI Explain</span>
        </button>
      </div>

      {/* Controls / Metadata */}
      <div className="h-16 px-4 flex items-center justify-between border-t border-border bg-white z-20">
        <div className="text-sm font-medium text-foreground truncate max-w-[70%]">
          Topic: {topic}
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted">
            <Settings2 className="h-4 w-4" />
          </button>
          <select className="bg-transparent text-sm font-medium text-muted-foreground focus:outline-none cursor-pointer">
            <option>1x</option>
            <option>1.25x</option>
            <option>1.5x</option>
            <option>2x</option>
          </select>
        </div>
      </div>
    </div>
  );
}
