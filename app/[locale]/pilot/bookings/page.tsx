import PilotBottomNav from '@/components/pilotbottomnav/PilotBottomNav';
import PilotBookings from '@/components/pilotbottomnav/PilotBookings';

export default function PilotBookingsPage() {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pr-20">
      <PilotBottomNav />
      <main>
        <PilotBookings />
      </main>
    </div>
  );
}
