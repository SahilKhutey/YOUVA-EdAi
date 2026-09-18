"use client";

import React, { useState } from "react";
import {
  Calculator,
  Compass,
  Code2,
  BrainCircuit,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";

interface ElementaryChallenge {
  id: string;
  subject: "MATH" | "SCIENCE" | "CODING" | "AI_LITERACY";
  title: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export function ElementaryLearningHub() {
  const [activeSubject, setActiveSubject] = useState<"MATH" | "SCIENCE" | "CODING" | "AI_LITERACY">("AI_LITERACY");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const challenges: Record<string, ElementaryChallenge> = {
    AI_LITERACY: {
      id: "ELE-AI-01",
      subject: "AI_LITERACY",
      title: "Can AI Systems Make Mistakes?",
      prompt:
        "An AI chatbot tells you that penguins live in warm tropical deserts and eat cactus. What is the most responsible action to take?",
      options: [
        "Believe it immediately because computers know everything",
        "Ask a teacher or parent, and check a trusted encyclopedia together",
        "Share the answer with your class as a proven fact",
      ],
      correctAnswer: "Ask a teacher or parent, and check a trusted encyclopedia together",
      explanation:
        "Exactly right! AI models can produce hallucinations or errors. Epistemic humility means always cross-verifying with reliable sources and trusted adults!",
    },
    MATH: {
      id: "ELE-MATH-01",
      subject: "MATH",
      title: "Fraction Visualizer: Sharing the Pizza",
      prompt:
        "If a pizza has 8 equal slices and you share 2 slices with your friend and eat 2 slices yourself, what fraction of the pizza was eaten?",
      options: ["4/8 (or 1/2)", "2/8 (or 1/4)", "6/8 (or 3/4)"],
      correctAnswer: "4/8 (or 1/2)",
      explanation:
        "Spot on! 2 + 2 = 4 slices out of 8 total slices, which simplifies to exactly 1/2 of the whole pizza!",
    },
    CODING: {
      id: "ELE-CODE-01",
      subject: "CODING",
      title: "Sequencing: Help the Robot Collect the Gem",
      prompt:
        "The robot needs to: [1] Move forward 2 steps, [2] Turn Right, [3] Grab Gem. Which instruction sequence does this correctly?",
      options: [
        "FORWARD(2) -> TURN_RIGHT() -> GRAB()",
        "TURN_RIGHT() -> FORWARD(2) -> GRAB()",
        "GRAB() -> FORWARD(2) -> TURN_RIGHT()",
      ],
      correctAnswer: "FORWARD(2) -> TURN_RIGHT() -> GRAB()",
      explanation:
        "Super coding! In computer programming, the exact sequence of commands determines whether the robot succeeds!",
    },
    SCIENCE: {
      id: "ELE-SCI-01",
      subject: "SCIENCE",
      title: "The Water Cycle Detective",
      prompt:
        "When the sun warms up water in puddles and lakes, turning liquid into invisible water vapor, what is this process called?",
      options: ["Evaporation", "Precipitation", "Freezing"],
      correctAnswer: "Evaporation",
      explanation:
        "Brilliant! Heat energy from the sun turns liquid water into gas, rising up to form clouds in evaporation!",
    },
  };

  const currentChallenge = challenges[activeSubject];

  const handleSelect = (option: string) => {
    if (!isSubmitted) {
      setSelectedAnswer(option);
    }
  };

  const handleSubmit = () => {
    if (selectedAnswer) {
      setIsSubmitted(true);
    }
  };

  const handleReset = (newSubject: "MATH" | "SCIENCE" | "CODING" | "AI_LITERACY") => {
    setActiveSubject(newSubject);
    setSelectedAnswer(null);
    setIsSubmitted(false);
  };

  return (
    <div className="rounded-3xl border-2 border-indigo-200 bg-gradient-to-b from-slate-50 via-indigo-50/30 to-purple-50/40 p-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-indigo-100 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">YOUVA Elementary Hub</h2>
            <p className="text-sm font-medium text-slate-600">Ages 7–12 • Math • Science • Coding • Critical AI Literacy</p>
          </div>
        </div>

        {/* Subject Nav */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleReset("AI_LITERACY")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              activeSubject === "AI_LITERACY"
                ? "bg-indigo-600 text-white shadow"
                : "bg-white text-slate-700 hover:bg-indigo-50 border border-slate-200"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            AI Literacy
          </button>
          <button
            onClick={() => handleReset("MATH")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              activeSubject === "MATH"
                ? "bg-indigo-600 text-white shadow"
                : "bg-white text-slate-700 hover:bg-indigo-50 border border-slate-200"
            }`}
          >
            <Calculator className="h-4 w-4" />
            Math
          </button>
          <button
            onClick={() => handleReset("CODING")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              activeSubject === "CODING"
                ? "bg-indigo-600 text-white shadow"
                : "bg-white text-slate-700 hover:bg-indigo-50 border border-slate-200"
            }`}
          >
            <Code2 className="h-4 w-4" />
            Coding
          </button>
          <button
            onClick={() => handleReset("SCIENCE")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              activeSubject === "SCIENCE"
                ? "bg-indigo-600 text-white shadow"
                : "bg-white text-slate-700 hover:bg-indigo-50 border border-slate-200"
            }`}
          >
            <Compass className="h-4 w-4" />
            Science
          </button>
        </div>
      </div>

      {/* Challenge Card */}
      <div className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-md">
        <div className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-black text-indigo-800 mb-3">
          {currentChallenge.title}
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-6 leading-relaxed">
          {currentChallenge.prompt}
        </h3>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {currentChallenge.options.map((option, idx) => {
            const isChosen = selectedAnswer === option;
            const isRight = isSubmitted && option === currentChallenge.correctAnswer;
            const isWrong = isSubmitted && isChosen && option !== currentChallenge.correctAnswer;

            let btnStyle = "border-slate-200 bg-slate-50 hover:bg-indigo-50/60 text-slate-800";
            if (isChosen && !isSubmitted) {
              btnStyle = "border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-2 ring-indigo-400";
            } else if (isRight) {
              btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-400";
            } else if (isWrong) {
              btnStyle = "border-rose-400 bg-rose-50 text-rose-950";
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(option)}
                className={`w-full text-left rounded-xl border-2 p-4 font-semibold text-sm transition-all flex items-center justify-between ${btnStyle}`}
              >
                <span>{option}</span>
                {isRight && <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Action / Result */}
        {!isSubmitted ? (
          <button
            onClick={handleSubmit}
            disabled={!selectedAnswer}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 py-3.5 text-sm font-bold text-white shadow-md transition-all"
          >
            Submit Answer
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/80 p-4">
            <h4 className="text-sm font-black text-indigo-950 mb-1">
              {selectedAnswer === currentChallenge.correctAnswer ? "🌟 Excellent Reasoning!" : "💡 Great Effort!"}
            </h4>
            <p className="text-xs font-medium text-indigo-900 leading-relaxed">
              {currentChallenge.explanation}
            </p>
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => {
                  setSelectedAnswer(null);
                  setIsSubmitted(false);
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Try Another Problem
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
        <span>Curriculum aligned to standard elementary cognitive development</span>
        <span>Epistemic Humility Engine Active</span>
      </div>
    </div>
  );
}
