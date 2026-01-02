'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ShoppingCart, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { CartItem, CartSummary, EmptyCart } from './components';
import CheckoutConfirmationModal from './CheckoutConfirmationModal';
import { CartSummaryData, CartTranslations } from './types/cart';
import { useCart } from '@/lib/context/CartContext';
import { createClient } from '@/lib/supabase/client';
import Breadcrumbs, { buildBreadcrumbs, type Locale } from '@/components/shared/Breadcrumbs';
import { useSupabase } from '@/lib/supabase/SupabaseProvider';

interface FlightTypeOption {
  id: string;
  name: string;
  price: number;
}

const translations: Record<string, CartTranslations & {
  bookingSuccess: string;
  bookingError: string;
  bookingInProgress: string;
  loginRequired: string;
  missingInfo: string;
  // Modal translations
  modalTitle: string;
  modalSubtitle: string;
  modalFullName: string;
  modalPhone: string;
  modalContactMethod: string;
  modalContactHint: string;
  modalWhatsapp: string;
  modalTelegram: string;
  modalViber: string;
  modalConfirm: string;
  modalCancel: string;
  modalPhoneRequired: string;
  modalNameRequired: string;
  // Success modal translations
  bookingSuccessTitle: string;
  bookingSuccessSubtitle: string;
  people: string;
  includedServices: string;
  notificationHint: string;
  backToHome: string;
  viewBookings: string;
}> = {
  ka: {
    cart: 'კალათა',
    yourCart: 'თქვენი კალათა',
    empty: 'კალათა ცარიელია',
    emptyDescription: 'დაათვალიერეთ ჩვენი პილოტები და კომპანიები, აირჩიეთ სასურველი ფრენა და დაამატეთ კალათაში.',
    browsePilots: 'პილოტების ნახვა',
    browseCompanies: 'კომპანიების ნახვა',
    pilot: 'პილოტი',
    company: 'კომპანია',
    location: 'ლოკაცია',
    date: 'თარიღი',
    time: 'დრო',
    passengers: 'მგზავრები',
    passenger: 'მგზავრი',
    subtotal: 'ქვეჯამი',
    discount: 'ფასდაკლება',
    tax: 'დღგ',
    total: 'სულ',
    deposit: 'ონლაინ გადახდა (დეპოზიტი)',
    amountDue: 'ადგილზე გადასახდელი',
    checkout: 'გადახდაზე გადასვლა',
    continueShopping: 'ყიდვის გაგრძელება',
    remove: 'წაშლა',
    promoCode: 'პრომო კოდი',
    applyCode: 'გამოყენება',
    tandem: 'ტანდემ ფრენა',
    acrobatic: 'აკრობატიკა',
    training: 'სწავლება',
    photo_video: 'ფოტო/ვიდეო',
    bookingSuccess: 'ჯავშნები წარმატებით შეიქმნა!',
    bookingError: 'ჯავშნის შექმნა ვერ მოხერხდა',
    bookingInProgress: 'მიმდინარეობს ჯავშნის შექმნა...',
    loginRequired: 'გთხოვთ შეავსოთ სახელი და ტელეფონის ნომერი',
    missingInfo: 'გთხოვთ აირჩიოთ თარიღი ყველა ფრენისთვის',
    // Modal translations
    modalTitle: 'საკონტაქტო ინფორმაციის დადასტურება',
    modalSubtitle: 'გადაამოწმეთ და საჭიროების შემთხვევაში შეასწორეთ მონაცემები',
    modalFullName: 'სახელი და გვარი',
    modalPhone: 'ტელეფონის ნომერი',
    modalContactMethod: 'საკონტაქტო არხი',
    modalContactHint: 'როგორ გსურთ დაგიკავშირდეთ?',
    modalWhatsapp: 'WhatsApp',
    modalTelegram: 'Telegram',
    modalViber: 'Viber',
    modalConfirm: 'ჯავშნის გაფორმება',
    modalCancel: 'გაუქმება',
    modalPhoneRequired: 'გთხოვთ შეიყვანოთ სწორი ტელეფონის ნომერი',
    modalNameRequired: 'გთხოვთ შეიყვანოთ სახელი და გვარი',
    // Success modal translations
    bookingSuccessTitle: 'ჯავშანი წარმატებით გაფორმდა! 🎉',
    bookingSuccessSubtitle: 'თქვენი ჯავშანი მიღებულია და მალე დაგიკავშირდებიან',
    people: 'ადამიანი',
    includedServices: 'დამატებითი სერვისები',
    notificationHint: 'შეტყობინება გამოგზავნილია თქვენს ანგარიშზე',
    backToHome: 'მთავარზე დაბრუნება',
    viewBookings: 'ჩემი ჯავშნები',
  },
  en: {
    cart: 'Cart',
    yourCart: 'Your Cart',
    empty: 'Your cart is empty',
    emptyDescription: 'Browse our pilots and companies, choose your preferred flight and add it to your cart.',
    browsePilots: 'Browse Pilots',
    browseCompanies: 'Browse Companies',
    pilot: 'Pilot',
    company: 'Company',
    location: 'Location',
    date: 'Date',
    time: 'Time',
    passengers: 'Passengers',
    passenger: 'Passenger',
    subtotal: 'Subtotal',
    discount: 'Discount',
    tax: 'VAT',
    total: 'Total',
    deposit: 'Online Payment (Deposit)',
    amountDue: 'Due On-site',
    checkout: 'Proceed to Checkout',
    continueShopping: 'Continue Shopping',
    remove: 'Remove',
    promoCode: 'Promo Code',
    applyCode: 'Apply',
    tandem: 'Tandem Flight',
    acrobatic: 'Acrobatic',
    training: 'Training',
    photo_video: 'Photo/Video',
    bookingSuccess: 'Bookings created successfully!',
    bookingError: 'Failed to create booking',
    bookingInProgress: 'Creating bookings...',
    loginRequired: 'Please fill in your name and phone number',
    missingInfo: 'Please select a date for all flights',
    // Modal translations
    modalTitle: 'Confirm Contact Information',
    modalSubtitle: 'Review and edit your details if needed',
    modalFullName: 'Full Name',
    modalPhone: 'Phone Number',
    modalContactMethod: 'Preferred Contact Method',
    modalContactHint: 'How would you like us to contact you?',
    modalWhatsapp: 'WhatsApp',
    modalTelegram: 'Telegram',
    modalViber: 'Viber',
    modalConfirm: 'Confirm Booking',
    modalCancel: 'Cancel',
    modalPhoneRequired: 'Please enter a valid phone number',
    modalNameRequired: 'Please enter your full name',
    // Success modal translations
    bookingSuccessTitle: 'Booking Confirmed! 🎉',
    bookingSuccessSubtitle: 'Your booking has been received. We will contact you soon.',
    people: 'people',
    includedServices: 'Additional Services',
    notificationHint: 'A notification has been sent to your account',
    backToHome: 'Back to Home',
    viewBookings: 'My Bookings',
  },
  ru: {
    cart: 'Корзина',
    yourCart: 'Ваша корзина',
    empty: 'Корзина пуста',
    emptyDescription: 'Просмотрите наших пилотов и компании, выберите понравившийся полёт и добавьте в корзину.',
    browsePilots: 'Пилоты',
    browseCompanies: 'Компании',
    pilot: 'Пилот',
    company: 'Компания',
    location: 'Локация',
    date: 'Дата',
    time: 'Время',
    passengers: 'Пассажиры',
    passenger: 'Пассажир',
    subtotal: 'Итого',
    discount: 'Скидка',
    tax: 'НДС',
    total: 'Всего',
    deposit: 'Онлайн оплата (депозит)',
    amountDue: 'К оплате на месте',
    checkout: 'Оформить заказ',
    continueShopping: 'Продолжить покупки',
    remove: 'Удалить',
    promoCode: 'Промокод',
    applyCode: 'Применить',
    tandem: 'Тандем полёт',
    acrobatic: 'Акробатика',
    training: 'Обучение',
    photo_video: 'Фото/Видео',
    bookingSuccess: 'Бронирования успешно созданы!',
    bookingError: 'Не удалось создать бронирование',
    bookingInProgress: 'Создание бронирований...',
    loginRequired: 'Пожалуйста, заполните имя и номер телефона',
    missingInfo: 'Пожалуйста, выберите дату для всех полётов',
    // Modal translations
    modalTitle: 'Подтверждение контактных данных',
    modalSubtitle: 'Проверьте и при необходимости отредактируйте данные',
    modalFullName: 'Полное имя',
    modalPhone: 'Номер телефона',
    modalContactMethod: 'Способ связи',
    modalContactHint: 'Как вам удобнее связаться?',
    modalWhatsapp: 'WhatsApp',
    modalTelegram: 'Telegram',
    modalViber: 'Viber',
    modalConfirm: 'Подтвердить бронирование',
    modalCancel: 'Отмена',
    modalPhoneRequired: 'Пожалуйста, введите корректный номер телефона',
    modalNameRequired: 'Пожалуйста, введите ваше полное имя',
    // Success modal translations
    bookingSuccessTitle: 'Бронирование подтверждено! 🎉',
    bookingSuccessSubtitle: 'Ваше бронирование получено. Мы скоро свяжемся с вами.',
    people: 'человек',
    includedServices: 'Дополнительные услуги',
    notificationHint: 'Уведомление отправлено на ваш аккаунт',
    backToHome: 'На главную',
    viewBookings: 'Мои бронирования',
  },
  ar: {
    cart: 'السلة',
    yourCart: 'سلتك',
    empty: 'السلة فارغة',
    emptyDescription: 'تصفح طيارينا وشركاتنا، اختر رحلتك المفضلة وأضفها إلى السلة.',
    browsePilots: 'تصفح الطيارين',
    browseCompanies: 'تصفح الشركات',
    pilot: 'طيار',
    company: 'شركة',
    location: 'الموقع',
    date: 'التاريخ',
    time: 'الوقت',
    passengers: 'المسافرون',
    passenger: 'مسافر',
    subtotal: 'المجموع الفرعي',
    discount: 'خصم',
    tax: 'ضريبة',
    total: 'المجموع',
    deposit: 'الدفع عبر الإنترنت (وديعة)',
    amountDue: 'المبلغ المستحق في الموقع',
    checkout: 'الدفع',
    continueShopping: 'متابعة التسوق',
    remove: 'إزالة',
    promoCode: 'رمز ترويجي',
    applyCode: 'تطبيق',
    tandem: 'رحلة ترادفية',
    acrobatic: 'بهلوانية',
    training: 'تدريب',
    photo_video: 'صور/فيديو',
    bookingSuccess: 'تم إنشاء الحجوزات بنجاح!',
    bookingError: 'فشل في إنشاء الحجز',
    bookingInProgress: 'جاري إنشاء الحجوزات...',
    loginRequired: 'يرجى ملء الاسم ورقم الهاتف',
    missingInfo: 'يرجى تحديد تاريخ لجميع الرحلات',
    // Modal translations
    modalTitle: 'تأكيد معلومات الاتصال',
    modalSubtitle: 'راجع وعدّل بياناتك إذا لزم الأمر',
    modalFullName: 'الاسم الكامل',
    modalPhone: 'رقم الهاتف',
    modalContactMethod: 'طريقة الاتصال المفضلة',
    modalContactHint: 'كيف تريد أن نتواصل معك؟',
    modalWhatsapp: 'واتساب',
    modalTelegram: 'تيليجرام',
    modalViber: 'فايبر',
    modalConfirm: 'تأكيد الحجز',
    modalCancel: 'إلغاء',
    modalPhoneRequired: 'يرجى إدخال رقم هاتف صحيح',
    modalNameRequired: 'يرجى إدخال اسمك الكامل',
    // Success modal translations
    bookingSuccessTitle: 'تم تأكيد الحجز! 🎉',
    bookingSuccessSubtitle: 'تم استلام حجزك. سنتواصل معك قريباً.',
    people: 'أشخاص',
    includedServices: 'الخدمات الإضافية',
    notificationHint: 'تم إرسال إشعار إلى حسابك',
    backToHome: 'العودة للرئيسية',
    viewBookings: 'حجوزاتي',
  },
  de: {
    cart: 'Warenkorb',
    yourCart: 'Ihr Warenkorb',
    empty: 'Warenkorb ist leer',
    emptyDescription: 'Durchsuchen Sie unsere Piloten und Unternehmen, wählen Sie Ihren bevorzugten Flug und fügen Sie ihn dem Warenkorb hinzu.',
    browsePilots: 'Piloten durchsuchen',
    browseCompanies: 'Unternehmen durchsuchen',
    pilot: 'Pilot',
    company: 'Unternehmen',
    location: 'Standort',
    date: 'Datum',
    time: 'Zeit',
    passengers: 'Passagiere',
    passenger: 'Passagier',
    subtotal: 'Zwischensumme',
    discount: 'Rabatt',
    tax: 'MwSt.',
    total: 'Gesamt',
    deposit: 'Online-Zahlung (Anzahlung)',
    amountDue: 'Vor Ort zu zahlen',
    checkout: 'Zur Kasse',
    continueShopping: 'Weiter einkaufen',
    remove: 'Entfernen',
    promoCode: 'Promo-Code',
    applyCode: 'Anwenden',
    tandem: 'Tandemflug',
    acrobatic: 'Akrobatik',
    training: 'Training',
    photo_video: 'Foto/Video',
    bookingSuccess: 'Buchungen erfolgreich erstellt!',
    bookingError: 'Buchung konnte nicht erstellt werden',
    bookingInProgress: 'Buchungen werden erstellt...',
    loginRequired: 'Bitte Namen und Telefonnummer eingeben',
    missingInfo: 'Bitte wählen Sie ein Datum für alle Flüge',
    // Modal translations
    modalTitle: 'Kontaktdaten bestätigen',
    modalSubtitle: 'Überprüfen und bearbeiten Sie bei Bedarf Ihre Daten',
    modalFullName: 'Vollständiger Name',
    modalPhone: 'Telefonnummer',
    modalContactMethod: 'Bevorzugte Kontaktmethode',
    modalContactHint: 'Wie möchten Sie kontaktiert werden?',
    modalWhatsapp: 'WhatsApp',
    modalTelegram: 'Telegram',
    modalViber: 'Viber',
    modalConfirm: 'Buchung bestätigen',
    modalCancel: 'Abbrechen',
    modalPhoneRequired: 'Bitte geben Sie eine gültige Telefonnummer ein',
    modalNameRequired: 'Bitte geben Sie Ihren vollständigen Namen ein',
    // Success modal translations
    bookingSuccessTitle: 'Buchung bestätigt! 🎉',
    bookingSuccessSubtitle: 'Ihre Buchung wurde empfangen. Wir werden uns bald bei Ihnen melden.',
    people: 'Personen',
    includedServices: 'Zusätzliche Dienstleistungen',
    notificationHint: 'Eine Benachrichtigung wurde an Ihr Konto gesendet',
    backToHome: 'Zurück zur Startseite',
    viewBookings: 'Meine Buchungen',
  },
  tr: {
    cart: 'Sepet',
    yourCart: 'Sepetiniz',
    empty: 'Sepetiniz boş',
    emptyDescription: 'Pilotlarımızı ve şirketlerimizi inceleyin, tercih ettiğiniz uçuşu seçin ve sepete ekleyin.',
    browsePilots: 'Pilotlara Göz At',
    browseCompanies: 'Şirketlere Göz At',
    pilot: 'Pilot',
    company: 'Şirket',
    location: 'Konum',
    date: 'Tarih',
    time: 'Saat',
    passengers: 'Yolcular',
    passenger: 'Yolcu',
    subtotal: 'Ara Toplam',
    discount: 'İndirim',
    tax: 'KDV',
    total: 'Toplam',
    deposit: 'Online Ödeme (Depozito)',
    amountDue: 'Yerinde Ödenecek',
    checkout: 'Ödemeye Geç',
    continueShopping: 'Alışverişe Devam',
    remove: 'Kaldır',
    promoCode: 'Promosyon Kodu',
    applyCode: 'Uygula',
    tandem: 'Tandem Uçuş',
    acrobatic: 'Akrobasi',
    training: 'Eğitim',
    photo_video: 'Fotoğraf/Video',
    bookingSuccess: 'Rezervasyonlar başarıyla oluşturuldu!',
    bookingError: 'Rezervasyon oluşturulamadı',
    bookingInProgress: 'Rezervasyonlar oluşturuluyor...',
    loginRequired: 'Lütfen isim ve telefon numaranızı girin',
    missingInfo: 'Lütfen tüm uçuşlar için tarih seçin',
    // Modal translations
    modalTitle: 'İletişim Bilgilerini Onayla',
    modalSubtitle: 'Bilgilerinizi kontrol edin ve gerekirse düzenleyin',
    modalFullName: 'Tam Ad',
    modalPhone: 'Telefon Numarası',
    modalContactMethod: 'Tercih Edilen İletişim Yöntemi',
    modalContactHint: 'Sizinle nasıl iletişime geçmemizi istersiniz?',
    modalWhatsapp: 'WhatsApp',
    modalTelegram: 'Telegram',
    modalViber: 'Viber',
    modalConfirm: 'Rezervasyonu Onayla',
    modalCancel: 'İptal',
    modalPhoneRequired: 'Lütfen geçerli bir telefon numarası girin',
    modalNameRequired: 'Lütfen tam adınızı girin',
    // Success modal translations
    bookingSuccessTitle: 'Rezervasyon Onaylandı! 🎉',
    bookingSuccessSubtitle: 'Rezervasyonunuz alındı. En kısa sürede sizinle iletişime geçeceğiz.',
    people: 'kişi',
    includedServices: 'Ek Hizmetler',
    notificationHint: 'Hesabınıza bir bildirim gönderildi',
    backToHome: 'Ana Sayfaya Dön',
    viewBookings: 'Rezervasyonlarım',
  },
};

