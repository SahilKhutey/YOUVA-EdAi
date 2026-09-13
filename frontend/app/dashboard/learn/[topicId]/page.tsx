"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { useRouter, useParams } from "next/navigation";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { ThinkingIndicator } from "@/app/components/ThinkingIndicator";
import { VoiceTutor } from "@/app/components/workspace/VoiceTutor";

import { AlertCircle, Lock, WifiOff, Inbox, RefreshCw, ArrowLeft } from "lucide-react";

interface Message {
  id: number;
  role: "USER" | "AI";
  content: string;
}

type ViewState =
  | "loading"
  | "empty"
  | "success"
  | "validation-error"
  | "authorization-error"
  | "network-error"
  | "server-error";

export default function LearningPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const topicId = params.topicId as string;

  const [viewState, setViewState] = useState<ViewState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
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
      setViewState("loading");
      setErrorMessage("");

      // Primary canonical learning session start
      const response = await api.post("/learning/start", { topicId });
      if (!response.data || !response.data.sessionId) {
        setViewState("empty");
        setErrorMessage("No active learning curriculum found for this topic.");
        return;
      }

      setSessionId(response.data.sessionId);
      setMessages([{ id: 1, role: "AI", content: response.data.message || "Welcome! Let's begin our lesson." }]);
      setViewState("success");
    } catch (err: any) {
      console.error("Failed to start session:", err);
      if (!err.response) {
        setViewState("network-error");
        setErrorMessage("Network connection lost. Please verify your internet connection.");
      } else if (err.response.status === 401 || err.response.status === 403) {
        setViewState("authorization-error");
        setErrorMessage(
          err.response.data?.message || "Verifiable parental consent or enrollment authorization required."
        );
      } else if (err.response.status === 400) {
        setViewState("validation-error");
        setErrorMessage(err.response.data?.message || "Invalid topic parameters provided.");
      } else if (err.response.status === 404) {
        setViewState("empty");
        setErrorMessage("The requested learning topic is currently empty or unavailable.");
      } else {
        setViewState("server-error");
        setErrorMessage(
          err.response.data?.message || "Learning service temporarily unavailable. Your data is safely preserved."
        );
      }
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
    } catch (err: any) {
      console.error("Failed to send message:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          role: "AI",
          content: "Sorry, I had trouble processing that. Deterministic guidance: Please review the previous equation step and try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  if (authLoading || viewState === "loading") {
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

  // Explicit Non-Success State Views (N2.17)
  if (viewState === "empty") {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/10 p-6">
        <div className="max-w-md w-full bg-card p-8 rounded-xl shadow-sm border border-border text-center space-y-4">
          <Inbox className="w-12 h-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Topic Content Empty</h2>
          <p className="text-sm text-muted-foreground">
            {errorMessage || "No learning modules or questions have been released for this topic yet."}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => router.push("/dashboard/subjects")}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Explore Other Subjects
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (viewState === "authorization-error") {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/10 p-6">
        <div className="max-w-md w-full bg-card p-8 rounded-xl shadow-sm border border-destructive/30 text-center space-y-4">
          <Lock className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
          <p className="text-sm text-muted-foreground">
            {errorMessage || "Verifiable parental consent under Section 9 of DPDP Act 2023 is required before accessing learning activities."}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => router.push("/parent/consent")}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Manage Consent
            </button>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-lg hover:bg-secondary/90 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (viewState === "network-error") {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/10 p-6">
        <div className="max-w-md w-full bg-card p-8 rounded-xl shadow-sm border border-border text-center space-y-4">
          <WifiOff className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Connection Unavailable</h2>
          <p className="text-sm text-muted-foreground">
            {errorMessage || "Unable to reach YOUVA-EdAI learning servers. Please check your network connection."}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={startSession}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (viewState === "validation-error" || viewState === "server-error") {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/10 p-6">
        <div className="max-w-md w-full bg-card p-8 rounded-xl shadow-sm border border-destructive/30 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold text-foreground">
            {viewState === "validation-error" ? "Invalid Request" : "System Error"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {errorMessage || "An unexpected error occurred while loading your learning session."}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={startSession}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-lg flex items-center gap-2 hover:bg-secondary/90 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </button>
          </div>
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
