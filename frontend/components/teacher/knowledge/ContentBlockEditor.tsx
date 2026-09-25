'use client';

import React from 'react';
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  HelpCircle,
  Lightbulb,
  AlertCircle,
  Trash2,
  ChevronUp,
  ChevronDown,
  Plus,
  Activity,
} from 'lucide-react';
import { ContentBlock } from '../../../types/knowledge';

interface ContentBlockEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}

export const ContentBlockEditor: React.FC<ContentBlockEditorProps> = ({
  blocks,
  onChange,
}) => {
  const addBlock = (type: ContentBlock['type']) => {
    const id = `block-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    let newBlock: ContentBlock;

    switch (type) {
      case 'HEADING':
        newBlock = { type: 'HEADING', id, level: 2, content: 'Section Heading' };
        break;
      case 'EXAMPLE':
        newBlock = {
          type: 'EXAMPLE',
          id,
          title: 'Worked Example',
          content: 'Step 1: Identify given terms...\nStep 2: Apply inverse operation...',
        };
        break;
      case 'CALLOUT':
        newBlock = {
          type: 'CALLOUT',
          id,
          title: 'Key Takeaway',
          content: 'Remember that inverse operations preserve the equality scale.',
          variant: 'NOTE',
        };
        break;
      case 'QUESTION':
        newBlock = {
          type: 'QUESTION',
          id,
          prompt: 'Solve for x: 2x + 4 = 12',
          options: ['x = 4', 'x = 8', 'x = 3', 'x = 6'],
          answer: 'x = 4',
        };
        break;
      case 'ACTIVITY':
        newBlock = {
          type: 'ACTIVITY',
          id,
          title: 'Class Discussion / Quick Poll',
          instructions: 'Turn to your partner and explain what happens when you transpose a negative term.',
        };
        break;
      case 'TEXT':
      default:
        newBlock = { type: 'TEXT', id, content: 'Enter conceptual exposition here...' };
        break;
    }

    onChange([...blocks, newBlock]);
  };

  const updateBlock = (id: string, updated: Partial<ContentBlock>) => {
    onChange(
      blocks.map((b) => (b.id === id ? ({ ...b, ...updated } as ContentBlock) : b)),
    );
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter((b) => b.id !== id));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;

    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(index, 1);
    newBlocks.splice(targetIndex, 0, moved);
    onChange(newBlocks);
  };

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => (
        <div
          key={block.id}
          className="group relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
              {block.type === 'HEADING' && <Heading2 className="h-3.5 w-3.5 text-indigo-500" />}
              {block.type === 'TEXT' && <Type className="h-3.5 w-3.5 text-slate-500" />}
              {block.type === 'EXAMPLE' && <Lightbulb className="h-3.5 w-3.5 text-amber-500" />}
              {block.type === 'CALLOUT' && <AlertCircle className="h-3.5 w-3.5 text-blue-500" />}
              {block.type === 'QUESTION' && <HelpCircle className="h-3.5 w-3.5 text-emerald-500" />}
              {block.type === 'ACTIVITY' && <Activity className="h-3.5 w-3.5 text-purple-500" />}
              {block.type} BLOCK
            </span>

            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              <button
                type="button"
                onClick={() => moveBlock(index, 'up')}
                disabled={index === 0}
                className="rounded p-1 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
                title="Move up"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => moveBlock(index, 'down')}
                disabled={index === blocks.length - 1}
                className="rounded p-1 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
                title="Move down"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => removeBlock(block.id)}
                className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                title="Delete block"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Block Content Rendering & Editors */}
          {block.type === 'HEADING' && (
            <div className="flex items-center gap-2">
              <select
                value={block.level}
                onChange={(e) =>
                  updateBlock(block.id, { level: Number(e.target.value) as 1 | 2 | 3 })
                }
                className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
              >
                <option value={1}>H1</option>
                <option value={2}>H2</option>
                <option value={3}>H3</option>
              </select>
              <input
                type="text"
                value={block.content}
                onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                className="w-full text-base font-bold text-slate-900 focus:outline-none dark:text-slate-100"
                placeholder="Heading title..."
              />
            </div>
          )}

          {block.type === 'TEXT' && (
            <textarea
              rows={3}
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              className="w-full resize-y text-sm text-slate-800 focus:outline-none dark:text-slate-200 dark:bg-transparent"
              placeholder="Write explanation or content... (Markdown & KaTeX supported)"
            />
          )}

          {block.type === 'EXAMPLE' && (
            <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
              <input
                type="text"
                value={block.title}
                onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                className="w-full font-semibold text-amber-900 focus:outline-none dark:text-amber-300 dark:bg-transparent"
                placeholder="Example Title (e.g. Worked Example: Solving 2x + 7 = 15)"
              />
              <textarea
                rows={3}
                value={block.content}
                onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                className="w-full resize-y text-sm text-amber-950 focus:outline-none dark:text-amber-100 dark:bg-transparent"
                placeholder="Step-by-step worked breakdown..."
              />
            </div>
          )}

          {block.type === 'CALLOUT' && (
            <div className="space-y-1 rounded-lg border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900/40 dark:bg-blue-950/20">
              <input
                type="text"
                value={block.title || ''}
                onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                className="w-full font-semibold text-blue-900 focus:outline-none dark:text-blue-300 dark:bg-transparent"
                placeholder="Callout Title..."
              />
              <textarea
                rows={2}
                value={block.content}
                onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                className="w-full resize-y text-sm text-blue-950 focus:outline-none dark:text-blue-100 dark:bg-transparent"
                placeholder="Important takeaway, note, or tip..."
              />
            </div>
          )}

          {block.type === 'QUESTION' && (
            <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <input
                type="text"
                value={block.prompt}
                onChange={(e) => updateBlock(block.id, { prompt: e.target.value })}
                className="w-full font-semibold text-emerald-950 focus:outline-none dark:text-emerald-100 dark:bg-transparent"
                placeholder="Question prompt (e.g. Solve for y: 3y - 5 = 16)"
              />
              <div className="space-y-1 text-xs">
                <span className="font-medium text-emerald-800 dark:text-emerald-300">
                  Multiple Choice Options:
                </span>
                {block.options?.map((opt, optIndex) => (
                  <input
                    key={optIndex}
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...(block.options || [])];
                      newOpts[optIndex] = e.target.value;
                      updateBlock(block.id, { options: newOpts });
                    }}
                    className="w-full rounded border border-emerald-200 bg-white px-2 py-1 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-100"
                  />
                ))}
              </div>
              <input
                type="text"
                value={block.answer || ''}
                onChange={(e) => updateBlock(block.id, { answer: e.target.value })}
                className="w-full text-xs font-medium text-emerald-900 placeholder-emerald-600 focus:outline-none dark:text-emerald-200 dark:bg-transparent"
                placeholder="Correct answer key or explanation..."
              />
            </div>
          )}

          {block.type === 'ACTIVITY' && (
            <div className="space-y-2 rounded-lg border border-purple-200 bg-purple-50/50 p-3 dark:border-purple-900/40 dark:bg-purple-950/20">
              <input
                type="text"
                value={block.title}
                onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                className="w-full font-semibold text-purple-950 focus:outline-none dark:text-purple-200 dark:bg-transparent"
                placeholder="Activity Title..."
              />
              <textarea
                rows={2}
                value={block.instructions}
                onChange={(e) => updateBlock(block.id, { instructions: e.target.value })}
                className="w-full resize-y text-sm text-purple-950 focus:outline-none dark:text-purple-100 dark:bg-transparent"
                placeholder="Instructions for students..."
              />
            </div>
          )}
        </div>
      ))}

      {/* Block Inserter Bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-slate-300 p-3 text-xs dark:border-slate-700">
        <span className="font-medium text-slate-500 dark:text-slate-400">Add Block:</span>
        <button
          type="button"
          onClick={() => addBlock('TEXT')}
          className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
        >
          <Type className="h-3 w-3" /> Text
        </button>
        <button
          type="button"
          onClick={() => addBlock('HEADING')}
          className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300"
        >
          <Heading2 className="h-3 w-3" /> Heading
        </button>
        <button
          type="button"
          onClick={() => addBlock('EXAMPLE')}
          className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300"
        >
          <Lightbulb className="h-3 w-3" /> Example
        </button>
        <button
          type="button"
          onClick={() => addBlock('CALLOUT')}
          className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300"
        >
          <AlertCircle className="h-3 w-3" /> Callout
        </button>
        <button
          type="button"
          onClick={() => addBlock('QUESTION')}
          className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          <HelpCircle className="h-3 w-3" /> Question
        </button>
        <button
          type="button"
          onClick={() => addBlock('ACTIVITY')}
          className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2.5 py-1 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300"
        >
          <Activity className="h-3 w-3" /> Activity
        </button>
      </div>
    </div>
  );
};
