import React from 'react';
import { TeacherMultimodalGovernance } from '@/components/multimodal/TeacherMultimodalGovernance';
import { MultimodalOperationsDashboard } from '@/components/multimodal/MultimodalOperationsDashboard';

export const metadata = {
  title: 'Multimodal Operations & Content Governance | YOUVA-EdAI',
  description: 'Teacher authorization, FinOps budget monitoring, and operational telemetry for multimodal learning.',
};

export default function AdminMultimodalPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Multimodal Governance & Operations
          </h1>
          <p className="mt-2 text-base text-slate-400">
            Certified educator authorization for generated educational assets, FinOps cost monitoring, and real-time modality telemetry.
          </p>
        </div>

        <MultimodalOperationsDashboard />
        <TeacherMultimodalGovernance />
      </div>
    </main>
  );
}
