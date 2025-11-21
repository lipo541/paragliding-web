import PromotionPage from '@/components/promotions/PromotionPage';

export default async function PromotionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <PromotionPage locale={locale || 'ka'} />;
}
