'use client';

import Link from 'next/link';
import { ShoppingCart, Users, Building2 } from 'lucide-react';
import { CartTranslations } from '../types/cart';

interface EmptyCartProps {
  translations: CartTranslations;
  locale: string;
}

export default function EmptyCart({ translations, locale }: EmptyCartProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Icon */}
      <div className="w-24 h-24 mb-6 rounded-full bg-foreground/5 flex items-center justify-center">
        <ShoppingCart className="w-12 h-12 text-foreground/30" />
      </div>

      {/* Text */}
      <h2 className="text-2xl font-bold text-foreground mb-2">{translations.empty}</h2>
      <p className="text-foreground/60 text-center max-w-md mb-8">
        {translations.emptyDescription}
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href={`/${locale}/pilots`}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-foreground hover:bg-foreground/90 text-background font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Users className="w-5 h-5" />
          {translations.browsePilots}
        </Link>
        <Link
          href={`/${locale}/companies`}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-foreground/5 hover:bg-foreground/10 text-foreground font-semibold rounded-xl border border-foreground/20 transition-colors"
        >
          <Building2 className="w-5 h-5" />
          {translations.browseCompanies}
        </Link>
      </div>
    </div>
  );
}
