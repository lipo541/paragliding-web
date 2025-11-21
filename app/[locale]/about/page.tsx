import AboutUs from '@/components/aboutus/AboutUs';

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <AboutUs locale={locale || 'ka'} />;
}
