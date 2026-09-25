'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  HelpCircle,
  Lightbulb,
  BookOpen,
  FileText,
  Send,
  Loader2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { aiKnowledgeApi, AiResponsePayload } from '../../../lib/api/aiKnowledgeApi';

interface StudentAIAssistantProps {
  knowledgeId: string;
  knowledgeTitle: string;
  questionId?: string;
  expectedAnswer?: string;
}

export const StudentAIAssistant: React.FC<StudentAIAssistantProps> = ({
  knowledgeId,
  knowledgeTitle,
  questionId,
  expectedAnswer,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'EXPLAIN' | 'HINT' | 'EXAMPLE' | 'SUMMARY'>('EXPLAIN');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AiResponsePayload<any> | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hintAttempt, setHintAttempt] = useState(1);

  const handleExplain = async (customQuery?: string) => {
    const q = customQuery || query;
    if (!q.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await aiKnowledgeApi.explain(knowledgeId, q);
      setResponse(res);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Failed to generate explanation.');
    } finally {
      setLoading(false);
    }
  };

  const handleHint = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await aiKnowledgeApi.hint(
        knowledgeId,
        questionId,
        hintAttempt,
        expectedAnswer,
      );
      setResponse(res);
      setHintAttempt((prev) => prev + 1);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Failed to generate hint.');
    } finally {
      setLoading(false);
    }
  };

  const handleExample = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await aiKnowledgeApi.example(knowledgeId);
      setResponse(res);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Failed to generate example.');
    } finally {
      setLoading(false);
    }
  };

  const handleSummary = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await aiKnowledgeApi.summarize(knowledgeId);
      setResponse(res);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Failed to generate summary.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-3 font-semibold text-white shadow-xl hover:bg-indigo-500 hover:shadow-2xl transition-all"
      >
        <Sparkles className="h-5 w-5 animate-pulse text-amber-300" />
        <span>Ask AI Tutor</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-indigo-200 bg-white p-4 shadow-2xl dark:border-indigo-950 dark:bg-slate-900 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
              AI Learning Assistant
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-3 w-3" />
              Grounded in Verified Curriculum
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Mode Selector */}
      <div className="mt-3 grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        <button
          type="button"
          onClick={() => {
            setActiveTab('EXPLAIN');
            setResponse(null);
          }}
          className={`flex items-center justify-center gap-1 rounded-lg py-1.5 ${
            activeTab === 'EXPLAIN' ? 'bg-white font-bold text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400' : ''
          }`}
        >
          <HelpCircle className="h-3 w-3" />
          Explain
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('HINT');
            setResponse(null);
            handleHint();
          }}
          className={`flex items-center justify-center gap-1 rounded-lg py-1.5 ${
            activeTab === 'HINT' ? 'bg-white font-bold text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400' : ''
          }`}
        >
          <Lightbulb className="h-3 w-3" />
          Hint
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('EXAMPLE');
            setResponse(null);
            handleExample();
          }}
          className={`flex items-center justify-center gap-1 rounded-lg py-1.5 ${
            activeTab === 'EXAMPLE' ? 'bg-white font-bold text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400' : ''
          }`}
        >
          <BookOpen className="h-3 w-3" />
          Example
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('SUMMARY');
            setResponse(null);
            handleSummary();
          }}
          className={`flex items-center justify-center gap-1 rounded-lg py-1.5 ${
            activeTab === 'SUMMARY' ? 'bg-white font-bold text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400' : ''
          }`}
        >
          <FileText className="h-3 w-3" />
          Summary
        </button>
      </div>

      {/* Content Area */}
      <div className="mt-3 max-h-72 overflow-y-auto pr-1 text-xs">
        {loading && (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-indigo-600 dark:text-indigo-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Consulting curriculum knowledge...</span>
          </div>
        )}

        {errorMsg && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        {/* Explain Input */}
        {activeTab === 'EXPLAIN' && !loading && !response && (
          <div className="space-y-2 py-2">
            <p className="text-slate-600 dark:text-slate-400">
              Ask anything about <strong className="text-slate-800 dark:text-slate-200">{knowledgeTitle}</strong>:
            </p>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleExplain()}
                placeholder="e.g. Why is this important?"
                className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={() => handleExplain()}
                disabled={!query.trim()}
                className="rounded-lg bg-indigo-600 p-2 text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
              <button
                type="button"
                onClick={() => handleExplain('Explain the core concept in simple terms')}
                className="rounded-full border border-indigo-100 bg-indigo-50/50 px-2 py-0.5 text-[10px] text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900/40 dark:bg-indigo-950/30 dark:text-indigo-300"
              >
                💡 Explain simply
              </button>
              <button
                type="button"
                onClick={() => handleExplain('What are the key formulas or rules?')}
                className="rounded-full border border-indigo-100 bg-indigo-50/50 px-2 py-0.5 text-[10px] text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900/40 dark:bg-indigo-950/30 dark:text-indigo-300"
              >
                📐 Key rules
              </button>
            </div>
          </div>
        )}

        {/* Display Results */}
        {response && !loading && (
          <div className="space-y-3">
            {/* Scaffolding level badge for hints */}
            {activeTab === 'HINT' && response.data?.scaffoldLevel && (
              <div className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                Level: {response.data.scaffoldLevel} (Attempt #{hintAttempt - 1})
              </div>
            )}

            {/* Explanation / Hint / Example / Summary Text */}
            <div className="rounded-xl bg-slate-50 p-3 leading-relaxed text-slate-800 dark:bg-slate-800/60 dark:text-slate-200">
              {activeTab === 'EXPLAIN' && (
                <div>
                  <p>{response.data?.explanation}</p>
                  {response.data?.followUpQuestions?.length > 0 && (
                    <div className="mt-3 border-t border-slate-200 pt-2 dark:border-slate-700">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">Reflect:</span>
                      <ul className="mt-1 list-disc pl-4 text-[11px] text-slate-600 dark:text-slate-400">
                        {response.data.followUpQuestions.map((fq: string, i: number) => (
                          <li key={i}>{fq}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'HINT' && (
                <div>
                  <p>{response.data?.hint}</p>
                  <button
                    type="button"
                    onClick={handleHint}
                    className="mt-2 text-[11px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    Need more help? Next hint level →
                  </button>
                </div>
              )}

              {activeTab === 'EXAMPLE' && (
                <div className="space-y-1.5">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    {response.data?.concept}
                  </div>
                  <p>{response.data?.example}</p>
                  {response.data?.takeaway && (
                    <div className="mt-2 rounded bg-indigo-50 p-2 text-[11px] text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300">
                      <strong>Takeaway:</strong> {response.data.takeaway}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'SUMMARY' && (
                <div className="space-y-2">
                  <p>{response.data?.summary}</p>
                  {response.data?.keyPoints?.length > 0 && (
                    <ul className="list-disc pl-4 text-[11px] space-y-1 text-slate-700 dark:text-slate-300">
                      {response.data.keyPoints.map((kp: string, i: number) => (
                        <li key={i}>{kp}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Citations & Grounding Footer */}
            {response.sources?.length > 0 && (
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span className="truncate max-w-[200px]">
                  Source: {response.sources[0].title}
                </span>
                {response.metadata?.groundingScore !== undefined && (
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    Grounding: {(response.metadata.groundingScore * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
