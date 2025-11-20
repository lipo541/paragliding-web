import ContactPage from '@/components/contact/ContactPage';

export default async function Contact({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  return <ContactPage locale={locale} />;
}