export default function CartPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'ka';
  const t = translations[locale] || translations.ka;
  const { session } = useSupabase();
  
  const { items: cartItems, removeItem, updateQuantity, updateItem, updateItemServices, clearCart } = useCart();
  
  // Checkout state
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [completedBookings, setCompletedBookings] = useState<any[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userProfileData, setUserProfileData] = useState<{ fullName: string; phone: string }>({ fullName: '', phone: '' });
  
  // Customer info (for guest checkout)
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  // Store flight type options per location
  const [flightTypeOptionsMap, setFlightTypeOptionsMap] = useState<Record<string, FlightTypeOption[]>>({});

  // Fetch flight types for items in cart
  useEffect(() => {
    const fetchFlightTypes = async () => {
      const locationIds = [...new Set(
        cartItems
          .map(item => item.location?.id)
          .filter((id): id is string => typeof id === 'string' && id.length > 0)
      )];
      
      if (locationIds.length === 0) return;
      
      const supabase = createClient();
      
      for (const locationId of locationIds) {
        if (flightTypeOptionsMap[locationId]) continue; // Already fetched
        
        const { data } = await supabase
          .from('location_pages')
          .select('content')
          .eq('location_id', locationId)
          .single();
        
        if (data?.content) {
          const sharedFlightTypes = data.content.shared_flight_types || [];
          const localizedFlightTypes = data.content[locale]?.flight_types || data.content.ka?.flight_types || [];
          
          const options: FlightTypeOption[] = sharedFlightTypes.map((shared: any) => {
            const localized = localizedFlightTypes.find((ft: any) => ft.shared_id === shared.id);
            return {
              id: shared.id,
              name: localized?.name || shared.id,
              price: shared.price_gel || 0
            };
          });
          
          setFlightTypeOptionsMap(prev => ({ ...prev, [locationId]: options }));
        }
      }
    };
    
    fetchFlightTypes();
  }, [cartItems, locale]);

  // Fetch user profile data for logged-in users
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!session?.user) {
        setUserProfileData({ fullName: '', phone: '' });
        return;
      }
      
      const supabase = createClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', session.user.id)
        .single();
      
      if (profile) {
        setUserProfileData({
          fullName: profile.full_name || '',
          phone: profile.phone || '',
        });
      }
    };
    
    fetchUserProfile();
  }, [session]);

  const handleRemoveItem = (id: string) => {
    removeItem(id);
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    updateQuantity(id, quantity);
  };

  const handleChangeFlightType = (itemId: string, flightType: FlightTypeOption) => {
    updateItem(itemId, {
      type: flightType.id,
      name: flightType.name,
      price: flightType.price
    });
  };

  const handleDateChange = (itemId: string, date: string) => {
    updateItem(itemId, { date });
  };

  // Open confirmation modal instead of directly checking out
  const handleCheckout = () => {
    setCheckoutError(null);
    
    // Validate cart items have dates
    const itemsWithoutDate = cartItems.filter(item => !item.date);
    if (itemsWithoutDate.length > 0) {
      setCheckoutError(t.missingInfo);
      return;
    }
    
    // For logged-in users: show modal with profile data
    // For guests: show modal with empty/entered data
    setShowConfirmModal(true);
  };

  // Process booking after modal confirmation
  const processBooking = async (confirmedData: {
    fullName: string;
    phone: string;
    contactMethod: 'whatsapp' | 'telegram' | 'viber';
  }) => {
    setShowConfirmModal(false);
    setIsCheckingOut(true);
    
    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Use confirmed data from modal
      const fullName = confirmedData.fullName;
      const phone = confirmedData.phone;
      const contactMethod = confirmedData.contactMethod;
      
      // Create bookings for each cart item
      const bookingResults = [];
      
      for (const item of cartItems) {
        // Get country info for the location
        let countryId = '';
        let countryName = '';
        
        if (item.location?.id) {
          const { data: locationData } = await supabase
            .from('locations')
            .select('country_id, countries(name_ka, name_en)')
            .eq('id', item.location.id)
            .single();
          
          if (locationData) {
            countryId = locationData.country_id;
            const country = locationData.countries as any;
            countryName = locale === 'en' ? country?.name_en : country?.name_ka;
          }
        }
        
        // Calculate prices for this item
        const basePrice = item.price * item.quantity;
        const servicesTotal = (item.selectedServices || []).reduce(
          (sum, s) => sum + s.price * s.quantity, 0
        );
        const totalPrice = basePrice + servicesTotal;
        
        // Prepare additional services
        const additionalServicesData = (item.selectedServices || []).map(s => ({
          service_id: s.serviceId,
          name: s.name,
          price_gel: s.price,
          quantity: s.quantity,
        }));
        
        // Determine booking source and assignment
        // Normalize to valid enum values: 'pilot_direct', 'company_direct', 'platform_general'
        let bookingSource: 'pilot_direct' | 'company_direct' | 'platform_general' = 'platform_general';
        
        if (item.pilot?.id) {
          bookingSource = 'pilot_direct';
        } else if (item.company?.id || item.companyId) {
          bookingSource = 'company_direct';
        }
        
        const bookingData = {
          user_id: user?.id || null,
          full_name: fullName,
          phone: phone,
          country_id: countryId,
          country_name: countryName || '',
          location_id: item.location?.id || '',
          location_name: item.location?.name || '',
          flight_type_id: item.type,
          flight_type_name: item.name,
          selected_date: item.date || '',
          number_of_people: item.quantity,
          contact_method: contactMethod,
          promo_code: null,
          promo_discount: 0,
          special_requests: null,
          base_price: basePrice,
          services_total: servicesTotal,
          total_price: totalPrice,
          currency: 'GEL',
          status: 'pending',
          booking_source: bookingSource,
          pilot_id: item.pilot?.id || null,
          company_id: item.company?.id || item.companyId || null,
          additional_services: additionalServicesData.length > 0 ? additionalServicesData : null,
        };
        
        console.log('Creating booking for cart item:', bookingData);
        
        // Call Edge Function to create booking
        const { data, error } = await supabase.functions.invoke('create-booking', {
          body: bookingData
        });
        
        console.log('Edge Function response:', { data, error });
        
        if (error) {
          console.error('Booking error (supabase error):', error);
          // Get the actual error message from the response
          let errorMessage = error.message || t.bookingError;
          
          // Try to get more details from error context
          const errorContext = (error as any).context;
          if (errorContext) {
            try {
              const responseBody = await errorContext.json();
              console.error('Error response body:', JSON.stringify(responseBody, null, 2));
              errorMessage = responseBody?.error || errorMessage;
            } catch (parseError) {
              console.error('Could not parse error response:', parseError);
            }
          }
          
          // Also check if error has a direct response body
          if ((error as any).body) {
            console.error('Error body:', (error as any).body);
          }
          
          throw new Error(errorMessage);
        }
        
        if (!data?.success) {
          console.error('Booking error (data error):', data?.error);
          throw new Error(data?.error || t.bookingError);
        }
        
        bookingResults.push({
          ...data,
          itemDetails: item // Store the cart item details for display
        });
      }
      
      // Success! Store booking details and show success modal
      setCompletedBookings(bookingResults);
      setCheckoutSuccess(true);
      setShowSuccessModal(true);
      clearCart();
      
    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutError(error instanceof Error ? error.message : t.bookingError);
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Calculate summary
  // subtotal = sum of (price * quantity) for all items (flight price)
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // Additional services total (now from each item's selectedServices)
  const servicesTotal = cartItems.reduce((sum, item) => {
    const itemServicesTotal = (item.selectedServices || []).reduce((sSum, s) => sSum + s.price * s.quantity, 0);
    return sum + itemServicesTotal;
  }, 0);
  
  // Total passengers (quantity = number of people)
  const totalPassengers = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  // Discount from promo code (TODO: implement promo validation)
  const discount = 0;
  
  // Total flight price after discount (including services)
  const total = subtotal + servicesTotal - discount;
  
  // Commission: 50₾ per person (what we keep from flight price)
  const commissionBase = 50 * totalPassengers;
  
  // VAT 18% on commission (additional fee customer pays)
  const vat = commissionBase * 0.18;
  
  // Online payment (deposit) = commission + VAT + services
  const depositAmount = commissionBase + vat + servicesTotal;
  
  // Amount due on-site = flight price - commission (not including VAT or services)
  const amountDue = Math.max(0, subtotal - commissionBase);

  const summary: CartSummaryData = {
    subtotal,
    discount,
    tax: vat,
    taxRate: 18,
    total,
    depositAmount,
    depositPerPerson: 50,
    totalPassengers,
    amountDue,
  };

  return (
    <div className="min-h-screen py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumbs items={buildBreadcrumbs(locale as Locale, ['cart'])} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}`}
              className="p-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-[#4697D2]" />
                {t.yourCart}
              </h1>
              {cartItems.length > 0 && (
                <p className="text-sm text-foreground/60">
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                </p>
              )}
            </div>
          </div>

          {cartItems.length > 0 && (
            <Link
              href={`/${locale}/pilots`}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground bg-foreground/5 hover:bg-foreground/10 rounded-xl transition-colors"
            >
              {t.continueShopping}
            </Link>
          )}
        </div>

        {/* Content */}
        {cartItems.length === 0 ? (
          <EmptyCart translations={t} locale={locale} />
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {/* Customer Info Section (for guest checkout) */}
              {!session && (
                <div className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-4 lg:p-5">
                  <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#4697D2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {locale === 'ka' ? 'მომხმარებლის ინფორმაცია' : 
                     locale === 'ru' ? 'Информация о клиенте' : 
                     locale === 'ar' ? 'معلومات العميل' :
                     locale === 'de' ? 'Kundeninformationen' :
                     locale === 'tr' ? 'Müşteri Bilgileri' :
                     'Customer Information'}
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-foreground/60 mb-1.5 block">
                        {locale === 'ka' ? 'სახელი და გვარი' : 
                         locale === 'ru' ? 'Имя и фамилия' : 
                         locale === 'ar' ? 'الاسم الكامل' :
                         locale === 'de' ? 'Vollständiger Name' :
                         locale === 'tr' ? 'Ad Soyad' :
                         'Full Name'} *
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder={locale === 'ka' ? 'მაგ: გიორგი მაისურაძე' : 'John Doe'}
                        className="w-full px-4 py-2.5 rounded-xl bg-foreground/5 border border-foreground/10 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-[#4697D2] focus:ring-1 focus:ring-[#4697D2]/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-foreground/60 mb-1.5 block">
                        {locale === 'ka' ? 'ტელეფონი' : 
                         locale === 'ru' ? 'Телефон' : 
                         locale === 'ar' ? 'رقم الهاتف' :
                         locale === 'de' ? 'Telefon' :
                         locale === 'tr' ? 'Telefon' :
                         'Phone'} *
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+995 555 123 456"
                        className="w-full px-4 py-2.5 rounded-xl bg-foreground/5 border border-foreground/10 text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-[#4697D2] focus:ring-1 focus:ring-[#4697D2]/50 transition-colors"
                      />
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-foreground/50">
                    {locale === 'ka' ? 'ან შედით თქვენს ანგარიშში უფრო სწრაფი გადახდისთვის' : 
                     locale === 'ru' ? 'Или войдите в свой аккаунт для быстрой оплаты' : 
                     locale === 'ar' ? 'أو قم بتسجيل الدخول لدفع أسرع' :
                     locale === 'de' ? 'Oder melden Sie sich für schnellere Zahlung an' :
                     locale === 'tr' ? 'Veya daha hızlı ödeme için giriş yapın' :
                     'Or sign in for faster checkout'}
                    <Link href={`/${locale}/login`} className="ml-2 text-[#4697D2] hover:underline">
                      {locale === 'ka' ? 'შესვლა' : 
                       locale === 'ru' ? 'Войти' : 
                       locale === 'ar' ? 'تسجيل الدخول' :
                       locale === 'de' ? 'Anmelden' :
                       locale === 'tr' ? 'Giriş' :
                       'Sign in'}
                    </Link>
                  </p>
                </div>
              )}
              
              {cartItems.map(item => (
                <CartItem
                  key={item.id}
                  item={item}
                  onRemove={handleRemoveItem}
                  onUpdateQuantity={handleUpdateQuantity}
                  onChangeFlightType={handleChangeFlightType}
                  onDateChange={handleDateChange}
                  onServicesChange={updateItemServices}
                  flightTypeOptions={item.location?.id ? flightTypeOptionsMap[item.location.id] : undefined}
                  translations={t}
                  locale={locale}
                />
              ))}
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <CartSummary
                summary={summary}
                translations={t}
                cartItems={cartItems}
                onCheckout={handleCheckout}
                onRemoveService={(itemId, serviceId) => {
                  const item = cartItems.find(i => i.id === itemId);
                  if (item && item.selectedServices) {
                    const newServices = item.selectedServices.filter(s => s.serviceId !== serviceId);
                    updateItemServices(itemId, newServices);
                  }
                }}
                isCheckingOut={isCheckingOut}
                locale={locale}
              />
              
              {/* Checkout Error */}
              {checkoutError && (
                <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400">{checkoutError}</p>
                </div>
              )}
              
              {/* Success Message */}
              {checkoutSuccess && (
                <div className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-600 dark:text-green-400">{t.bookingSuccess}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Checkout Confirmation Modal */}
      <CheckoutConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={processBooking}
        initialData={{
          fullName: session?.user ? userProfileData.fullName : customerName,
          phone: session?.user ? userProfileData.phone : customerPhone,
        }}
        translations={{
          title: t.modalTitle,
          subtitle: t.modalSubtitle,
          fullNameLabel: t.modalFullName,
          phoneLabel: t.modalPhone,
          contactMethodLabel: t.modalContactMethod,
          contactMethodHint: t.modalContactHint,
          whatsapp: t.modalWhatsapp,
          telegram: t.modalTelegram,
          viber: t.modalViber,
          confirm: t.modalConfirm,
          cancel: t.modalCancel,
          phoneRequired: t.modalPhoneRequired,
          nameRequired: t.modalNameRequired,
        }}
        isLoading={isCheckingOut}
      />

      {/* Booking Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-lg w-full p-8 animate-in fade-in zoom-in duration-300">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
            </div>
            
            {/* Title */}
            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
              {t.bookingSuccessTitle || 'ჯავშანი წარმატებით გაფორმდა! 🎉'}
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
              {t.bookingSuccessSubtitle || 'თქვენი ჯავშანი მიღებულია და მალე დაგიკავშირდებიან'}
            </p>
            
            {/* Booking Summary */}
            {completedBookings.length > 0 && (
              <div className="space-y-3 mb-6">
                {completedBookings.map((booking, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {booking.itemDetails?.name || booking.itemDetails?.location?.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {booking.itemDetails?.location?.name && `📍 ${booking.itemDetails.location.name}`}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          📅 {new Date(booking.itemDetails?.date || booking.booking?.selected_date).toLocaleDateString('ka-GE')}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          👥 {booking.itemDetails?.quantity || booking.booking?.number_of_people} {t.people || 'ადამიანი'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          {(booking.itemDetails?.price * booking.itemDetails?.quantity + (booking.itemDetails?.servicesTotal || 0)).toFixed(2)} ₾
                        </p>
                      </div>
                    </div>
                    
                    {/* Services in booking */}
                    {booking.itemDetails?.selectedServices?.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-white/10">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {t.includedServices || 'დამატებითი სერვისები'}:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {booking.itemDetails.selectedServices.map((s: any, sIdx: number) => (
                            <span key={sIdx} className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                              {s.name} {s.quantity > 1 && `×${s.quantity}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Notification Hint */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl mb-6">
              <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
                🔔 {t.notificationHint || 'შეტყობინება გამოგზავნილია თქვენს ანგარიშზე'}
              </p>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push(`/${locale}`);
                }}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
              >
                {t.backToHome || 'მთავარზე დაბრუნება'}
              </button>
              {session?.user && (
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    router.push(`/${locale}/user/bookings`);
                  }}
                  className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors font-medium"
                >
                  {t.viewBookings || 'ჩემი ჯავშნები'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
