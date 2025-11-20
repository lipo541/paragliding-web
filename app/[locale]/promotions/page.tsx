import PromotionPage from '@/components/promotions/PromotionPage';

export default function PromotionsPage({ params }: { params: { locale: string } }) {
  const locale = params.locale || 'ka';
  return <PromotionPage locale={locale} />;
}
