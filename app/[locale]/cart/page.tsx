import { Metadata } from 'next';
import CartPage from '@/components/cart/CartPage';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  
  const titles = {
    ka: 'კალათა | Paragliding Georgia',
    en: 'Cart | Paragliding Georgia',
  };
  
  const descriptions = {
    ka: 'თქვენი კალათა - დაათვალიერეთ არჩეული ფრენები და გააგრძელეთ შეკვეთა.',
    en: 'Your cart - review your selected flights and proceed to checkout.',
  };

  return {
    title: titles[locale as keyof typeof titles] || titles.ka,
    description: descriptions[locale as keyof typeof descriptions] || descriptions.ka,
  };
}

export default async function Cart({ params }: PageProps) {
  const { locale } = await params;
  return <CartPage />;
}
