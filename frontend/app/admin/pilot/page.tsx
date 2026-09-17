import React from 'react';
import { PilotEvidenceDashboard } from '@/components/pilot/PilotEvidenceDashboard';

export const metadata = {
  title: 'Pilot Evidence Dashboard | YOUVA-EdAI',
  description: 'Evidence-based pilot evaluation signals and authoritative data freeze status',
};

export default function PilotDashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <PilotEvidenceDashboard tenantId="tenant-modern-school" />
    </main>
  );
}
