"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { useRouter, useParams } from "next/navigation";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { ThinkingIndicator } from "@/app/components/ThinkingIndicator";
import { VoiceTutor } from "@/app/components/workspace/VoiceTutor";

interface Message {
  id: number;
  role: "USER" | "AI";
  content: string;
}

export default function LearningPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { topicId } = params;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user && topicId) {
      startSession();
    }
  }, [user, topicId]);

  const startSession = async () => {
    try {
      setLoading(true);
      const response = await api.post("/learning/start", { topicId });
      setSessionId(response.data.sessionId);
      setMessages([{ id: 1, role: "AI", content: response.data.message }]);
    } catch (err) {
      console.error("Failed to start session:", err);
      // Handle error (e.g., topic not found)
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !sessionId || sending) return;

    const userMsg: Message = { id: Date.now(), role: "USER", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const response = await api.post("/learning/chat", {
        sessionId,
        message: userMsg.content,
      });
      const aiMsg: Message = {
        id: Date.now() + 1,
        role: "AI",
        content: response.data.message,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("Failed to send message:", err);
      // Optionally add an error message to chat
    } finally {
      setSending(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col h-screen bg-muted/20">
        <header className="bg-card shadow-sm px-4 py-3 flex items-center justify-between border-b border-border">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-32" />
          <div className="w-8"></div>
        </header>
        <div className="flex-1 p-4 space-y-4">
          <div className="flex justify-start">
            <Skeleton className="h-10 w-48 rounded-lg rounded-bl-none" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-10 w-64 rounded-lg rounded-br-none" />
          </div>
          <div className="flex justify-start">
            <Skeleton className="h-24 w-3/4 rounded-lg rounded-bl-none" />
          </div>
        </div>
        <div className="bg-card border-t border-border p-4">
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 h-screen bg-muted/20 gap-4 p-4">

      {/* Existing Chat Area */}
      <div className="flex flex-col bg-card overflow-hidden h-full clay-card">
        {/* Header */}
        <header className="bg-card shadow-sm px-4 py-3 flex items-center justify-between border-b border-border">
          <button
            onClick={() => router.back()}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center transition-colors"
          >
            &larr; Back
          </button>
          <h1 className="text-lg font-bold text-foreground">Basic Lesson</h1>
          <div className="w-8"></div> {/* Spacer for centering */}
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "USER" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg shadow-sm ${msg.role === "USER"
                  ? "bg-primary text-primary-foreground rounded-br-none"
                  : "bg-card text-foreground rounded-bl-none border border-border"
                  }`}
              >
                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="max-w-xs md:max-w-md px-4 py-2 rounded-lg bg-card border border-border rounded-bl-none shadow-sm">
                <ThinkingIndicator />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-card border-t border-border p-4">
          <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              className="flex-1 rounded-md border-input bg-background shadow-sm focus:border-ring focus:ring-ring px-4 py-2 border"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className={`px-4 py-2 font-medium text-primary-foreground transition-colors clay-btn ${sending || !input.trim()
                ? "bg-primary/50 cursor-not-allowed"
                : "bg-primary hover:bg-primary/90"
                }`}
            >
              {sending ? "..." : "Send"}
            </button>
          </form>
        </div>
      </div>

      {/* New AI Mentor Sidebar */}
      <div className="flex flex-col h-full">
        <VoiceTutor topicId={topicId as string} topicTitle="Current Topic" />
      </div>

    </div>
  );
}
