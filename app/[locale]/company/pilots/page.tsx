'use client';

import CompanyPilots from '@/components/companybottomnav/CompanyPilots';
import CompanyBottomNav from '@/components/companybottomnav/CompanyBottomNav';

export default function CompanyPilotsPage() {
  return (
    <div className="min-h-screen">
      <CompanyPilots />
      <CompanyBottomNav />
    </div>
  );
}
