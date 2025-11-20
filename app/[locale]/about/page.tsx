import AboutUs from '@/components/aboutus/AboutUs';

export default function AboutPage({ params }: { params: { locale: string } }) {
  const locale = params.locale || 'ka';
  return <AboutUs locale={locale} />;
}
