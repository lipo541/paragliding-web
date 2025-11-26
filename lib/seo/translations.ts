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
      ka: 'პარაგლაიდინგი საქართველოში - ტანდემ ფრენები',
      en: 'Paragliding in Georgia - Tandem Flights',
      ru: 'Параглайдинг в Грузии - Тандемные полеты',
      de: 'Gleitschirmfliegen in Georgien - Tandemflüge',
      tr: 'Gürcistan\'da Yamaç Paraşütü - Tandem Uçuşlar',
      ar: 'الطيران المظلي في جورجيا - رحلات ترادفية',
    },
    description: {
      ka: 'საქართველოში პარაგლაიდინგის საუკეთესო ადგილები. დაჯავშნე ტანდემ ფრენა გუდაურში, კაზბეგში და სხვა ლოკაციებზე.',
      en: 'Best paragliding locations in Georgia. Book tandem flights in Gudauri, Kazbegi and other stunning locations.',
      ru: 'Лучшие места для параглайдинга в Грузии. Забронируйте тандемный полет в Гудаури, Казбеги и других локациях.',
      de: 'Die besten Gleitschirmflug-Standorte in Georgien. Buchen Sie Tandemflüge in Gudauri, Kazbegi und anderen Orten.',
      tr: 'Gürcistan\'daki en iyi yamaç paraşütü lokasyonları. Gudauri, Kazbegi ve diğer muhteşem lokasyonlarda tandem uçuş rezervasyonu yapın.',
      ar: 'أفضل مواقع الطيران المظلي في جورجيا. احجز رحلات ترادفية في غودوري وكازبيغي ومواقع أخرى مذهلة.',
    },
  },

  // ჩვენ შესახებ
  about: {
    title: {
      ka: 'ჩვენ შესახებ',
      en: 'About Us',
      ru: 'О нас',
      de: 'Über uns',
      tr: 'Hakkımızda',
      ar: 'معلومات عنا',
    },
    description: {
      ka: 'გაიცანით Paragliding Georgia - საქართველოში პარაგლაიდინგის პროფესიონალური გუნდი',
      en: 'Meet Paragliding Georgia - Professional paragliding team in Georgia',
      ru: 'Познакомьтесь с Paragliding Georgia - Профессиональная команда параглайдинга в Грузии',
      de: 'Lernen Sie Paragliding Georgia kennen - Professionelles Gleitschirmteam in Georgien',
      tr: 'Paragliding Georgia ile tanışın - Gürcistan\'da profesyonel yamaç paraşütü ekibi',
      ar: 'تعرف على Paragliding Georgia - فريق الطيران المظلي المحترف في جورجيا',
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
      ka: 'დაგვიკავშირდით - Paragliding Georgia. ტანდემ ფრენის დაჯავშნა და კონსულტაცია',
      en: 'Contact Paragliding Georgia. Book tandem flights and get consultation',
      ru: 'Свяжитесь с Paragliding Georgia. Бронирование тандемных полетов и консультация',
      de: 'Kontaktieren Sie Paragliding Georgia. Tandemflüge buchen und Beratung erhalten',
      tr: 'Paragliding Georgia ile iletişime geçin. Tandem uçuş rezervasyonu ve danışmanlık',
      ar: 'اتصل بـ Paragliding Georgia. حجز رحلات ترادفية والحصول على استشارة',
    },
  },

  // აქციები
  promotions: {
    title: {
      ka: 'აქციები და შეთავაზებები',
      en: 'Promotions & Offers',
      ru: 'Акции и предложения',
      de: 'Angebote & Aktionen',
      tr: 'Promosyonlar ve Teklifler',
      ar: 'العروض والترويج',
    },
    description: {
      ka: 'პარაგლაიდინგის აქციები და სპეციალური შეთავაზებები საქართველოში',
      en: 'Paragliding promotions and special offers in Georgia',
      ru: 'Акции и специальные предложения на параглайдинг в Грузии',
      de: 'Gleitschirmflug-Angebote und Sonderaktionen in Georgien',
      tr: 'Gürcistan\'da yamaç paraşütü promosyonları ve özel teklifler',
      ar: 'عروض وخصومات خاصة على الطيران المظلي في جورجيا',
    },
  },

  // ლოკაციები (listing გვერდი)
  locations: {
    title: {
      ka: 'პარაგლაიდინგის ლოკაციები',
      en: 'Paragliding Locations',
      ru: 'Локации для параглайдинга',
      de: 'Gleitschirmflug-Standorte',
      tr: 'Yamaç Paraşütü Lokasyonları',
      ar: 'مواقع الطيران المظلي',
    },
    description: {
      ka: 'აღმოაჩინე საქართველოში პარაგლაიდინგის საუკეთესო ადგილები - გუდაური, კაზბეგი და სხვა',
      en: 'Discover the best paragliding spots in Georgia - Gudauri, Kazbegi and more',
      ru: 'Откройте лучшие места для параглайдинга в Грузии - Гудаури, Казбеги и другие',
      de: 'Entdecken Sie die besten Gleitschirmflug-Spots in Georgien - Gudauri, Kazbegi und mehr',
      tr: 'Gürcistan\'ın en iyi yamaç paraşütü noktalarını keşfedin - Gudauri, Kazbegi ve daha fazlası',
      ar: 'اكتشف أفضل مواقع الطيران المظلي في جورجيا - غودوري، كازبيغي والمزيد',
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
      ka: 'Paragliding Georgia-ს გამოყენების წესები და პირობები',
      en: 'Terms and conditions of using Paragliding Georgia',
      ru: 'Условия использования сервиса Paragliding Georgia',
      de: 'Nutzungsbedingungen von Paragliding Georgia',
      tr: 'Paragliding Georgia kullanım şartları ve koşulları',
      ar: 'شروط وأحكام استخدام Paragliding Georgia',
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
      ka: 'Paragliding Georgia-ს კონფიდენციალურობის პოლიტიკა და მონაცემთა დაცვა',
      en: 'Privacy policy and data protection of Paragliding Georgia',
      ru: 'Политика конфиденциальности и защита данных Paragliding Georgia',
      de: 'Datenschutzrichtlinie und Datenschutz von Paragliding Georgia',
      tr: 'Paragliding Georgia gizlilik politikası ve veri koruma',
      ar: 'سياسة الخصوصية وحماية البيانات لـ Paragliding Georgia',
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
      ka: 'შექმენით ახალი ანგარიში Paragliding Georgia-ზე',
      en: 'Create a new account on Paragliding Georgia',
      ru: 'Создайте новый аккаунт на Paragliding Georgia',
      de: 'Erstellen Sie ein neues Konto bei Paragliding Georgia',
      tr: 'Paragliding Georgia\'da yeni bir hesap oluşturun',
      ar: 'إنشاء حساب جديد على Paragliding Georgia',
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
