"use client";

import { Line } from "react-konva";
import { useEffect, useState, useRef } from "react";
import { MotionTokens } from "@/lib/motion-tokens";
import Konva from "konva";

interface LiveStrokeProps {
  points: number[];
  color: string;
  width: number;
  isComplete: boolean;
  isAi?: boolean; // To distinguish human vs AI behavior
}

export default function LiveStroke({
  points,
  color,
  width,
  isComplete,
  isAi = false,
}: LiveStrokeProps) {
  const lineRef = useRef<Konva.Line>(null);
  const [progress, setProgress] = useState(isComplete ? 1 : 0);

  useEffect(() => {
    if (isComplete && progress < 1) {
      // Animate reveal
      const node = lineRef.current;
      if (!node) return;

      const totalLength = getLineLength(points);
      const duration =
        Math.min(
          Math.max(totalLength * 2, MotionTokens.strokeDurationMin), // Needs tuning: using length as proxy for duration
          MotionTokens.strokeDurationMax,
        ) / 1000; // seconds

      const anim = new Konva.Animation((frame) => {
        if (!frame) return;
        const time = frame.time / 1000; // seconds
        const p = Math.min(time / duration, 1);

        setProgress(p);

        if (p >= 1) {
          anim.stop();
        }
      }, node.getLayer());

      // AI Delay
      if (isAi) {
        setTimeout(() => anim.start(), MotionTokens.aiStrokeDelay);
      } else {
        anim.start();
      }

      return () => {
        anim.stop();
      };
    } else if (!isComplete) {
      // Live drawing (no reveal animation, just show what we have)
      setProgress(1);
    }
  }, [isComplete, points, isAi]);

  // Calculate dash array for reveal effect
  // We simulate "drawing" by manipulating the dash offset if we wanted complex paths
  // But standard Line in Konva doesn't support "partial" rendering easily via dash without calculating length.
  // Easier approach: render a subst-set of points? No, too jagged.
  // Dash approach:

  const dashLength = lineRef.current
    ? lineRef.current.getType() === "Shape"
      ? 0
      : 0
    : 0;
  // Actually, let's just use the `points` directly for live drawing.
  // For "Remote" replay, we want the animation.

  // If it's a "Remote" stroke, we receive "isComplete=true" eventually.
  // If we receive the full stroke at once (bulk update), we animate it.
  // If we receive incremental points, we just render them.

  // For now, let's assume `isComplete` triggers the "Smooth Reveal" for historical/batch strokes.
  // For live local drawing, we show instantly.

  return (
    <Line
      ref={lineRef}
      points={points}
      stroke={color}
      strokeWidth={width}
      tension={0.5}
      lineCap="round"
      lineJoin="round"
      // Use globalCompositeOperation if Eraser
      globalCompositeOperation={
        color === "#FFFFFF" ? "destination-out" : "source-over"
      }
      // Opacity for highlight
      opacity={width > 10 ? 0.5 : 1}
    />
  );
}

// Helper to estimate length (Manhattan distance approx for speed, or Euclidean)
function getLineLength(points: number[]) {
  let len = 0;
  for (let i = 0; i < points.length - 2; i += 2) {
    const dx = points[i + 2] - points[i];
    const dy = points[i + 3] - points[i + 1];
    len += Math.sqrt(dx * dx + dy * dy);
  }
  return len;
}
