'use client';

import { useState } from 'react';
import { Trash2, Plane, MapPin, Users, User, Building2, Plus, Minus, ChevronDown, Calendar, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { CartItem as CartItemType, CartTranslations, SelectedServiceItem } from '../types/cart';
import CartItemServices from './CartItemServices';

interface FlightTypeOption {
  id: string;
  name: string;
  price: number;
}

interface CartItemProps {
  item: CartItemType;
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onChangeFlightType?: (id: string, flightType: FlightTypeOption) => void;
  onServicesChange?: (id: string, services: SelectedServiceItem[]) => void;
  onDateChange?: (id: string, date: string) => void;
  flightTypeOptions?: FlightTypeOption[];
  translations: CartTranslations;
  locale?: string;
}

export default function CartItem({ item, onRemove, onUpdateQuantity, onChangeFlightType, onServicesChange, onDateChange, flightTypeOptions, translations, locale = 'ka' }: CartItemProps) {
  const [showFlightTypeDropdown, setShowFlightTypeDropdown] = useState(false);

  const getFlightTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      tandem: translations.tandem,
      acrobatic: translations.acrobatic,
      training: translations.training,
      photo_video: translations.photo_video,
    };
    return labels[type] || type;
  };

  const getFlightTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      tandem: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      acrobatic: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
      training: 'bg-green-500/10 text-green-600 dark:text-green-400',
      photo_video: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    };
    return colors[type] || 'bg-[#4697D2]/10 text-[#4697D2] dark:text-[#4697D2]';
  };

  const handleFlightTypeSelect = (option: FlightTypeOption) => {
    if (onChangeFlightType) {
      onChangeFlightType(item.id, option);
    }
    setShowFlightTypeDropdown(false);
  };

  return (
    <div className={`bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-xl p-3 hover:shadow-lg transition-all duration-300 ${showFlightTypeDropdown ? 'relative z-50' : ''}`}>
      {/* Header - Compact */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-lg overflow-hidden bg-[#4697D2]/10 dark:bg-[#4697D2]/20 flex items-center justify-center flex-shrink-0">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.name}
                width={36}
                height={36}
                className="w-full h-full object-cover"
              />
            ) : item.service?.thumbnailUrl ? (
              <Image
                src={item.service.thumbnailUrl}
                alt={item.name}
                width={36}
                height={36}
                className="w-full h-full object-cover"
              />
            ) : (
              <Plane className="w-4 h-4 text-[#4697D2]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">{item.name}</h3>
            {/* Flight Type - Clickable if has options */}
            {flightTypeOptions && flightTypeOptions.length > 1 && onChangeFlightType ? (
              <div className="relative">
                <button
                  onClick={() => setShowFlightTypeDropdown(!showFlightTypeDropdown)}
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${getFlightTypeColor(item.type)} hover:opacity-80`}
                >
                  {item.name}
                  <ChevronDown className={`w-2.5 h-2.5 ${showFlightTypeDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showFlightTypeDropdown && (
                  <>
                    <div className="fixed inset-0 z-[100]" onClick={() => setShowFlightTypeDropdown(false)} />
                    <div className="absolute left-0 top-full mt-0.5 z-[101] min-w-[140px] bg-white dark:bg-zinc-800 rounded shadow-lg border border-foreground/10 py-0.5">
                      {flightTypeOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleFlightTypeSelect(option)}
                          className={`w-full px-2 py-1 text-left text-[10px] flex justify-between hover:bg-[#4697D2]/10 ${option.id === item.type ? 'bg-[#4697D2]/10' : ''}`}
                        >
                          <span className="text-foreground truncate">{option.name}</span>
                          <span className="text-[#4697D2] font-medium">₾{option.price}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${getFlightTypeColor(item.type)}`}>
                {item.location?.name}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => onRemove(item.id)}
          className="p-1.5 text-foreground/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
          aria-label={translations.remove}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Details - Compact Row with Links */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2 text-[10px]">
        {/* Pilot - Link to pilot page (slug preferred, fallback to ID) */}
        {item.pilot && (item.pilot.slug || item.pilot.id) ? (
          <Link
            href={`/${locale}/pilot/${item.pilot.slug || item.pilot.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-foreground/5 hover:bg-[#4697D2]/20 transition-colors group cursor-pointer"
          >
            {item.pilot.avatarUrl ? (
              <Image src={item.pilot.avatarUrl} alt={item.pilot.name} width={14} height={14} className="rounded-full" />
            ) : (
              <User className="w-3 h-3 text-[#4697D2]" />
            )}
            <span className="text-foreground/80 truncate max-w-[80px] group-hover:text-[#4697D2]">{item.pilot.name}</span>
          </Link>
        ) : item.pilot ? (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-foreground/5">
            {item.pilot.avatarUrl ? (
              <Image src={item.pilot.avatarUrl} alt={item.pilot.name} width={14} height={14} className="rounded-full" />
            ) : (
              <User className="w-3 h-3 text-[#4697D2]" />
            )}
            <span className="text-foreground/80 truncate max-w-[80px]">{item.pilot.name}</span>
          </div>
        ) : null}
        {/* Company - Link to company page (slug preferred, fallback to ID) */}
        {item.company && (item.company.slug || item.company.id) ? (
          <Link
            href={`/${locale}/company/${item.company.slug || item.company.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-foreground/5 hover:bg-[#4697D2]/20 transition-colors group cursor-pointer"
          >
            {item.company.logoUrl ? (
              <Image src={item.company.logoUrl} alt={item.company.name} width={14} height={14} className="rounded-full" />
            ) : (
              <Building2 className="w-3 h-3 text-[#4697D2]" />
            )}
            <span className="text-foreground/80 truncate max-w-[80px] group-hover:text-[#4697D2]">{item.company.name}</span>
          </Link>
        ) : item.company ? (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-foreground/5">
            {item.company.logoUrl ? (
              <Image src={item.company.logoUrl} alt={item.company.name} width={14} height={14} className="rounded-full" />
            ) : (
              <Building2 className="w-3 h-3 text-[#4697D2]" />
            )}
            <span className="text-foreground/80 truncate max-w-[80px]">{item.company.name}</span>
          </div>
        ) : null}
        {/* Location - Link to location page if slug available */}
        {item.location && (
          item.location.slug && item.location.countrySlug ? (
            <Link
              href={`/${locale}/locations/${item.location.countrySlug}/${item.location.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors group"
            >
              <MapPin className="w-3 h-3 text-emerald-600" />
              <span className="text-foreground/80 truncate max-w-[80px] group-hover:text-emerald-600">{item.location.name}</span>
            </Link>
          ) : (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10">
              <MapPin className="w-3 h-3 text-emerald-600" />
              <span className="text-foreground/80 truncate max-w-[80px]">{item.location.name}</span>
            </div>
          )
        )}
        {/* Date */}
        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${item.date ? 'bg-purple-500/10' : 'bg-red-500/10'}`}>
          <Calendar className={`w-3 h-3 ${item.date ? 'text-purple-600' : 'text-red-500'}`} />
          <input
            type="date"
            value={item.date || ''}
            onChange={(e) => onDateChange && onDateChange(item.id, e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className={`bg-transparent border-none p-0 text-[10px] w-[90px] focus:outline-none ${item.date ? 'text-foreground' : 'text-red-500'}`}
          />
        </div>
      </div>

      {/* Additional Services for this Flight */}
      {/* Show services if we have a company OR a location (for platform bookings) */}
      {(item.companyId || item.company?.id || item.locationId || item.location?.id) && onServicesChange && (
        <CartItemServices
          companyId={item.companyId || item.company?.id || ''}
          companyName={item.company?.name || ''}
          locationId={item.locationId || item.location?.id}
          locale={locale}
          numberOfPeople={item.quantity}
          selectedServices={item.selectedServices || []}
          onServicesChange={(services) => onServicesChange(item.id, services)}
        />
      )}

      {/* Price & Passengers - Compact */}
      <div className="flex items-center justify-between pt-2 border-t border-foreground/10">
        {/* Passengers Controls */}
        <div className="flex items-center gap-2">
          <Users className="w-3 h-3 text-pink-600" />
          <div className="flex items-center gap-1">
            <button
              onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
              disabled={item.quantity <= 1}
              className="w-6 h-6 flex items-center justify-center rounded bg-foreground/5 hover:bg-foreground/10 text-foreground disabled:opacity-40 transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-5 text-center text-xs font-semibold text-foreground">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              className="w-6 h-6 flex items-center justify-center rounded bg-foreground/5 hover:bg-foreground/10 text-foreground transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Price */}
        <div className="text-right">
          {(() => {
            const flightTotal = item.price * item.quantity;
            const servicesTotal = (item.selectedServices || []).reduce((sum, s) => sum + s.price * s.quantity, 0);
            const total = flightTotal + servicesTotal;
            return (
              <>
                <span className="text-sm font-bold text-[#4697D2]">{total}₾</span>
                {(item.quantity > 1 || servicesTotal > 0) && (
                  <p className="text-[10px] text-foreground/50">
                    {item.price}₾×{item.quantity}{servicesTotal > 0 && ` +${servicesTotal}₾`}
                  </p>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
