export interface SelectedServiceItem {
  serviceId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CartItem {
  id: string;
  type: string; // Flight type ID or type name
  itemType?: 'flight' | 'service'; // Distinguish between flight and service
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string; // Hero image for location/flight, thumbnail for service
  companyId?: string; // Direct company ID for quick access
  locationId?: string; // Direct location ID for quick access
  pilotId?: string; // Direct pilot ID for quick access
  pilot?: {
    id: string;
    name: string;
    avatarUrl?: string;
    slug?: string; // Pilot slug for SEO-friendly linking
  };
  company?: {
    id: string;
    name: string;
    logoUrl?: string;
    slug?: string; // Company slug for SEO-friendly linking
  };
  location?: {
    id: string;
    name: string;
    slug?: string; // Location slug for linking
    countrySlug?: string; // Country slug for linking
  };
  date?: string;
  time?: string;
  passengers?: number;
  // Additional services selected for this flight
  selectedServices?: SelectedServiceItem[];
  // Service-specific fields (when itemType === 'service')
  service?: {
    id: string;
    name: string;
    slug: string;
    categoryName?: string;
    pricingOptionId?: string;
    pricingOptionName?: string;
    thumbnailUrl?: string;
  };
}

export interface CartSummaryData {
  subtotal: number;
  discount: number;
  discountCode?: string;
  tax: number;
  taxRate: number;
  total: number;
  depositAmount: number;
  depositPerPerson: number;
  totalPassengers: number;
  amountDue: number;
}

export interface CartTranslations {
  cart: string;
  yourCart: string;
  empty: string;
  emptyDescription: string;
  browsePilots: string;
  browseCompanies: string;
  pilot: string;
  company: string;
  location: string;
  date: string;
  time: string;
  passengers: string;
  passenger: string;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  deposit: string;
  amountDue: string;
  checkout: string;
  continueShopping: string;
  remove: string;
  promoCode: string;
  applyCode: string;
  tandem: string;
  acrobatic: string;
  training: string;
  photo_video: string;
}
