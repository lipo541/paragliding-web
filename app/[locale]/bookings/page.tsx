import BookingsPage from '@/components/bookings/BookingsPage';

interface BookingsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function Bookings({ params }: BookingsPageProps) {
  const { locale } = await params;

  return <BookingsPage />;
}
