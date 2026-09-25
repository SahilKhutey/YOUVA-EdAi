'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, CheckCircle2, Network, Loader2, Eye } from 'lucide-react';
import { knowledgeApi } from '../../../../../lib/api/knowledgeApi';
import { KnowledgeObjectItem, ContentBlock } from '../../../../../types/knowledge';

export default function DedicatedPreviewPage() {
  const params = useParams();
  const id = params.id as string;

  const [item, setItem] = useState<KnowledgeObjectItem | null>(null);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await knowledgeApi.getTeacherKnowledgeDetail(id);
        setItem(data);
        const latest = data.versions?.[0];
        if (latest?.content) {
          try {
            const parsed = JSON.parse(latest.content);
            if (parsed.sections && parsed.sections[0]?.blocks) {
              setBlocks(parsed.sections[0].blocks);
            } else {
              setBlocks([{ id: 'b-init', type: 'TEXT', content: latest.content }]);
            }
          } catch {
            setBlocks([{ id: 'b-init', type: 'TEXT', content: latest.content }]);
          }
        }
      } catch (err) {
        console.error('Failed to load preview:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      load();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
          Rendering Student Preview...
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-lg font-bold">Knowledge object not found</h2>
        <Link href="/teacher/knowledge" className="mt-4 inline-block text-indigo-600">
          Return to Knowledge Library
        </Link>
      </div>
    );
  }

  const objectives = item.objectives?.map((o) => o.objective) || [];
  const prerequisites = item.incomingLinks?.filter((l) => l.relation === 'PREREQUISITE').map((l) => l.source?.title || 'Prior Concept') || [];

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-12 dark:bg-slate-950">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
          <Link
            href={`/teacher/knowledge/${id}/edit`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Editor
          </Link>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            <Eye className="h-3.5 w-3.5" />
            Full-Page Student Preview (v{item.currentVersion})
          </span>
        </div>

        {/* Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
          <div>
            <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <BookOpen className="h-3.5 w-3.5" />
              {item.type}
            </span>
            <h1 className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {item.title}
            </h1>
            {item.description && (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {item.description}
              </p>
            )}
          </div>

          {/* Objectives */}
          {objectives.length > 0 && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-5 dark:border-indigo-950/50 dark:bg-indigo-950/20">
              <h2 className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
                Learning Objectives
              </h2>
              <ul className="mt-3 space-y-2 text-xs text-indigo-950 dark:text-indigo-300">
                {objectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Prerequisites */}
          {prerequisites.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-2.5 text-xs text-slate-600 dark:bg-slate-800/50 dark:text-slate-400">
              <Network className="h-4 w-4 text-slate-500" />
              <span className="font-medium">Prerequisites needed:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-200">
                {prerequisites.join(', ')}
              </span>
            </div>
          )}

          {/* Content Blocks */}
          <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            {blocks.map((block) => (
              <div key={block.id}>
                {block.type === 'HEADING' && (
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {block.content}
                  </h2>
                )}

                {block.type === 'TEXT' && (
                  <div className="prose dark:prose-invert text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                    {block.content}
                  </div>
                )}

                {block.type === 'EXAMPLE' && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-900/50 dark:bg-amber-950/20">
                    <div className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                      {block.title}
                    </div>
                    <div className="mt-2 text-sm text-amber-950 dark:text-amber-100 whitespace-pre-wrap">
                      {block.content}
                    </div>
                  </div>
                )}

                {block.type === 'CALLOUT' && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-xs text-blue-950 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-100">
                    {block.title && <div className="font-bold">{block.title}</div>}
                    <div className="mt-1">{block.content}</div>
                  </div>
                )}

                {block.type === 'QUESTION' && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/10">
                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Practice Question
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {block.prompt}
                    </div>
                    {block.options && block.options.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {block.options.map((opt, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                          >
                            <span className="font-mono text-slate-400">
                              {String.fromCharCode(65 + i)}.
                            </span>
                            <span>{opt}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {block.type === 'ACTIVITY' && (
                  <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-5 dark:border-purple-900/40 dark:bg-purple-950/10">
                    <div className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                      Activity: {block.title}
                    </div>
                    <div className="mt-2 text-sm text-purple-950 dark:text-purple-100">
                      {block.instructions}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
