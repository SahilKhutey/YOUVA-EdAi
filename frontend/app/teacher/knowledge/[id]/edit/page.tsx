'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Eye,
  Check,
  AlertCircle,
  Loader2,
  History,
  Layers,
  Sparkles,
  Plus,
  BookOpen,
} from 'lucide-react';
import { knowledgeApi } from '../../../../../lib/api/knowledgeApi';
import {
  KnowledgeObjectItem,
  ContentBlock,
  LessonSection,
} from '../../../../../types/knowledge';
import { ContentBlockEditor } from '../../../../../components/teacher/knowledge/ContentBlockEditor';
import { ObjectiveEditor } from '../../../../../components/teacher/knowledge/ObjectiveEditor';
import { PrerequisiteSelector } from '../../../../../components/teacher/knowledge/PrerequisiteSelector';
import { ValidationPanel, computeValidation } from '../../../../../components/teacher/knowledge/ValidationPanel';
import { PublishPanel } from '../../../../../components/teacher/knowledge/PublishPanel';
import { AIAssistPanel } from '../../../../../components/teacher/knowledge/AIAssistPanel';
import { StudentPreviewModal } from '../../../../../components/teacher/knowledge/StudentPreviewModal';

export default function KnowledgeEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [item, setItem] = useState<KnowledgeObjectItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SAVED' | 'ERROR'>('IDLE');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [objectives, setObjectives] = useState<string[]>([]);
  const [prerequisites, setPrerequisites] = useState<string[]>([]);

  // Sections navigation
  const [sections, setSections] = useState<Array<{ id: string; title: string }>>([
    { id: 'sec-intro', title: 'Introduction' },
    { id: 'sec-concept', title: 'Core Concept' },
    { id: 'sec-example', title: 'Worked Examples' },
    { id: 'sec-practice', title: 'Practice & Check' },
  ]);
  const [activeSectionId, setActiveSectionId] = useState('sec-intro');

  // Debounce ref for auto-saving
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial data
  useEffect(() => {
    async function loadDetail() {
      try {
        const data = await knowledgeApi.getTeacherKnowledgeDetail(id);
        setItem(data);
        setTitle(data.title);
        setDescription(data.description || '');
        setObjectives(data.objectives?.map((o) => o.objective) || []);
        setPrerequisites(data.incomingLinks?.filter((l) => l.relation === 'PREREQUISITE').map((l) => l.source?.title || 'Prior Concept') || []);

        // Parse latest content
        const latestVersion = data.versions?.[0];
        if (latestVersion?.content) {
          try {
            const parsed = JSON.parse(latestVersion.content);
            if (parsed.sections && parsed.sections[0]?.blocks) {
              setBlocks(parsed.sections[0].blocks);
            } else {
              setBlocks([{ id: 'b-init', type: 'TEXT', content: latestVersion.content }]);
            }
          } catch {
            setBlocks([{ id: 'b-init', type: 'TEXT', content: latestVersion.content }]);
          }
        }
      } catch (err) {
        console.error('Failed to load knowledge detail:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      loadDetail();
    }
  }, [id]);

  // Autosave function
  const triggerAutoSave = useCallback(
    (newTitle: string, newDesc: string, newBlocks: ContentBlock[], newObjectives: string[]) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      setSaveStatus('SAVING');
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const contentPayload = JSON.stringify({
            summary: newDesc || newTitle,
            sections: [
              {
                id: activeSectionId,
                title: newTitle,
                blocks: newBlocks,
              },
            ],
          });

          await knowledgeApi.updateKnowledge(id, {
            title: newTitle,
            description: newDesc,
            content: contentPayload,
            learningObjectives: newObjectives,
          });

          setSaveStatus('SAVED');
        } catch (err) {
          console.error('Autosave failed:', err);
          setSaveStatus('ERROR');
        }
      }, 1200); // 1.2s debounce
    },
    [id, activeSectionId],
  );

  // Trigger autosave on field changes
  const handleTitleChange = (val: string) => {
    setTitle(val);
    triggerAutoSave(val, description, blocks, objectives);
  };

  const handleDescriptionChange = (val: string) => {
    setDescription(val);
    triggerAutoSave(title, val, blocks, objectives);
  };

  const handleBlocksChange = (newBlocks: ContentBlock[]) => {
    setBlocks(newBlocks);
    triggerAutoSave(title, description, newBlocks, objectives);
  };

  const handleObjectivesChange = (newObjectives: string[]) => {
    setObjectives(newObjectives);
    triggerAutoSave(title, description, blocks, newObjectives);
  };

  const handlePrerequisitesChange = (newPrereqs: string[]) => {
    setPrerequisites(newPrereqs);
  };

  // Publishing Workflow Handlers
  const handleSubmitForReview = async () => {
    try {
      const updated = await knowledgeApi.submitForReview(id);
      setItem(updated);
    } catch (err) {
      console.error('Submit for review failed:', err);
    }
  };

  const handleApprove = async () => {
    try {
      const updated = await knowledgeApi.approveKnowledge(id);
      setItem(updated);
    } catch (err) {
      console.error('Approve failed:', err);
    }
  };

  const handlePublish = async (notes?: string) => {
    try {
      const updated = await knowledgeApi.publishKnowledge(id, notes);
      setItem(updated);
    } catch (err) {
      console.error('Publish failed:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
          Loading Knowledge Studio Editor...
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

  const validationReport = computeValidation({
    title,
    content: blocks.map((b: any) => b.content || b.prompt || '').join(' '),
    objectives,
    subjectId: item.subjectId,
    topicId: item.topicId,
    prerequisites,
  });

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50 dark:bg-slate-950">
      {/* Top Header */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div className="flex items-center gap-3">
          <Link
            href="/teacher/knowledge"
            className="inline-flex items-center gap-1.5 rounded-lg p-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Library
          </Link>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="inline-flex items-center gap-1.5 font-bold text-slate-900 text-sm dark:text-slate-100">
            <BookOpen className="h-4 w-4 text-indigo-600" />
            {item.type}: {title || 'Untitled'}
          </span>
          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            v{item.currentVersion} • {item.status}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Autosave Status Indicator */}
          <div className="flex items-center gap-1 text-xs text-slate-500">
            {saveStatus === 'SAVING' && (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                <span>Saving...</span>
              </>
            )}
            {saveStatus === 'SAVED' && (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Saved just now</span>
              </>
            )}
            {saveStatus === 'ERROR' && (
              <>
                <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                <span className="text-red-500">Unable to save</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <Eye className="h-3.5 w-3.5" />
            Student Preview
          </button>

          <Link
            href={`/teacher/knowledge/${id}/versions`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <History className="h-3.5 w-3.5" />
            History
          </Link>
        </div>
      </header>

      {/* Three-Part Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column: STRUCTURE / SECTIONS */}
        <aside className="w-64 shrink-0 border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 hidden md:block">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Structure
            </span>
          </div>

          <nav className="space-y-1">
            {sections.map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSectionId(sec.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  activeSectionId === sec.id
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <Layers className="h-3.5 w-3.5 text-slate-400" />
                {sec.title}
              </button>
            ))}
          </nav>
        </aside>

        {/* Center Column: CONTENT EDITOR */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Lesson / Concept Title..."
                className="w-full text-2xl font-bold text-slate-900 focus:outline-none dark:bg-transparent dark:text-slate-100"
              />
            </div>

            <div>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder="Add pedagogical description or student overview..."
                className="w-full resize-none text-xs text-slate-600 focus:outline-none dark:bg-transparent dark:text-slate-400"
              />
            </div>
          </div>

          {/* Block-based editor */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Content Blocks ({blocks.length})
            </label>
            <ContentBlockEditor blocks={blocks} onChange={handleBlocksChange} />
          </div>
        </main>

        {/* Right Column: PROPERTIES & METADATA */}
        <aside className="w-80 shrink-0 border-l border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50 overflow-y-auto space-y-6 hidden lg:block">
          {/* Objectives Editor */}
          <ObjectiveEditor objectives={objectives} onChange={handleObjectivesChange} />

          {/* Prerequisites Selector */}
          <PrerequisiteSelector
            prerequisites={prerequisites}
            onChange={handlePrerequisitesChange}
          />

          {/* Real-time Validation Panel */}
          <ValidationPanel
            title={title}
            content={blocks.map((b: any) => b.content || b.prompt || '').join(' ')}
            objectives={objectives}
            subjectId={item.subjectId}
            topicId={item.topicId}
            prerequisites={prerequisites}
          />

          {/* Publishing Panel */}
          <PublishPanel
            status={item.status}
            currentVersion={item.currentVersion}
            isValid={validationReport.isValid}
            onSubmitForReview={handleSubmitForReview}
            onApprove={handleApprove}
            onPublish={handlePublish}
          />

          {/* AI Copilot Panel */}
          <AIAssistPanel
            conceptTitle={title}
            knowledgeId={item.id}
            onAddContentBlock={(newBlock) => handleBlocksChange([...blocks, newBlock])}
            onAddObjective={(newObj) => handleObjectivesChange([...objectives, newObj])}
            onAddPrerequisite={(newPre) => handlePrerequisitesChange([...prerequisites, newPre])}
          />
        </aside>
      </div>

      {/* Student Preview Modal */}
      <StudentPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title={title}
        type={item.type}
        objectives={objectives}
        prerequisites={prerequisites}
        blocks={blocks}
      />
    </div>
  );
}
