import React from 'react';
import { MultimodalTutorInterface } from '@/components/multimodal/MultimodalTutorInterface';

export const metadata = {
  title: 'Multimodal Learning Experience | YOUVA-EdAI',
  description: 'Evidence-based multimodal learning combining voice, vision, diagrams, and text.',
};

export default function MultimodalStudentPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Interactive Multimodal Study Workspace
          </h1>
          <p className="mt-2 text-base text-slate-400">
            Choose how you learn best: read explanations, listen to audio walkthroughs, watch visual demonstrations, or speak and solve problems interactively.
          </p>
        </div>

        <MultimodalTutorInterface />
      </div>
    </main>
  );
}
