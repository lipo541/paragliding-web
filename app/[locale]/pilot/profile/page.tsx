import PilotProfile from '@/components/pilotbottomnav/PilotProfile';
import PilotBottomNav from '@/components/pilotbottomnav/PilotBottomNav';

export default function PilotProfilePage() {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pr-20">
      <PilotBottomNav />
      <main className="mx-auto max-w-4xl p-4 md:p-8">
        <PilotProfile />
      </main>
    </div>
  );
}
