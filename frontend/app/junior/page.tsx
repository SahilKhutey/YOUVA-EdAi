"use client";

import {
  CheckCircle2,
  Heart,
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useState } from "react";

interface JuniorQuestion {
  id: string;
  audioPrompt: string;
  visualCue: string;
  options: { label: string; icon: string }[];
  correctIndex: number;
}

export default function JuniorLearningPage() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [sessionMinutes, setSessionMinutes] = useState(4.2);

  const questions: JuniorQuestion[] = [
    {
      id: "Q-JR-01",
      audioPrompt: "Tap the three red apples.",
      visualCue: "🍎 🍎 🍎",
      options: [
        { label: "One", icon: "🍎" },
        { label: "Two", icon: "🍎 🍎" },
        { label: "Three", icon: "🍎 🍎 🍎" },
      ],
      correctIndex: 2,
    },
    {
      id: "Q-JR-02",
      audioPrompt: "Find the big yellow star.",
      visualCue: "⭐",
      options: [
        { label: "Star", icon: "⭐" },
        { label: "Circle", icon: "⭕" },
        { label: "Square", icon: "⬛" },
      ],
      correctIndex: 0,
    },
    {
      id: "Q-JR-03",
      audioPrompt: "Which friend rhymes with cat?",
      visualCue: "🐱 Cat",
      options: [
        { label: "Bat", icon: "🦇" },
        { label: "Dog", icon: "🐶" },
        { label: "Sun", icon: "☀️" },
      ],
      correctIndex: 0,
    },
  ];

  const currentQ = questions[currentIdx];

  const handlePlayVoice = () => {
    setIsPlayingAudio(true);
    // Voice synthesis simulation
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(currentQ.audioPrompt);
      utterance.rate = 0.85; // Slow, friendly pace for ages 4-6
      utterance.pitch = 1.1; // Gentle, clear pitch
      utterance.onend = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsPlayingAudio(false), 2000);
    }
  };

  const handleSelectOption = (idx: number) => {
    setSelectedOption(idx);
    const correct = idx === currentQ.correctIndex;
    setIsCorrect(correct);

    if (correct) {
      // Play encouraging gentle chime
      setTimeout(() => {
        if (currentIdx < questions.length - 1) {
          setCurrentIdx(currentIdx + 1);
          setSelectedOption(null);
          setIsCorrect(null);
        }
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-sky-50/40 to-emerald-50/50 p-4 md:p-8 flex flex-col justify-between font-sans select-none">
      {/* Junior Safety & Co-Pilot Top Bar */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between pb-4 border-b border-amber-200/50">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full">
            Parent Co-Pilot Connected
          </span>
        </div>

        <div className="text-xs font-medium text-slate-500 bg-white/80 px-3 py-1 rounded-full shadow-sm">
          Gentle Session: {sessionMinutes.toFixed(1)} / 15.0 mins
        </div>
      </div>

      {/* Main Interactive Stage */}
      <main className="max-w-3xl mx-auto w-full flex-1 flex flex-col items-center justify-center py-6 text-center space-y-6">
        {/* Prominent Voice Speaker Button */}
        <button
          onClick={handlePlayVoice}
          className={`group flex items-center gap-3 px-8 py-5 rounded-full text-xl font-bold transition-all transform active:scale-95 shadow-lg ${
            isPlayingAudio
              ? "bg-amber-400 text-amber-950 ring-4 ring-amber-300 animate-pulse"
              : "bg-amber-500 hover:bg-amber-400 text-amber-950"
          }`}
          aria-label="Play audio prompt"
        >
          <Volume2 className={`w-8 h-8 ${isPlayingAudio ? "animate-bounce" : ""}`} />
          <span>{isPlayingAudio ? "Listening..." : "Tap to Listen"}</span>
        </button>

        {/* Big Visual Cue (Emoji / Shape / Friendly Icon) */}
        <div className="text-7xl md:text-8xl py-4 transition-transform hover:scale-105">
          {currentQ.visualCue}
        </div>

        {/* Accessible Voice Text Caption */}
        <p className="text-xl md:text-2xl font-bold text-slate-800 max-w-lg leading-relaxed">
          &ldquo;{currentQ.audioPrompt}&rdquo;
        </p>

        {/* Big Touch Answer Cards (Minimal text, maximum visual clarity) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 w-full pt-4">
          {currentQ.options.map((opt, idx) => {
            const isChosen = selectedOption === idx;
            const isRight = isChosen && isCorrect === true;
            const isWrong = isChosen && isCorrect === false;

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(idx)}
                className={`p-6 md:p-8 rounded-3xl border-4 flex flex-col items-center justify-center gap-3 transition-all transform active:scale-95 shadow-md ${
                  isRight
                    ? "border-emerald-500 bg-emerald-100 text-emerald-900 scale-105"
                    : isWrong
                    ? "border-amber-400 bg-amber-50 text-amber-900"
                    : "border-white bg-white/90 hover:bg-white hover:border-amber-300 text-slate-800"
                }`}
              >
                <span className="text-5xl md:text-6xl">{opt.icon}</span>
                <span className="text-lg font-bold">{opt.label}</span>
                {isRight && (
                  <span className="flex items-center gap-1 text-sm font-bold text-emerald-700 mt-1">
                    <CheckCircle2 className="w-5 h-5" /> Wonderful!
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Gentle encouragement feedback */}
        {isCorrect === false && (
          <div className="p-4 bg-amber-100 border border-amber-300 rounded-2xl text-amber-900 font-semibold text-base flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <span>Good try! Let&apos;s listen again together.</span>
          </div>
        )}
      </main>

      {/* Junior Footer Controls */}
      <footer className="max-w-3xl mx-auto w-full flex items-center justify-between pt-4 border-t border-amber-200/50">
        <button
          onClick={handlePlayVoice}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white/80 px-4 py-2 rounded-xl shadow-sm"
        >
          <RotateCcw className="w-4 h-4" /> Repeat Voice
        </button>

        <div className="flex items-center gap-1 text-sm font-semibold text-amber-800">
          <Heart className="w-5 h-5 fill-amber-500 text-amber-500" />
          <span>Foundational Steps</span>
        </div>
      </footer>
    </div>
  );
}
