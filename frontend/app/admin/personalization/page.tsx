import React from 'react';
import { PersonalizationAnalyticsDashboard } from '@/components/personalization/PersonalizationAnalyticsDashboard';

export const metadata = {
  title: 'Personalization & Adaptation Engine | YOUVA-EdAI',
  description: 'Governed deep personalization metrics, teacher override analytics, and policy registry',
};

export default function PersonalizationAdminPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <PersonalizationAnalyticsDashboard tenantId="tenant-modern-school" />
    </main>
  );
}
