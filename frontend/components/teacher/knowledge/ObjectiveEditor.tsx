'use client';

import React, { useState } from 'react';
import { CheckCircle2, Plus, Trash2 } from 'lucide-react';

interface ObjectiveEditorProps {
  objectives: string[];
  onChange: (objectives: string[]) => void;
}

export const ObjectiveEditor: React.FC<ObjectiveEditorProps> = ({
  objectives,
  onChange,
}) => {
  const [newObjective, setNewObjective] = useState('');

  const handleAdd = () => {
    if (!newObjective.trim()) return;
    onChange([...objectives, newObjective.trim()]);
    setNewObjective('');
  };

  const handleRemove = (index: number) => {
    onChange(objectives.filter((_, i) => i !== index));
  };

  const handleUpdate = (index: number, text: string) => {
    const updated = [...objectives];
    updated[index] = text;
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Learning Objectives ({objectives.length})
        </label>
      </div>

      <div className="space-y-2">
        {objectives.map((obj, index) => (
          <div
            key={index}
            className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 transition-colors focus-within:border-indigo-500 focus-within:bg-white dark:border-slate-800 dark:bg-slate-900/50"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <input
              type="text"
              value={obj}
              onChange={(e) => handleUpdate(index, e.target.value)}
              className="flex-1 text-xs text-slate-800 focus:outline-none dark:bg-transparent dark:text-slate-200"
              placeholder="e.g. Students will isolate variables using transposition..."
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="rounded p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400"
              title="Remove objective"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newObjective}
          onChange={(e) => setNewObjective(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="Add learning objective (e.g. Students can define...)"
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>
    </div>
  );
};
