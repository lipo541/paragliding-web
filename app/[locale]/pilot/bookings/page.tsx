import PilotBottomNav from '@/components/pilotbottomnav/PilotBottomNav';

export default function PilotBookingsPage() {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pr-20">
      <PilotBottomNav />
      <main className="mx-auto max-w-6xl p-4 md:p-8">
        {/* TODO: Enable when bookings table is created */}
        <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-[#4697D2]/30 dark:text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-[#1a1a1a] dark:text-white mb-2">
            ჯავშნები მალე
          </h3>
          <p className="text-sm text-[#1a1a1a]/60 dark:text-white/60">
            ჯავშნების სისტემა მალე დაემატება
          </p>
        </div>
      </main>
    </div>
  );
}
