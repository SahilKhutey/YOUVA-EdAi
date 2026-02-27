"use client";

import { Text, Group, Rect } from "react-konva";
import { useEffect, useState, useRef } from "react";
import { MotionTokens } from "@/lib/motion-tokens";
import { Html } from "react-konva-utils";
import Konva from "konva";

interface LiveTextProps {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  isEditing: boolean;
  onUpdate?: (newText: string) => void;
  onBlur?: () => void;
}

export default function LiveText({
  id,
  x,
  y,
  text,
  color,
  isEditing,
  onUpdate,
  onBlur,
}: LiveTextProps) {
  const [displayedText, setDisplayedText] = useState(text);
  const [caretVisible, setCaretVisible] = useState(true);
  const lastWordCount = useRef(0);
  const groupRef = useRef<Konva.Group>(null);

  // Entry Animation: Scale Up (Object Creation Animation)
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.scale({ x: 0.96, y: 0.96 });
      groupRef.current.to({
        scaleX: 1,
        scaleY: 1,
        duration: MotionTokens.objectEnterDuration,
        easing: Konva.Easings.EaseOut,
      });
    }
  }, []); // Run once on mount

  // Blinking Caret Effect
  useEffect(() => {
    if (!isEditing) return;
    const interval = setInterval(() => {
      setCaretVisible((v) => !v);
    }, 500);
    return () => clearInterval(interval);
  }, [isEditing]);

  // Progressive Word Reveal Logic (for remote updates or "replay")
  useEffect(() => {
    if (isEditing) {
      // Instant update for local user
      setDisplayedText(text);
      lastWordCount.current = text.split(" ").length;
    } else {
      // Remote update: check if words added
      const words = text.split(" ");
      if (words.length > lastWordCount.current) {
        // Ideally this would queue animation. For MVP, just update.
        setDisplayedText(text);
      } else {
        setDisplayedText(text);
      }
      lastWordCount.current = words.length;
    }
  }, [text, isEditing]);

  // Input Area for Editing (HTML overlay)
  if (isEditing) {
    return (
      <Html groupProps={{ x, y }} divProps={{ style: { opacity: 1 } }}>
        <textarea
          value={text}
          onChange={(e) => onUpdate && onUpdate(e.target.value)}
          onBlur={onBlur}
          autoFocus
          style={{
            fontSize: "20px",
            fontFamily: "sans-serif",
            color: color,
            background: "transparent",
            border: "1px dashed rgba(255, 165, 0, 0.5)", // Orange dashed for "Editing" conflict visual
            outline: "none",
            resize: "none",
            overflow: "hidden",
            minWidth: "100px",
            whiteSpace: "pre-wrap",
          }}
        />
      </Html>
    );
  }

  return (
    <Group x={x} y={y} ref={groupRef}>
      <Text
        text={displayedText}
        fontSize={20}
        fill={color}
        fontFamily="sans-serif"
      />
    </Group>
  );
}
