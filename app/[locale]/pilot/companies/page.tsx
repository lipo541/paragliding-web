'use client';

import PilotCompanies from '@/components/pilotbottomnav/PilotCompanies';
import PilotBottomNav from '@/components/pilotbottomnav/PilotBottomNav';

export default function PilotCompaniesPage() {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pr-20">
      <PilotBottomNav />
      <main className="mx-auto max-w-6xl p-4 md:p-8">
        <PilotCompanies />
      </main>
    </div>
  );
}
