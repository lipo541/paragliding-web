import GlobalLocations from '@/components/globallocation/GlobalLocations';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function LocationsPage({ params }: PageProps) {
  const { locale } = await params;
  return <GlobalLocations locale={locale} />;
}
