"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "@/app/components/MainLayout";
import VideoArea from "@/app/components/workspace/VideoArea";
import dynamic from "next/dynamic";
const CollaborativeBoard = dynamic(
  () => import("@/app/components/workspace/CollaborativeBoard"),
  { ssr: false },
);
import DocumentUpload from "@/app/components/workspace/DocumentUpload";
import InputBar from "@/app/components/workspace/InputBar";
import AudioPlayer from "@/app/components/workspace/AudioPlayer";
import NotesCard from "@/app/components/workspace/NotesCard";
import { Download, MonitorPlay } from "lucide-react";
import api from "@/lib/axios";

export default function WorkspacePage() {
  const [mode, setMode] = useState<"input" | "output">("input");

  // Global Workspace State
  const [topic, setTopic] = useState<string>("Introduction to React");
  const [videoUrl, setVideoUrl] = useState<string>(
    "https://www.youtube.com/watch?v=SqcY0GlETPk",
  );
  const [explanation, setExplanation] = useState<string>(
    "Welcome to the workspace! Ask a question below to get started.",
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    // Reset state slightly to show transition
    setExplanation("");

    try {
      // 1. Generate Explanation via AI
      const response = await api.post("/ai/generate", {
        prompt: `Explain this concept simply for a student: ${query}`,
      });
      const aiText = response.data;

      // 2. Update State
      setTopic(query);
      setExplanation(aiText);

      // Mock logic for video selection based on keywords (Real implementation would use YouTube API)
      if (query.toLowerCase().includes("thermodynamics")) {
        setVideoUrl("https://www.youtube.com/watch?v=LXb3EKWsInQ");
      } else if (query.toLowerCase().includes("calculus")) {
        setVideoUrl("https://www.youtube.com/watch?v=WSDBuB26zXo");
      } else {
        setVideoUrl("https://www.youtube.com/watch?v=ExampleVideoID"); // Fallback
      }
    } catch (error) {
      console.error("AI Generation failed:", error);
      setExplanation(
        "Sorry, I couldn't generate an explanation at this time. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = (fileName: string) => {
    setIsLoading(true);
    setExplanation("");

    // Simulate analyzing the document
    setTimeout(() => {
      setTopic(`Analysis of ${fileName}`);
      setExplanation(
        `I have analyzed **${fileName}**. It appears to cover advanced physics concepts. Here is a summary of the key points:\n\n1. **Newton's Laws**: The document discusses the three laws of motion in depth.\n2. **Energy Conservation**: There are several examples regarding potential and kinetic energy.\n3. **Thermodynamics**: The final chapter touches on entropy and heat transfer.\n\nWould you like me to create a quiz based on this file?`,
      );
      setIsLoading(false);
    }, 2000);
  };

  return (
    <MainLayout>
      <div className="relative h-[calc(100vh-72px)] overflow-hidden bg-background font-sans">
        {/* Mode Switcher */}
        <div className="absolute top-4 right-[80px] z-50 flex gap-2 hidden xl:flex">
          <button
            onClick={() => setMode("input")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "input" ? "bg-primary text-white" : "bg-white text-muted-foreground shadow-sm hover:text-foreground"}`}
          >
            Input Mode
          </button>
          <button
            onClick={() => setMode("output")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "output" ? "bg-primary text-white" : "bg-white text-muted-foreground shadow-sm hover:text-foreground"}`}
          >
            Output Mode
          </button>
        </div>

        <AnimatePresence mode="wait">
          {mode === "input" ? (
            <motion.div
              key="input-workspace"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex flex-col min-h-screen bg-background"
            >
              {/* Main Grid Area */}
              <div className="flex-1 w-full">
                <div className="flex flex-col xl:flex-row max-w-[1440px] mx-auto min-h-[calc(100vh-88px)]">
                  {/* Video Area Section */}
                  <div className="w-full xl:w-1/2 p-6 xl:p-10 flex flex-col">
                    <div className="sticky top-24">
                      <VideoArea
                        videoUrl={videoUrl}
                        topic={topic}
                        isLoading={isLoading}
                      />
                    </div>
                  </div>

                  {/* Smart Board & Doc Upload Section */}
                  <div className="w-full xl:w-1/2 p-6 xl:p-10 flex flex-col gap-8">
                    <CollaborativeBoard
                      explanation={explanation}
                      isLoading={isLoading}
                    />
                    <DocumentUpload onUploadComplete={handleUpload} />
                  </div>
                </div>
              </div>

              {/* Fixed Input Bar */}
              <div className="h-[88px] flex-shrink-0" />
              <InputBar onSearch={handleSearch} isLoading={isLoading} />
            </motion.div>
          ) : (
            <motion.div
              key="output-workspace"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex flex-col h-full overflow-y-auto xl:overflow-hidden"
            >
              <div className="flex-1 flex flex-col gap-6 max-w-[1440px] mx-auto w-full p-6 xl:px-20 xl:py-6">
                {/* Top Section: Split 60% Height */}
                <div className="flex flex-col xl:flex-row gap-6 xl:h-[60%]">
                  {/* AI Video (50%) */}
                  <div className="flex-1 bg-black rounded-2xl relative overflow-hidden group min-h-[300px]">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <MonitorPlay className="h-16 w-16 text-white/20 group-hover:text-white/40 transition-colors" />
                    </div>
                    <div className="absolute bottom-4 left-4 text-white font-medium bg-black/50 px-3 py-1 rounded-lg backdrop-blur-md">
                      AI Explanation Video
                    </div>
                  </div>

                  {/* Screen Board (50%) */}
                  <div className="flex-1 bg-white rounded-2xl shadow-sm border border-border p-6 overflow-y-auto min-h-[300px]">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <span className="w-2 h-6 bg-secondary rounded-full" />
                      Smart Board Recap
                    </h3>
                    <div className="space-y-4 text-muted-foreground whitespace-pre-wrap">
                      {" "}
                      {/* whitespace-pre-wrap ensures formatting is preserved */}
                      <p>{explanation}</p>
                    </div>
                  </div>
                </div>

                {/* Bottom Section: 3 Cards (40% Height) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 xl:h-[40%] xl:min-h-[240px]">
                  {/* Audio Card */}
                  <AudioPlayer topic={topic} />

                  {/* Download Doc Card */}
                  <div className="bg-white rounded-2xl shadow-sm border border-border p-6 flex flex-col items-center justify-center gap-4 hover:border-secondary/50 transition-colors cursor-pointer group h-[240px]">
                    <div className="w-16 h-16 bg-green-50 text-secondary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Download className="h-8 w-8" />
                    </div>
                    <h4 className="font-semibold text-foreground">
                      Download Doc
                    </h4>
                  </div>

                  {/* Structured Text Card */}
                  <NotesCard notes={explanation} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
}
