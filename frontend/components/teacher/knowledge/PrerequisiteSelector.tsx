'use client';

import React, { useState } from 'react';
import { Network, Plus, X } from 'lucide-react';

interface PrerequisiteSelectorProps {
  prerequisites: string[];
  onChange: (prerequisites: string[]) => void;
}

export const PrerequisiteSelector: React.FC<PrerequisiteSelectorProps> = ({
  prerequisites,
  onChange,
}) => {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    if (!input.trim() || prerequisites.includes(input.trim())) return;
    onChange([...prerequisites, input.trim()]);
    setInput('');
  };

  const handleRemove = (item: string) => {
    onChange(prerequisites.filter((p) => p !== item));
  };

  return (
    <div className="space-y-3">
      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Prerequisites ({prerequisites.length})
      </label>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        What should students already understand before learning this?
      </p>

      <div className="flex flex-wrap gap-1.5">
        {prerequisites.map((prereq) => (
          <span
            key={prereq}
            className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50/60 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300"
          >
            <Network className="h-3 w-3" />
            {prereq}
            <button
              type="button"
              onClick={() => handleRemove(prereq)}
              className="rounded-full p-0.5 hover:bg-indigo-200 dark:hover:bg-indigo-800"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="e.g. Integer Operations, Equality..."
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>
    </div>
  );
};
