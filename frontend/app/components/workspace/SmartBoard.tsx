"use client";

import {
  Pencil,
  Eraser,
  Highlighter,
  MoreHorizontal,
  Undo,
  Trash2,
} from "lucide-react";
import { useRef, useState } from "react";
import { ReactSketchCanvas, ReactSketchCanvasRef } from "react-sketch-canvas";
import { AnimatePresence } from "framer-motion";

export default function SmartBoard({
  explanation,
  isLoading,
}: {
  explanation: string;
  isLoading: boolean;
}) {
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const [eraseMode, setEraseMode] = useState(false);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(4);

  // ... [Handlers remain the same: handlePenClick, handleHighlighterClick, etc.] ...
  const handlePenClick = () => {
    setEraseMode(false);
    setStrokeColor("#000000");
    setStrokeWidth(4);
  };

  const handleHighlighterClick = () => {
    setEraseMode(false);
    setStrokeColor("#FFFF0050"); // Yellow with transparency
    setStrokeWidth(15);
  };

  const handleEraserClick = () => {
    setEraseMode(true);
  };

  const handleUndo = () => {
    canvasRef.current?.undo();
  };

  const handleClear = () => {
    canvasRef.current?.clearCanvas();
  };

  return (
    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-border flex flex-col overflow-hidden relative h-full">
      {/* Toolbar */}
      <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-white/50 backdrop-blur-sm z-10 transition-colors">
        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
          <button
            onClick={handlePenClick}
            className={`p-2 rounded-md transition-all ${!eraseMode && strokeWidth === 4 ? "bg-white shadow-sm text-primary" : "hover:bg-white/50 text-foreground"}`}
            title="Pen"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={handleHighlighterClick}
            className={`p-2 rounded-md transition-all ${!eraseMode && strokeWidth === 15 ? "bg-white shadow-sm text-primary" : "hover:bg-white/50 text-foreground"}`}
            title="Highlighter"
          >
            <Highlighter className="h-4 w-4" />
          </button>
          <button
            onClick={handleEraserClick}
            className={`p-2 rounded-md transition-all ${eraseMode ? "bg-white shadow-sm text-primary" : "hover:bg-white/50 text-foreground"}`}
            title="Eraser"
          >
            <Eraser className="h-4 w-4" />
          </button>
          <div className="w-px h-6 bg-border mx-1" />
          <button
            onClick={handleUndo}
            className="p-2 rounded-md hover:bg-white hover:shadow-sm text-foreground transition-all"
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </button>
          <button
            onClick={handleClear}
            className="p-2 rounded-md hover:bg-white hover:shadow-sm text-red-500 transition-all"
            title="Clear Canvas"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Smart Canvas
          </span>
          <button className="p-2 hover:bg-muted rounded-full">
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 bg-[#F8FAFC] relative overflow-hidden cursor-crosshair">
        <ReactSketchCanvas
          ref={canvasRef}
          strokeWidth={strokeWidth}
          strokeColor={strokeColor}
          eraserWidth={30}
          canvasColor="transparent"
          style={{ border: "none", position: "absolute", inset: 0, zIndex: 1 }}
        />

        {/* Background Grid Pattern (Visual Only) */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: "radial-gradient(#E2E8F0 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        <div className="absolute top-6 left-6 z-0 pointer-events-none">
          <h1 className="text-2xl font-bold text-foreground/20 mb-4">Notes</h1>
          <p className="text-muted-foreground/40">
            Start writing or ask AI to explain...
          </p>
        </div>

        {/* AI Explanation Box (Overlay) */}
        <AnimatePresence>
          {(isLoading || explanation) && (
            <div className="absolute bottom-6 left-6 right-6 p-4 bg-blue-50/90 backdrop-blur-sm border border-blue-100 rounded-xl shadow-lg z-20 max-w-2xl mx-auto">
              <h3 className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-2">
                ✨ AI Explanation
              </h3>
              <div className="text-sm text-blue-900 leading-relaxed font-mono">
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <span className="animate-pulse">AI is writing...</span>
                    <span className="flex gap-1">
                      <span className="w-1 h-1 bg-blue-700 rounded-full animate-bounce delay-0" />
                      <span className="w-1 h-1 bg-blue-700 rounded-full animate-bounce delay-100" />
                      <span className="w-1 h-1 bg-blue-700 rounded-full animate-bounce delay-200" />
                    </span>
                  </div>
                ) : (
                  explanation
                )}
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
