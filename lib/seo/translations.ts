/**
 * SEO Translations
 * =================
 * ცენტრალიზებული SEO თარგმანები ყველა სტატიკური გვერდისთვის
 */

import { type Locale } from './constants';

// ============================================
// 📝 Page SEO Data Type
// ============================================

export interface PageSEO {
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  ogTitle?: Record<Locale, string>;
  ogDescription?: Record<Locale, string>;
}

// ============================================
// 🏠 Static Pages SEO Translations
// ============================================

export const PAGE_SEO: Record<string, PageSEO> = {
  // მთავარი გვერდი
  home: {
    title: {
      ka: 'პარაპლანით ფრენა საქართველოში | გუდაური, ყაზბეგი',
      en: 'Paragliding Georgia | Gudauri & Kazbegi Flights',
      ru: 'Полёты на параплане Грузия | Гудаури, Казбеги',
      de: 'Gleitschirmfliegen Georgien | Gudauri & Kazbegi',
      tr: 'Yamaç Paraşütü Gürcistan | Gudauri & Kazbegi',
      ar: 'الطيران الشراعي جورجيا | غودوري وكازبيغي',
    },
    description: {
      ka: 'პარაპლანით ფრენა გუდაურში და ყაზბეგში ₾350-დან. ონლაინ ჯავშანი, გამოცდილი პილოტები, ვიდეო/ფოტო გადაღება. უსაფრთხო ფრენა კავკასიონის თავზე.',
      en: 'Paragliding in Gudauri & Kazbegi from $130. Online booking, experienced pilots, video/photo included. Safe flights over the Caucasus Mountains.',
      ru: 'Полёты на параплане в Гудаури и Казбеги от $130. Онлайн бронирование, опытные пилоты, видео/фото. Безопасные полёты над Кавказом.',
      de: 'Gleitschirmfliegen in Gudauri & Kazbegi ab 120€. Online-Buchung, erfahrene Piloten, Video/Foto inklusive. Sichere Flüge über den Kaukasus.',
      tr: 'Gudauri ve Kazbegi\'de yamaç paraşütü $130\'dan. Online rezervasyon, deneyimli pilotlar, video/fotoğraf dahil. Kafkaslar üzerinde güvenli uçuş.',
      ar: 'الطيران الشراعي في غودوري وكازبيغي من 130$. الحجز أونلاين، طيارون ذوو خبرة، فيديو/صور. رحلات آمنة فوق جبال القوقاز.',
    },
  },

  // ჩვენ შესახებ
  about: {
    title: {
      ka: 'ჩვენს შესახებ - პარაპლანით ფრენის პლატფორმა',
      en: 'About Us - Paragliding Platform Georgia',
      ru: 'О нас - Платформа параглайдинга Грузия',
      de: 'Über uns - Gleitschirm-Plattform Georgien',
      tr: 'Hakkımızda - Yamaç Paraşütü Platformu Gürcistan',
      ar: 'معلومات عنا - منصة الطيران المظلي جورجيا',
    },
    description: {
      ka: 'პარაპლანით ფრენის ციფრული პლატფორმა საქართველოში. ჯავშნები, პილოტები, კომპანიები - ყველაფერი ერთ სივრცეში.',
      en: 'Digital paragliding platform in Georgia. Bookings, pilots, companies - everything in one place. Tandem flights in Gudauri, Kazbegi.',
      ru: 'Цифровая платформа параглайдинга в Грузии. Бронирования, пилоты, компании - всё в одном месте. Тандемные полёты.',
      de: 'Digitale Gleitschirm-Plattform in Georgien. Buchungen, Piloten, Unternehmen - alles an einem Ort. Tandemflüge.',
      tr: 'Gürcistan\'da dijital yamaç paraşütü platformu. Rezervasyonlar, pilotlar, şirketler - tek bir yerde. Tandem uçuşlar.',
      ar: 'منصة رقمية للطيران المظلي في جورجيا. الحجوزات والطيارين والشركات - كل شيء في مكان واحد.',
    },
  },

  // კონტაქტი
  contact: {
    title: {
      ka: 'კონტაქტი',
      en: 'Contact Us',
      ru: 'Контакты',
      de: 'Kontakt',
      tr: 'İletişim',
      ar: 'اتصل بنا',
    },
    description: {
      ka: 'დაგვიკავშირდით - xparagliding.com. პარაპლანით ფრენის დაჯავშნა და კონსულტაცია',
      en: 'Contact xparagliding.com. Book paragliding flights and get consultation',
      ru: 'Свяжитесь с xparagliding.com. Бронирование полётов на параплане и консультация',
      de: 'Kontaktieren Sie xparagliding.com. Gleitschirmflüge buchen und Beratung erhalten',
      tr: 'xparagliding.com ile iletişime geçin. Yamaç paraşütü rezervasyonu ve danışmanlık',
      ar: 'اتصل بـ xparagliding.com. حجز رحلات الطيران الشراعي والحصول على استشارة',
    },
  },

  // აქციები
  promotions: {
    title: {
      ka: 'პარაპლანით ფრენა - ფასდაკლებები და აქციები',
      en: 'Paragliding Deals - Discounts & Promo Codes',
      ru: 'Скидки на полеты - Акции и промокоды',
      de: 'Gleitschirmfliegen Angebote - Rabatte & Gutscheine',
      tr: 'Yamaç Paraşütü Fırsatları - İndirimler ve Promosyonlar',
      ar: 'عروض الطيران الشراعي - خصومات وأكواد',
    },
    description: {
      ka: 'გამოიყენე პრომო კოდები პარაპლანით ფრენაზე გუდაურში, ყაზბეგსა და თბილისში. აქტიური ფასდაკლებები და სპეციალური შეთავაზებები საუკეთესო ფასად!',
      en: 'Use promo codes for paragliding flights in Georgia. Active discounts for Gudauri, Kazbegi and Tbilisi. Book your flight at the best price!',
      ru: 'Используйте промокоды на полёты на параплане в Грузии. Активные скидки на Гудаури, Казбеги и Тбилиси. Забронируйте по лучшей цене!',
      de: 'Nutzen Sie Gutscheincodes für Gleitschirmflüge in Georgien. Aktive Rabatte für Gudauri, Kazbegi und Tiflis. Buchen Sie zum besten Preis!',
      tr: 'Gürcistan\'da yamaç paraşütü uçuşlarında promosyon kodlarını kullanın. Gudauri, Tiflis ve Kazbegi için aktif indirimler. En iyi fiyatla rezervasyon yapın!',
      ar: 'استخدم أكواد الخصم لرحلات الطيران الشراعي في جورجيا. خصومات نشطة لغوداوري وكازبيغي وتبليسي. احجز بأفضل سعر!',
    },
  },

  // კომპანიები (listing გვერდი)
  companies: {
    title: {
      ka: 'პარაპლანით ფრენა - კომპანიები საქართველოში',
      en: 'Paragliding Companies in Georgia - Trusted Operators',
      ru: 'Компании параглайдинга в Грузии - Проверенные операторы',
      de: 'Gleitschirm-Unternehmen in Georgien - Zertifizierte Anbieter',
      tr: 'Gürcistan\'da Yamaç Paraşütü Şirketleri - Güvenilir Operatörler',
      ar: 'شركات الطيران الشراعي في جورجيا - مشغلون موثوقون',
    },
    description: {
      ka: 'იპოვე სანდო პარტნიორები პარაპლანით ფრენისთვის. სერტიფიცირებული კომპანიები გუდაურში, თბილისსა და საქართველოს რეგიონებში. შეადარე ფასები და დაჯავშნე!',
      en: 'Find certified paragliding operators across Georgia. Compare tandem flight companies in Gudauri, Tbilisi, Kazbegi and Batumi. Read reviews, check prices, and book with confidence.',
      ru: 'Выбирайте надежных операторов для полетов на параплане. Сертифицированные компании в Гудаури, Тбилиси и Казбеги. Сравните цены, читайте отзывы и бронируйте безопасный полет.',
      de: 'Finden Sie zertifizierte Gleitschirm-Anbieter in Georgien. Vergleichen Sie Tandemflug-Unternehmen in Gudauri, Tiflis und Batumi. Preise vergleichen, Bewertungen lesen, sicher buchen.',
      tr: 'Gürcistan\'daki sertifikalı yamaç paraşütü şirketlerini keşfedin. Batum, Tiflis ve Gudauri\'deki en iyi operatörleri karşılaştırın. Fiyatları inceleyin ve güvenle rezervasyon yapın.',
      ar: 'اعثر على أفضل شركات الطيران الشراعي المعتمدة في جورجيا. قارن بين المشغلين في غوداوري وتبليسي وباتومي. اقرأ التقييمات، تحقق من الأسعار، واحجز رحلتك بثقة.',
    },
  },

  // პილოტები (listing გვერდი)
  pilots: {
    title: {
      ka: 'პარაპლანის პილოტები საქართველოში - ინსტრუქტორები',
      en: 'Professional Paragliding Pilots in Georgia',
      ru: 'Профессиональные пилоты параглайдинга в Грузии',
      de: 'Professionelle Gleitschirmpiloten in Georgien',
      tr: 'Gürcistan\'da Profesyonel Yamaç Paraşütü Pilotları',
      ar: 'طيارون محترفون للطيران الشراعي في جورجيا',
    },
    description: {
      ka: 'გაიცანი გამოცდილი პარაპლანის ინსტრუქტორები ათასობით წარმატებული ფრენით. სერტიფიცირებული პილოტები გუდაურში, ყაზბეგსა და თბილისში. დაჯავშნე ფრენა!',
      en: 'Meet experienced tandem paragliding instructors with thousands of successful flights. Certified pilots across Gudauri, Kazbegi and Tbilisi. Choose your pilot and fly with confidence.',
      ru: 'Познакомьтесь с опытными тандем-инструкторами с тысячами успешных полетов. Сертифицированные пилоты в Гудаури, Казбеги и Тбилиси. Выберите своего пилота и летайте безопасно.',
      de: 'Lernen Sie erfahrene Tandempiloten mit tausenden erfolgreichen Flügen kennen. Zertifizierte Fluglehrer in Gudauri, Kazbegi und Tiflis. Wählen Sie Ihren Piloten und fliegen Sie sicher.',
      tr: 'Binlerce başarılı uçuşa sahip deneyimli tandem pilotlarıyla tanışın. Gudauri, Tiflis ve Batum\'da sertifikalı eğitmenler. Pilotunuzu seçin ve güvenle uçun.',
      ar: 'تعرف على مدربي الطيران الترادفي ذوي الخبرة مع آلاف الرحلات الناجحة. طيارون معتمدون في غوداوري وتبليسي وكازبيجي. اختر طيارك وحلق بأمان.',
    },
  },

  // ლოკაციები (listing გვერდი)
  locations: {
    title: {
      ka: 'პარაპლანით ფრენა საქართველოში - გუდაური, ყაზბეგი, თბილისი',
      en: 'Paragliding in Georgia - Fly Over the Caucasus Mountains',
      ru: 'Полеты на параплане в Грузии - Гудаури, Казбеги, Тбилиси',
      de: 'Gleitschirmfliegen in Georgien - Fluggebiete im Kaukasus',
      tr: 'Gürcistan\'da Yamaç Paraşütü - Batum, Tiflis, Gudauri',
      ar: 'الطيران الشراعي في جورجيا - أفضل الوجهات السياحية',
    },
    description: {
      ka: 'აირჩიე შენთვის სასურველი ლოკაცია და იფრინე პროფესიონალ პილოტებთან ერთად. გუდაურის მთები, ყაზბეგის ხეობები, თბილისის ზღვა - ადრენალინი და უსაფრთხოება გარანტირებულია.',
      en: 'Experience tandem paragliding at Georgia\'s most scenic locations. Soar above Gudauri\'s snow-capped peaks, Kazbegi\'s dramatic valleys, and Batumi\'s Black Sea coast. Professional pilots, stunning views, unforgettable memories.',
      ru: 'Откройте Грузию с высоты птичьего полета. Тандемные полеты над горнолыжными склонами Гудаури, древними храмами Казбеги и панорамами Тбилиси. Опытные инструкторы, полная безопасность, честные цены.',
      de: 'Entdecken Sie Georgiens atemberaubende Landschaften aus der Vogelperspektive. Tandemflüge über die Gipfel von Gudauri, die Täler von Kazbegi und die Küste von Batumi. Zertifizierte Piloten, höchste Sicherheitsstandards, unvergessliche Naturerlebnisse.',
      tr: 'Komşu Gürcistan\'da yamaç paraşütü keyfi sizi bekliyor. Batum sahillerinden Kafkas dağlarına uzanan muhteşem manzaralar. Deneyimli pilotlar, uygun fiyatlar, hafta sonu kaçamağı için ideal.',
      ar: 'اكتشف جمال جورجيا من السماء. رحلات طيران شراعي ترادفية فوق جبال القوقاز الخلابة ومدينة تبليسي التاريخية. طيارون محترفون، خدمة VIP، تجربة فاخرة تناسب العائلات والأصدقاء.',
    },
  },

  // წესები და პირობები
  terms: {
    title: {
      ka: 'წესები და პირობები',
      en: 'Terms & Conditions',
      ru: 'Условия использования',
      de: 'Nutzungsbedingungen',
      tr: 'Şartlar ve Koşullar',
      ar: 'الشروط والأحكام',
    },
    description: {
      ka: 'xparagliding.com-ის გამოყენების წესები და პირობები',
      en: 'Terms and conditions of using xparagliding.com',
      ru: 'Условия использования сервиса xparagliding.com',
      de: 'Nutzungsbedingungen von xparagliding.com',
      tr: 'xparagliding.com kullanım şartları ve koşulları',
      ar: 'شروط وأحكام استخدام xparagliding.com',
    },
  },

  // კონფიდენციალურობა
  privacy: {
    title: {
      ka: 'კონფიდენციალურობის პოლიტიკა',
      en: 'Privacy Policy',
      ru: 'Политика конфиденциальности',
      de: 'Datenschutzrichtlinie',
      tr: 'Gizlilik Politikası',
      ar: 'سياسة الخصوصية',
    },
    description: {
      ka: 'xparagliding.com-ის კონფიდენციალურობის პოლიტიკა და მონაცემთა დაცვა',
      en: 'Privacy policy and data protection of xparagliding.com',
      ru: 'Политика конфиденциальности и защита данных xparagliding.com',
      de: 'Datenschutzrichtlinie und Datenschutz von xparagliding.com',
      tr: 'xparagliding.com gizlilik politikası ve veri koruma',
      ar: 'سياسة الخصوصية وحماية البيانات لـ xparagliding.com',
    },
  },

  // შესვლა (noindex)
  login: {
    title: {
      ka: 'შესვლა',
      en: 'Login',
      ru: 'Вход',
      de: 'Anmelden',
      tr: 'Giriş',
      ar: 'تسجيل الدخول',
    },
    description: {
      ka: 'შედით თქვენს ანგარიშზე',
      en: 'Sign in to your account',
      ru: 'Войдите в свой аккаунт',
      de: 'Melden Sie sich bei Ihrem Konto an',
      tr: 'Hesabınıza giriş yapın',
      ar: 'تسجيل الدخول إلى حسابك',
    },
  },

  // რეგისტრაცია (noindex)
  register: {
    title: {
      ka: 'რეგისტრაცია',
      en: 'Register',
      ru: 'Регистрация',
      de: 'Registrieren',
      tr: 'Kayıt Ol',
      ar: 'التسجيل',
    },
    description: {
      ka: 'შექმენით ახალი ანგარიში xparagliding.com-ზე',
      en: 'Create a new account on xparagliding.com',
      ru: 'Создайте новый аккаунт на xparagliding.com',
      de: 'Erstellen Sie ein neues Konto bei xparagliding.com',
      tr: 'xparagliding.com\'da yeni bir hesap oluşturun',
      ar: 'إنشاء حساب جديد على xparagliding.com',
    },
  },

  // პროფილი (noindex)
  profile: {
    title: {
      ka: 'პროფილი',
      en: 'Profile',
      ru: 'Профиль',
      de: 'Profil',
      tr: 'Profil',
      ar: 'الملف الشخصي',
    },
    description: {
      ka: 'თქვენი პროფილის მართვა',
      en: 'Manage your profile',
      ru: 'Управление профилем',
      de: 'Profilverwaltung',
      tr: 'Profilinizi yönetin',
      ar: 'إدارة ملفك الشخصي',
    },
  },

  // ჯავშნები (noindex)
  bookings: {
    title: {
      ka: 'ჩემი ჯავშნები',
      en: 'My Bookings',
      ru: 'Мои бронирования',
      de: 'Meine Buchungen',
      tr: 'Rezervasyonlarım',
      ar: 'حجوزاتي',
    },
    description: {
      ka: 'თქვენი ჯავშნების მართვა',
      en: 'Manage your bookings',
      ru: 'Управление бронированиями',
      de: 'Buchungen verwalten',
      tr: 'Rezervasyonlarınızı yönetin',
      ar: 'إدارة حجوزاتك',
    },
  },

  // შეტყობინებები (noindex)
  notifications: {
    title: {
      ka: 'შეტყობინებები',
      en: 'Notifications',
      ru: 'Уведомления',
      de: 'Benachrichtigungen',
      tr: 'Bildirimler',
      ar: 'الإشعارات',
    },
    description: {
      ka: 'თქვენი შეტყობინებები',
      en: 'Your notifications',
      ru: 'Ваши уведомления',
      de: 'Ihre Benachrichtigungen',
      tr: 'Bildirimleriniz',
      ar: 'إشعاراتك',
    },
  },
};

// ============================================
// 🔧 Helper Functions
// ============================================

/**
 * იღებს გვერდის SEO მონაცემებს
 */
export function getPageSEO(page: string, locale: Locale): { title: string; description: string } {
  const seo = PAGE_SEO[page];
  
  if (!seo) {
    return {
      title: PAGE_SEO.home.title[locale] || PAGE_SEO.home.title.en,
      description: PAGE_SEO.home.description[locale] || PAGE_SEO.home.description.en,
    };
  }

  return {
    title: seo.title[locale] || seo.title.en,
    description: seo.description[locale] || seo.description.en,
  };
}

/**
 * იღებს OG მონაცემებს (თუ არ არის, იყენებს ძირითადს)
 */
export function getPageOG(page: string, locale: Locale): { title: string; description: string } {
  const seo = PAGE_SEO[page];
  
  if (!seo) {
    return getPageSEO('home', locale);
  }

  return {
    title: seo.ogTitle?.[locale] || seo.title[locale] || seo.title.en,
    description: seo.ogDescription?.[locale] || seo.description[locale] || seo.description.en,
  };
}
