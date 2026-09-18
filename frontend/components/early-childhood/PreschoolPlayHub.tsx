"use client";

import React, { useState } from "react";
import {
  Volume2,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  Heart,
  Smile,
  Compass,
  TreeDeciduous,
  BookOpen,
} from "lucide-react";

interface StoryStep {
  step: string;
  title: string;
  narrative: string;
  cue: string;
  choices?: { id: string; text: string; icon: string }[];
}

export function PreschoolPlayHub() {
  const [activeTab, setActiveTab] = useState<"STORIES" | "PHONICS" | "PHYSICAL">("STORIES");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [storyStep, setStoryStep] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Phonics Safari State
  const [phonicsWord, setPhonicsWord] = useState("Lion");
  const [targetPhoneme, setTargetPhoneme] = useState("L");
  const [phonicsResult, setPhonicsResult] = useState<string | null>(null);

  // Physical Task State
  const [physicalDone, setPhysicalDone] = useState(false);

  const storySteps: StoryStep[] = [
    {
      step: "CHARACTER",
      title: "Meet Pip the Explorer",
      narrative: "Pip the little hedgehog loves exploring under the giant oak trees. Look, Pip found something shining!",
      cue: "🦔 🌳 ✨",
      choices: [
        { id: "c1", text: "Look closer at the sparkling lights", icon: "✨" },
        { id: "c2", text: "Listen to the birds singing", icon: "🐦" },
      ],
    },
    {
      step: "PROBLEM",
      title: "A Squirrel Needs Help",
      narrative: "Pip hears a tiny peep! Baby squirrel has 3 big acorns but can only hold 2 in his paws.",
      cue: "🐿️ 🌰 🌰 🌰",
      choices: [
        { id: "c3", text: "Help carry one acorn together", icon: "🤝" },
        { id: "c4", text: "Count all the acorns: 1, 2, 3!", icon: "🔢" },
      ],
    },
    {
      step: "REFLECTION",
      title: "Sharing Brings Joy",
      narrative: "Working together, everyone had plenty of acorns! Pip felt warm and happy inside.",
      cue: "🌟 💖 🌈",
    },
  ];

  const currentStory = storySteps[storyStep];

  const handleSpeak = (text: string) => {
    setIsPlayingAudio(true);
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      utterance.pitch = 1.1;
      utterance.onend = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsPlayingAudio(false), 1500);
    }
  };

  const handleChoice = (text: string) => {
    setFeedback(`Awesome choice! You chose: "${text}"`);
    handleSpeak(`Wonderful! Let's see what happens next.`);
    setTimeout(() => {
      setFeedback(null);
      if (storyStep < storySteps.length - 1) {
        setStoryStep(storyStep + 1);
      }
    }, 2000);
  };

  const checkPhonics = (word: string, target: string) => {
    const match = word.toLowerCase().startsWith(target.toLowerCase());
    if (match) {
      setPhonicsResult(`Hooray! "${word}" starts with the sound /${target}/! 🌟`);
      handleSpeak(`Hooray! ${word} starts with ${target}!`);
    } else {
      setPhonicsResult(`Let's listen together! "${word}" has another beginning sound.`);
    }
  };

  return (
    <div className="rounded-3xl border-4 border-amber-200 bg-gradient-to-b from-amber-50/70 via-sky-50/50 to-emerald-50/60 p-6 shadow-xl select-none">
      {/* Friendly Child-First Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-amber-100 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-3xl shadow-md">
            🌈
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-amber-950">YOUVA Junior Play Hub</h2>
            <p className="text-sm font-medium text-amber-800/80">Ages 3–7 • Play • Stories • Voice Exploration</p>
          </div>
        </div>

        {/* Gentle Mode Navigation */}
        <div className="flex items-center gap-2 rounded-full bg-white/80 p-1.5 shadow-inner border border-amber-200">
          <button
            onClick={() => setActiveTab("STORIES")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
              activeTab === "STORIES"
                ? "bg-amber-400 text-amber-950 shadow-md scale-105"
                : "text-amber-800 hover:bg-amber-100/50"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Story Safari
          </button>
          <button
            onClick={() => setActiveTab("PHONICS")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
              activeTab === "PHONICS"
                ? "bg-emerald-400 text-emerald-950 shadow-md scale-105"
                : "text-emerald-800 hover:bg-emerald-100/50"
            }`}
          >
            <Smile className="h-4 w-4" />
            Phonics Fun
          </button>
          <button
            onClick={() => setActiveTab("PHYSICAL")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
              activeTab === "PHYSICAL"
                ? "bg-sky-400 text-sky-950 shadow-md scale-105"
                : "text-sky-800 hover:bg-sky-100/50"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Active Play
          </button>
        </div>
      </div>

      {/* Main Play Area */}
      {activeTab === "STORIES" && (
        <div className="space-y-6">
          <div className="rounded-2xl border-2 border-amber-300 bg-white/90 p-6 shadow-md text-center">
            <div className="text-6xl mb-4">{currentStory.cue}</div>
            <h3 className="text-2xl font-extrabold text-amber-900 mb-2">{currentStory.title}</h3>
            <p className="text-lg font-medium text-slate-700 max-w-xl mx-auto leading-relaxed mb-6">
              {currentStory.narrative}
            </p>

            <button
              onClick={() => handleSpeak(currentStory.narrative)}
              disabled={isPlayingAudio}
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 hover:bg-amber-600 px-6 py-3 text-base font-black text-white shadow-lg transform active:scale-95 transition-all"
            >
              <Volume2 className={`h-5 w-5 ${isPlayingAudio ? "animate-pulse" : ""}`} />
              {isPlayingAudio ? "Listening to Story..." : "Hear Pip's Story"}
            </button>
          </div>

          {/* Large Tactile Choices */}
          {currentStory.choices && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentStory.choices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => handleChoice(choice.text)}
                  className="flex items-center gap-4 rounded-2xl border-3 border-amber-300 bg-amber-50/90 hover:bg-amber-100 p-5 shadow-md hover:shadow-lg transition-all text-left transform active:scale-98"
                >
                  <span className="text-4xl">{choice.icon}</span>
                  <span className="text-lg font-bold text-amber-950">{choice.text}</span>
                </button>
              ))}
            </div>
          )}

          {feedback && (
            <div className="rounded-2xl bg-emerald-100 border-2 border-emerald-300 p-4 text-center text-emerald-900 font-bold text-lg animate-bounce">
              {feedback}
            </div>
          )}

          {storyStep === storySteps.length - 1 && (
            <div className="text-center pt-4">
              <button
                onClick={() => setStoryStep(0)}
                className="inline-flex items-center gap-2 rounded-full bg-sky-500 hover:bg-sky-600 text-white font-bold px-6 py-3 shadow-md"
              >
                <RotateCcw className="h-4 w-4" />
                Play Story Again
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "PHONICS" && (
        <div className="space-y-6">
          <div className="rounded-2xl border-2 border-emerald-300 bg-white/90 p-6 shadow-md text-center">
            <div className="text-6xl mb-4">🦁 🌴 🐘</div>
            <h3 className="text-2xl font-extrabold text-emerald-900 mb-2">Phonics Safari</h3>
            <p className="text-slate-600 mb-6 font-medium">
              Tap the animal or word that starts with the sound <span className="font-black text-emerald-700 text-xl">/L/</span>!
            </p>

            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
              <button
                onClick={() => checkPhonics("Lion", "L")}
                className="flex flex-col items-center gap-2 rounded-2xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 p-4 shadow-sm"
              >
                <span className="text-5xl">🦁</span>
                <span className="font-bold text-emerald-950">Lion</span>
              </button>
              <button
                onClick={() => checkPhonics("Monkey", "L")}
                className="flex flex-col items-center gap-2 rounded-2xl border-2 border-slate-200 bg-slate-50 hover:bg-slate-100 p-4 shadow-sm"
              >
                <span className="text-5xl">🐒</span>
                <span className="font-bold text-slate-800">Monkey</span>
              </button>
              <button
                onClick={() => checkPhonics("Leaf", "L")}
                className="flex flex-col items-center gap-2 rounded-2xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 p-4 shadow-sm"
              >
                <span className="text-5xl">🍃</span>
                <span className="font-bold text-emerald-950">Leaf</span>
              </button>
            </div>

            {phonicsResult && (
              <div className="mt-6 rounded-2xl bg-emerald-100 border border-emerald-300 p-4 text-emerald-900 font-bold text-lg">
                {phonicsResult}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "PHYSICAL" && (
        <div className="space-y-6">
          <div className="rounded-2xl border-2 border-sky-300 bg-white/90 p-6 shadow-md text-center">
            <div className="text-6xl mb-4">🐸 🎈 🦘</div>
            <h3 className="text-2xl font-extrabold text-sky-900 mb-2">Off-Screen Movement Adventure!</h3>
            <p className="text-slate-700 text-lg font-medium max-w-md mx-auto mb-6">
              Step away from the screen! Can you stand up tall and hop 3 times like a friendly green frog?
            </p>

            <button
              onClick={() => {
                setPhysicalDone(true);
                handleSpeak("Ribbit! Great hopping! Taking active breaks makes our minds happy and healthy.");
              }}
              className="inline-flex items-center gap-2 rounded-full bg-sky-500 hover:bg-sky-600 px-8 py-4 text-lg font-black text-white shadow-lg active:scale-95 transition-all"
            >
              <CheckCircle2 className="h-6 w-6" />
              I Hopped 3 Times!
            </button>

            {physicalDone && (
              <div className="mt-6 rounded-2xl bg-sky-100 border border-sky-300 p-4 text-sky-900 font-bold text-lg">
                🎉 Awesome job moving your body! You earned the Active Explorer star!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gentle Bottom Guidance */}
      <div className="mt-8 flex items-center justify-between text-xs font-semibold text-amber-900/70 border-t border-amber-200/60 pt-4">
        <span>🛡️ Protected Play Mode (Zero Streaks • Zero Leaderboards • Strict Safety)</span>
        <span>Co-designed for healthy early childhood exploration</span>
      </div>
    </div>
  );
}
