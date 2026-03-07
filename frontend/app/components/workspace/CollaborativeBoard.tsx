"use client";

import { useEffect, useState, useRef } from "react";
import { Stage, Layer, Line, Circle, Text, Group } from "react-konva";
import { io, Socket } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import { useSmoothCursor } from "@/hooks/useSmoothCursor";
import { MotionTokens } from "@/lib/motion-tokens";
import { useAuth } from "@/context/AuthContext";
import {
  Pencil,
  Eraser,
  Highlighter,
  MoreHorizontal,
  Undo,
  Trash2,
  Type,
} from "lucide-react";
import LiveStroke from "./LiveStroke";
import LiveText from "./LiveText";
import { AnimatePresence, motion } from "framer-motion";

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  id: string;
  points: number[];
  color: string;
  width: number;
  tool: "pen" | "highlighter" | "eraser";
  isComplete: boolean;
}

interface TextObject {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  isEditing: boolean; // Local state
}

interface UserCursor {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
}

interface CollaborativeBoardProps {
  explanation?: string;
  isLoading?: boolean;
}

const COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEEAD"];

// Cursor Component for Remote Users
const RemoteCursor = ({ user }: { user: UserCursor }) => {
  const smoothPos = useSmoothCursor({ x: user.x, y: user.y });

  if (!smoothPos) return null;

  return (
    <Group x={smoothPos.x} y={smoothPos.y}>
      {/* Cursor Ring */}
      <Circle
        radius={8}
        stroke={user.color}
        strokeWidth={2}
        fill={user.color} // low opacity fill for "Glow"
        opacity={0.4}
      />
      {/* Center Dot */}
      <Circle radius={2} fill={user.color} />
      {/* Name Tag */}
      <Group y={16}>
        <Text text={user.name} fontSize={12} fill="white" padding={4} y={2} />
        <Text // BG simulation
          text={user.name}
          fontSize={12}
          fill={user.color}
          opacity={0.8}
          padding={4}
          fontStyle="bold"
          shadowColor="black"
          shadowBlur={2}
          shadowOpacity={0.2}
        />
      </Group>
    </Group>
  );
};

