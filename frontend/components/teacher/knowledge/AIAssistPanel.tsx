'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Lightbulb,
  HelpCircle,
  Network,
  CheckCircle2,
  AlertTriangle,
  Check,
  Loader2,
  ShieldCheck,
  FileSearch,
} from 'lucide-react';
import { aiKnowledgeApi, AiResponsePayload } from '../../../lib/api/aiKnowledgeApi';

interface AIAssistPanelProps {
  conceptTitle: string;
  knowledgeId?: string;
  onAddContentBlock?: (block: any) => void;
  onAddObjective?: (objective: string) => void;
  onAddPrerequisite?: (prereq: string) => void;
}

export const AIAssistPanel: React.FC<AIAssistPanelProps> = ({
  conceptTitle,
  knowledgeId,
  onAddContentBlock,
  onAddObjective,
  onAddPrerequisite,
}) => {
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [qualityReport, setQualityReport] = useState<any | null>(null);
  const [lastMeta, setLastMeta] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerate = async (action: string) => {
    setActiveAction(action);
    setIsGenerating(true);
    setSuggestions([]);
    setQualityReport(null);
    setErrorMsg(null);

    try {
      if (knowledgeId) {
        // Connected to backend AI Knowledge Intelligence Engine
        switch (action) {
          case 'EXAMPLES': {
            const res = await aiKnowledgeApi.generateExample(knowledgeId);
            setLastMeta(res.metadata);
            setSuggestions([
              {
                id: 'gen-ex-1',
                title: `Grounded Example: ${conceptTitle || 'Concept'}`,
                content: `${res.data.example}\n\nPedagogical Explanation: ${res.data.explanation}`,
                type: 'EXAMPLE',
              },
            ]);
            break;
          }

          case 'QUESTIONS': {
            const res = await aiKnowledgeApi.generateQuestions(knowledgeId, 3);
            setLastMeta(res.metadata);
            setSuggestions(
              res.data.map((q, idx) => ({
                id: `gen-q-${idx}`,
                prompt: q.stem,
                options: q.options || [],
                answer: q.correctAnswer,
                explanation: q.explanation,
                type: 'QUESTION',
              })),
            );
            break;
          }

          case 'OBJECTIVES': {
            const res = await aiKnowledgeApi.suggestObjectives(knowledgeId);
            setLastMeta(res.metadata);
            setSuggestions(
              res.data.map((obj, idx) => ({
                id: `gen-obj-${idx}`,
                text: `${obj.code}: ${obj.title} (${obj.bloomLevel}) - ${obj.description}`,
              })),
            );
            break;
          }

          case 'PREREQUISITES': {
            const res = await aiKnowledgeApi.suggestPrerequisites(knowledgeId);
            setLastMeta(res.metadata);
            setSuggestions(
              res.data.map((pre, idx) => ({
                id: `gen-pre-${idx}`,
                text: `${pre.title} - ${pre.rationale} (Confidence: ${(pre.confidence * 100).toFixed(0)}%)`,
              })),
            );
            break;
          }

          case 'QUALITY': {
            const res = await aiKnowledgeApi.analyzeQuality(knowledgeId);
            setLastMeta(res.metadata);
            setQualityReport(res.data);
            break;
          }

          default:
            break;
        }
      } else {
        // Fallback for draft objects before first save
        await new Promise((r) => setTimeout(r, 600));
        const title = conceptTitle || 'Target Concept';

        switch (action) {
          case 'EXAMPLES':
            setSuggestions([
              {
                id: 'ex-1',
                title: `Real-World Application with ${title}`,
                content: `Consider how ${title} applies directly: observing inputs and outputs in concrete systems.`,
                type: 'EXAMPLE',
              },
            ]);
            break;
          case 'QUESTIONS':
            setSuggestions([
              {
                id: 'q-1',
                prompt: `What is the primary role of ${title}?`,
                options: ['Core conceptual foundation', 'Secondary exception', 'Optional extension'],
                answer: 'Core conceptual foundation',
                type: 'QUESTION',
              },
            ]);
            break;
          case 'OBJECTIVES':
            setSuggestions([
              { id: 'obj-1', text: `Define key terminology and principles of ${title}` },
              { id: 'obj-2', text: `Apply ${title} methods to solve practice exercises` },
            ]);
            break;
          case 'PREREQUISITES':
            setSuggestions([
              { id: 'pre-1', text: 'Foundations of Subject' },
              { id: 'pre-2', text: 'Core Notation and Definitions' },
            ]);
            break;
          default:
            break;
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Failed to generate suggestions.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptSuggestion = (s: any) => {
    if (activeAction === 'OBJECTIVES' && onAddObjective) {
      onAddObjective(s.text);
    } else if (activeAction === 'PREREQUISITES' && onAddPrerequisite) {
      onAddPrerequisite(s.text);
    } else if (onAddContentBlock) {
      onAddContentBlock(s);
    }
    setSuggestions((prev) => prev.filter((item) => item.id !== s.id));
  };

  return (
    <div className="space-y-4 rounded-xl border border-indigo-100 bg-gradient-to-b from-indigo-50/50 to-white p-4 dark:border-indigo-950/40 dark:from-indigo-950/20 dark:to-slate-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
          <Sparkles className="h-4 w-4 text-indigo-500" />
          AI Knowledge Copilot
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
          <ShieldCheck className="h-3 w-3" />
          Teacher Review Required
        </span>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400">
        AI assists by proposing grounded examples, questions, and graph relationships. Suggestions are never published directly without your explicit acceptance.
      </p>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <button
          type="button"
          onClick={() => handleGenerate('EXAMPLES')}
          disabled={isGenerating}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-2 text-left font-medium text-slate-700 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
          Generate Examples
        </button>

        <button
          type="button"
          onClick={() => handleGenerate('QUESTIONS')}
          disabled={isGenerating}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-2 text-left font-medium text-slate-700 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <HelpCircle className="h-3.5 w-3.5 text-emerald-500" />
          Generate Questions
        </button>

        <button
          type="button"
          onClick={() => handleGenerate('OBJECTIVES')}
          disabled={isGenerating}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-2 text-left font-medium text-slate-700 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500" />
          Suggest Objectives
        </button>

        <button
          type="button"
          onClick={() => handleGenerate('PREREQUISITES')}
          disabled={isGenerating}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-2 text-left font-medium text-slate-700 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <Network className="h-3.5 w-3.5 text-purple-500" />
          Suggest Prerequisites
        </button>

        <button
          type="button"
          onClick={() => handleGenerate('QUALITY')}
          disabled={isGenerating}
          className="col-span-2 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white p-2 text-center font-medium text-slate-700 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <FileSearch className="h-3.5 w-3.5 text-blue-500" />
          Run Pedagogical Quality Review
        </button>
      </div>

      {/* Loading state */}
      {isGenerating && (
        <div className="flex items-center justify-center gap-2 py-4 text-xs text-indigo-600 dark:text-indigo-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Querying grounded knowledge intelligence engine...
        </div>
      )}

      {/* Error state */}
      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {errorMsg}
        </div>
      )}

      {/* Metadata & Grounding Indicator */}
      {lastMeta && !isGenerating && (
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>Model: {lastMeta.model} ({lastMeta.provider})</span>
          {lastMeta.groundingScore !== undefined && (
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              Grounding Score: {(lastMeta.groundingScore * 100).toFixed(0)}%
            </span>
          )}
        </div>
      )}

      {/* Quality Report View */}
      {qualityReport && !isGenerating && (
        <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50/50 p-3 text-xs dark:border-blue-900/50 dark:bg-blue-950/20">
          <div className="font-semibold text-blue-950 dark:text-blue-200">
            Pedagogical Quality Analysis
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>Completeness: {(qualityReport.completeness * 100).toFixed(0)}%</div>
            <div>Clarity: {(qualityReport.clarity * 100).toFixed(0)}%</div>
            <div>Alignment: {(qualityReport.objectiveAlignment * 100).toFixed(0)}%</div>
            <div>Flow: {(qualityReport.pedagogicalFlow * 100).toFixed(0)}%</div>
          </div>
          {qualityReport.issues?.length > 0 && (
            <div className="space-y-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Recommendations:</span>
              {qualityReport.issues.map((iss: any, i: number) => (
                <div key={i} className="text-[11px] text-slate-600 dark:text-slate-400">
                  • [{iss.severity}] {iss.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Suggestions List */}
      {suggestions.length > 0 && !isGenerating && (
        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">
            Review Candidate Proposals ({suggestions.length})
          </span>

          {suggestions.map((s) => (
            <div
              key={s.id}
              className="rounded-lg border border-indigo-200/60 bg-white p-2.5 text-xs shadow-sm dark:border-indigo-900/60 dark:bg-slate-900"
            >
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                {s.title || s.text || s.prompt}
              </div>
              {s.content && (
                <p className="mt-1 text-slate-600 dark:text-slate-400 whitespace-pre-line">
                  {s.content}
                </p>
              )}
              {s.options && (
                <div className="mt-1.5 space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                  <div className="font-medium text-slate-700 dark:text-slate-300">Choices:</div>
                  {s.options.map((opt: string, idx: number) => (
                    <div key={idx} className={opt === s.answer ? 'font-semibold text-emerald-600 dark:text-emerald-400' : ''}>
                      {String.fromCharCode(65 + idx)}. {opt} {opt === s.answer && '(Correct)'}
                    </div>
                  ))}
                  {s.explanation && (
                    <div className="mt-1 italic text-slate-500">
                      Rationale: {s.explanation}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-2 flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setSuggestions((prev) => prev.filter((item) => item.id !== s.id))}
                  className="rounded px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => handleAcceptSuggestion(s)}
                  className="inline-flex items-center gap-1 rounded bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-indigo-500"
                >
                  <Check className="h-3 w-3" />
                  Accept & Add to Lesson
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
