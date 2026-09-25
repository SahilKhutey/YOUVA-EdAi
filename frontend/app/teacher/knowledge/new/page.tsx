'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Layers,
  GraduationCap,
  Lightbulb,
  HelpCircle,
  Activity,
  FolderOpen,
  FileText,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { knowledgeApi } from '../../../../lib/api/knowledgeApi';
import { KnowledgeObjectType } from '../../../../types/knowledge';

const typeOptions: Array<{
  type: KnowledgeObjectType;
  title: string;
  description: string;
  icon: any;
  primary?: boolean;
}> = [
  {
    type: 'CONCEPT',
    title: 'Concept',
    description: 'An ontological unit of knowledge (e.g. Transposition in Linear Equations)',
    icon: Lightbulb,
    primary: true,
  },
  {
    type: 'LESSON',
    title: 'Lesson',
    description: 'A structured pedagogical sequence with exposition, examples, and practice',
    icon: BookOpen,
    primary: true,
  },
  {
    type: 'ACTIVITY',
    title: 'Activity',
    description: 'Interactive classroom engagement, group discussion, or simulation',
    icon: Activity,
    primary: true,
  },
  {
    type: 'QUESTION',
    title: 'Question / Quiz',
    description: 'Evaluative formative or summative question with rubric and distractors',
    icon: HelpCircle,
    primary: true,
  },
  {
    type: 'TOPIC',
    title: 'Topic',
    description: 'Curriculum topic grouping related concepts (e.g. Solving Equations)',
    icon: Layers,
  },
  {
    type: 'COURSE',
    title: 'Course',
    description: 'Term or grade-level course container (e.g. Grade 8 Mathematics)',
    icon: GraduationCap,
  },
  {
    type: 'UNIT',
    title: 'Unit',
    description: 'Module or chapter grouping topics (e.g. Unit 3: Linear Equations)',
    icon: FolderOpen,
  },
  {
    type: 'RESOURCE',
    title: 'Resource Reference',
    description: 'Curated video, PDF worksheet, reading, or external diagram reference',
    icon: FileText,
  },
];

export default function CreateKnowledgePage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<KnowledgeObjectType>('CONCEPT');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [initialObjective, setInitialObjective] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
      );
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) return;

    setIsSubmitting(true);
    try {
      const initialContent = JSON.stringify({
        summary: description || title,
        sections: [
          {
            id: 'sec-intro',
            title: 'Introduction',
            sectionType: 'INTRO',
            blocks: [
              {
                id: 'b-1',
                type: 'HEADING',
                level: 2,
                content: title,
              },
              {
                id: 'b-2',
                type: 'TEXT',
                content: description || 'Enter conceptual exposition here...',
              },
            ],
          },
        ],
      });

      const created = await knowledgeApi.createKnowledge({
        type: selectedType,
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        content: initialContent,
        learningObjectives: initialObjective.trim() ? [initialObjective.trim()] : ['Understand core principle'],
        prerequisites: [],
        tags: [selectedType.toLowerCase()],
      });

      router.push(`/teacher/knowledge/${created.id}/edit`);
    } catch (err) {
      console.error('Failed to create knowledge object:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 dark:bg-slate-950">
      <div className="mx-auto max-w-4xl space-y-8">
        <Link
          href="/teacher/knowledge"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Knowledge Library
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Create New Knowledge Object
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Select the educational knowledge type and define initial curriculum metadata.
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-8">
          {/* Type Selector Grid */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Step 1 — What are you creating?
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {typeOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setSelectedType(opt.type)}
                    className={`flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20 dark:border-indigo-500 dark:bg-indigo-950/30'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                    }`}
                  >
                    <div
                      className={`rounded-lg p-2 ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {opt.title}
                    </span>
                    <span className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {opt.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Core Properties Card */}
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Step 2 — Define Details
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Transposition Method in Linear Equations"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  URL Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. transposition-linear-equations"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Description / Context
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary of the concept or pedagogical objective..."
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Primary Learning Objective
                </label>
                <input
                  type="text"
                  value={initialObjective}
                  onChange={(e) => setInitialObjective(e.target.value)}
                  placeholder="e.g. Students will transpose positive terms across '=' as negatives"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <Link
                href="/teacher/knowledge"
                className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim() || !slug.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Initializing Studio...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Create & Open Editor
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