export default function CollaborativeBoard({
  explanation,
  isLoading,
}: CollaborativeBoardProps) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  // Board State
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [texts, setTexts] = useState<TextObject[]>([]);
  const [remoteUsers, setRemoteUsers] = useState<UserCursor[]>([]);

  // Interaction State
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [tool, setTool] = useState<"pen" | "highlighter" | "eraser" | "text">(
    "pen",
  );
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(4);

  const stageRef = useRef<any>(null);
  const isDrawing = useRef(false);

  // Initial Setup
  useEffect(() => {
    // Connect to namespace
    const newSocket = io(`${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'}/board`, {
      transports: ["websocket"],
    });

    newSocket.on("connect", () => {
      console.log("Connected to board gateway");
      newSocket.emit("join-board", {
        boardId: "default-room", // Hardcoded room for now
        user: {
          name: user?.name || "Anonymous",
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        },
      });
    });

    newSocket.on("user-joined", (newUser: any) => {
      console.log("User joined:", newUser);
      setRemoteUsers((prev) => {
        if (prev.find((u) => u.id === newUser.id)) return prev;
        return [...prev, { ...newUser, x: 0, y: 0 }];
      });
    });

    newSocket.on("user-left", ({ id }: { id: string }) => {
      setRemoteUsers((prev) => prev.filter((u) => u.id !== id));
    });

    newSocket.on(
      "cursor-update",
      (data: { id: string; x: number; y: number }) => {
        setRemoteUsers((prev) =>
          prev.map((u) =>
            u.id === data.id ? { ...u, x: data.x, y: data.y } : u,
          ),
        );
      },
    );

    newSocket.on("stroke-added", (data: { stroke: Stroke }) => {
      setStrokes((prev) => [...prev, data.stroke]);
    });

    newSocket.on("text-added", (data: { text: TextObject }) => {
      setTexts((prev) => [...prev, { ...data.text, isEditing: false }]);
    });

    newSocket.on("text-updated", (data: { id: string; text: string }) => {
      setTexts((prev) =>
        prev.map((t) => (t.id === data.id ? { ...t, text: data.text } : t)),
      );
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // Tool Handlers
  const handlePenClick = () => {
    setTool("pen");
    setStrokeColor("#000000");
    setStrokeWidth(4);
  };
  const handleHighlighterClick = () => {
    setTool("highlighter");
    setStrokeColor("#FFFF00"); // Yellow
    setStrokeWidth(20);
  };
  const handleEraserClick = () => {
    setTool("eraser");
    setStrokeColor("#FFFFFF");
    setStrokeWidth(30);
  };
  const handleTextToolClick = () => {
    setTool("text");
  };
  const handleClear = () => {
    setStrokes([]);
    setTexts([]);
    // emit clear event if we had one
  };

  // Input Handlers
  const handleMouseDown = (e: any) => {
    if (tool === "text") {
      handleStageClick(e);
      return;
    }

    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    const newStroke: Stroke = {
      id: uuidv4(),
      points: [pos.x, pos.y],
      color: strokeColor,
      width: strokeWidth,
      tool: tool as "pen" | "highlighter" | "eraser",
      isComplete: false,
    };
    setCurrentStroke(newStroke);
  };

  const handleStageClick = (e: any) => {
    if (tool === "text") {
      const pos = e.target.getStage().getPointerPosition();
      const newText: TextObject = {
        id: uuidv4(),
        x: pos.x,
        y: pos.y,
        text: "Type here...",
        color: "#000000",
        isEditing: true,
      };

      setTexts((prev) => [...prev, newText]);
      setTool("pen"); // Reset to pen
    }
  };

  const handleMouseMove = (e: any) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();

    if (socket) {
      socket.emit("cursor-move", {
        boardId: "default-room",
        x: pos.x,
        y: pos.y,
      });
    }

    if (!isDrawing.current || !currentStroke) return;

    const updatedStroke = {
      ...currentStroke,
      points: [...currentStroke.points, pos.x, pos.y],
    };
    setCurrentStroke(updatedStroke);
  };

  const handleMouseUp = () => {
    if (!isDrawing.current || !currentStroke) return;
    isDrawing.current = false;

    const completedStroke = { ...currentStroke, isComplete: true };
    setStrokes((prev) => [...prev, completedStroke]);
    setCurrentStroke(null);

    if (socket) {
      socket.emit("draw-stroke", {
        boardId: "default-room",
        stroke: completedStroke,
      });
    }
  };

  // Text Handlers
  const handleTextUpdate = (id: string, newContent: string) => {
    setTexts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, text: newContent } : t)),
    );
    if (socket) {
      socket.emit("text-update", {
        boardId: "default-room",
        id,
        text: newContent,
      });
    }
  };

  const handleTextBlur = (id: string) => {
    const textObj = texts.find((t) => t.id === id);
    if (textObj) {
      const finalObj = { ...textObj, isEditing: false };
      setTexts((prev) => prev.map((t) => (t.id === id ? finalObj : t)));
      if (socket) {
        socket.emit("text-added", { boardId: "default-room", text: finalObj });
      }
    }
  };

  return (
    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-border flex flex-col overflow-hidden relative h-full">
      {/* Toolbar */}
      <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-white/50 backdrop-blur-sm z-10 transition-colors absolute top-0 left-0 right-0">
        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
          <button
            onClick={handlePenClick}
            className={`p-2 rounded-md transition-all ${tool === "pen" ? "bg-white shadow-sm text-primary" : "hover:bg-white/50 text-foreground"}`}
            title="Pen"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={handleHighlighterClick}
            className={`p-2 rounded-md transition-all ${tool === "highlighter" ? "bg-white shadow-sm text-primary" : "hover:bg-white/50 text-foreground"}`}
            title="Highlighter"
          >
            <Highlighter className="h-4 w-4" />
          </button>
          <button
            onClick={handleEraserClick}
            className={`p-2 rounded-md transition-all ${tool === "eraser" ? "bg-white shadow-sm text-primary" : "hover:bg-white/50 text-foreground"}`}
            title="Eraser"
          >
            <Eraser className="h-4 w-4" />
          </button>
          <button
            onClick={handleTextToolClick}
            className={`p-2 rounded-md transition-all ${tool === "text" ? "bg-white shadow-sm text-primary" : "hover:bg-white/50 text-foreground"}`}
            title="Text"
          >
            <Type className="h-4 w-4" />
          </button>
          <div className="w-px h-6 bg-border mx-1" />
          <button
            onClick={handleClear}
            className="p-2 rounded-md hover:bg-white hover:shadow-sm text-red-500 transition-all"
            title="Clear Canvas"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${socket?.connected ? "bg-green-500" : "bg-yellow-500 animate-pulse"}`}
          ></div>
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            {socket?.connected ? "Live Sync" : "Connecting..."}
          </span>
        </div>
      </div>

      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        ref={stageRef}
        style={{ background: "#F8FAFC" }}
      >
        <Layer>
          {/* Grid */}
          {[...Array(20)].map((_, i) =>
            [...Array(20)].map((_, j) => (
              <Circle
                key={`${i}-${j}`}
                x={i * 40}
                y={j * 40}
                radius={1}
                fill="#E2E8F0"
              />
            )),
          )}

          {/* Strokes */}
          {strokes.map((stroke) => (
            <LiveStroke
              key={stroke.id}
              points={stroke.points}
              color={stroke.color}
              width={stroke.width}
              isComplete={stroke.isComplete}
            />
          ))}

          {/* Texts */}
          {texts.map((t) => (
            <LiveText
              key={t.id}
              {...t}
              onUpdate={(val) => handleTextUpdate(t.id, val)}
              onBlur={() => handleTextBlur(t.id)}
            />
          ))}

          {/* Current Stroke */}
          {currentStroke && (
            <LiveStroke
              points={currentStroke.points}
              color={currentStroke.color}
              width={currentStroke.width}
              isComplete={false}
            />
          )}
        </Layer>
        <Layer>
          {/* Remote Cursors */}
          {remoteUsers.map((u) => (
            <RemoteCursor key={u.id} user={u} />
          ))}
        </Layer>
      </Stage>

      {/* AI Explanation Overlay */}
      <AnimatePresence>
        {(isLoading || explanation) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-6 left-6 right-6 p-4 bg-blue-50/90 backdrop-blur-sm border border-blue-100 rounded-xl shadow-lg z-20 max-w-2xl mx-auto pointer-events-none"
          >
            <h3 className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-2">
              ✨ AI Explanation
            </h3>
            <div className="text-sm text-blue-900 leading-relaxed font-mono">
              {isLoading ? (
                <span className="animate-pulse">AI is writing...</span>
              ) : (
                explanation
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
