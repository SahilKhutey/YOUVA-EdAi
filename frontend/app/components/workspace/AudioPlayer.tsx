"use client";

import { Mic, Play, Pause, RotateCcw } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function AudioPlayer({ topic }: { topic?: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<number>(0);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const resetPlayback = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  useEffect(() => {
    let animationFrameId: number;

    if (isPlaying) {
      const animate = () => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return prev + 0.5; // Speed of playback simulation
        });
        animationFrameId = requestAnimationFrame(animate);
      };
      animate();
    } else {
      cancelAnimationFrame(animationFrameId!);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying]);

  return (
    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-border p-6 flex flex-col items-center justify-between gap-4 hover:border-primary/50 transition-colors cursor-pointer group h-[240px]">
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${isPlaying ? "bg-primary text-white scale-110 shadow-lg shadow-primary/20" : "bg-blue-50 text-primary group-hover:scale-105"}`}
      >
        {isPlaying ? (
          <div className="flex gap-1 items-end h-6 pb-1">
            <span className="w-1 bg-white animate-[bounce_1s_infinite] h-3" />
            <span className="w-1 bg-white animate-[bounce_1.2s_infinite] h-5" />
            <span className="w-1 bg-white animate-[bounce_0.8s_infinite] h-4" />
            <span className="w-1 bg-white animate-[bounce_1.1s_infinite] h-6" />
          </div>
        ) : (
          <Mic className="h-8 w-8" />
        )}
      </div>

      <div className="text-center w-full">
        <h4
          className="font-semibold text-foreground truncate max-w-[200px] mx-auto"
          title={topic || "Audio Summary"}
        >
          {topic || "Audio Summary"}
        </h4>
        <p className="text-xs text-muted-foreground mt-1">
          {isPlaying ? "Playing summary..." : "Listen to key takeaways"}
        </p>
      </div>

      {/* Playback Controls */}
      <div className="w-full flex items-center gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className="w-10 h-10 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center text-foreground transition-colors"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </button>

        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            resetPlayback();
          }}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
