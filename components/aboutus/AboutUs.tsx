'use client';

import { IoRocketOutline, IoGlobeOutline, IoCardOutline, IoLocationOutline } from 'react-icons/io5';

interface AboutUsProps {
  locale: string;
}

export default function AboutUs({ locale }: AboutUsProps) {
  const t = {
    title: locale === 'ka' ? 'ჩვენს შესახებ' : locale === 'en' ? 'About Us' : locale === 'ru' ? 'О нас' : locale === 'ar' ? 'معلومات عنا' : locale === 'de' ? 'Über uns' : 'Hakkımızda',
    subtitle: locale === 'ka' ? 'პარაგლაიდინგის ციფრული პლატფორმა საქართველოში' : locale === 'en' ? 'Digital Paragliding Platform in Georgia' : locale === 'ru' ? 'Цифровая платформа парапланеризма в Грузии' : locale === 'ar' ? 'منصة رقمية للطيران الشراعي في جورجيا' : locale === 'de' ? 'Digitale Gleitschirm-Plattform in Georgien' : 'Gürcistan\'da Dijital Paraşüt Platformu',
    
    description: {
      title: locale === 'ka' ? 'რას ვაკეთებთ' : locale === 'en' ? 'What We Do' : locale === 'ru' ? 'Что мы делаем' : locale === 'ar' ? 'ماذا نفعل' : locale === 'de' ? 'Was wir tun' : 'Ne Yapıyoruz',
      text: locale === 'ka' 
        ? 'ვქმნით ციფრულ პლატფორმას პარაგლაიდინგის ინდუსტრიისთვის საქართველოში. ჩვენი მიზანია მთელი სფეროს ციფრული ტრანსფორმაცია - ჯავშნებიდან დაწყებული, გლობალურ ინტეგრაციამდე.'
        : locale === 'en'
        ? 'We are building a digital platform for the paragliding industry in Georgia. Our goal is complete digital transformation of the sector - from bookings to global integration.'
        : locale === 'ru'
        ? 'Мы создаем цифровую платформу для индустрии парапланеризма в Грузии. Наша цель - полная цифровая трансформация сектора - от бронирований до глобальной интеграции.'
        : locale === 'ar'
        ? 'نحن نبني منصة رقمية لصناعة الطيران الشراعي في جورجيا. هدفنا هو التحول الرقمي الكامل للقطاع - من الحجوزات إلى التكامل العالمي.'
        : locale === 'de'
        ? 'Wir bauen eine digitale Plattform für die Gleitschirmindustrie in Georgien. Unser Ziel ist die vollständige digitale Transformation des Sektors - von Buchungen bis zur globalen Integration.'
        : 'Gürcistan\'daki paraşüt endüstrisi için dijital bir platform oluşturuyoruz. Amacımız sektörün tam dijital dönüşümü - rezervasyonlardan küresel entegrasyona.',
    },

    phases: {
      title: locale === 'ka' ? 'განვითარების ეტაპები' : locale === 'en' ? 'Development Phases' : locale === 'ru' ? 'Этапы развития' : locale === 'ar' ? 'مراحل التطوير' : locale === 'de' ? 'Entwicklungsphasen' : 'Geliştirme Aşamaları',
      
      phase1: {
        title: locale === 'ka' ? 'ფაზა 1 - ციფრული საფუძველი' : locale === 'en' ? 'Phase 1 - Digital Foundation' : locale === 'ru' ? 'Фаза 1 - Цифровая основа' : locale === 'ar' ? 'المرحلة 1 - الأساس الرقمي' : locale === 'de' ? 'Phase 1 - Digitale Grundlage' : 'Faz 1 - Dijital Temel',
        status: locale === 'ka' ? '✅ დასრულებულია' : locale === 'en' ? '✅ Completed' : locale === 'ru' ? '✅ Завершено' : locale === 'ar' ? '✅ مكتمل' : locale === 'de' ? '✅ Abgeschlossen' : '✅ Tamamlandı',
        description: locale === 'ka'
          ? 'შეიქმნა ციფრული ინფრასტრუქტურა - ვებსაიტი ლოკაციების ინფორმაციით, ონლაინ ჯავშნის სისტემა, მრავალენოვანი მხარდაჭერა (6 ენა), პრომო კოდების სისტემა და SuperAdmin პანელი კონტენტის მართვისთვის.'
          : locale === 'en'
          ? 'Digital infrastructure created - website with location information, online booking system, multilingual support (6 languages), promo code system, and SuperAdmin panel for content management.'
          : locale === 'ru'
          ? 'Создана цифровая инфраструктура - сайт с информацией о локациях, онлайн-система бронирования, многоязычная поддержка (6 языков), система промо-кодов и SuperAdmin панель для управления контентом.'
          : locale === 'ar'
          ? 'تم إنشاء البنية التحتية الرقمية - موقع ويب مع معلومات الموقع، نظام الحجز عبر الإنترنت، دعم متعدد اللغات (6 لغات)، نظام رمز الترويج ولوحة SuperAdmin لإدارة المحتوى.'
          : locale === 'de'
          ? 'Digitale Infrastruktur erstellt - Website mit Standortinformationen, Online-Buchungssystem, mehrsprachige Unterstützung (6 Sprachen), Promo-Code-System und SuperAdmin-Panel für Content-Management.'
          : 'Dijital altyapı oluşturuldu - konum bilgileri içeren web sitesi, çevrimiçi rezervasyon sistemi, çok dilli destek (6 dil), promosyon kodu sistemi ve içerik yönetimi için SuperAdmin paneli.',
      },

      phase2: {
        title: locale === 'ka' ? 'ფაზა 2 - ციფრული მართვა' : locale === 'en' ? 'Phase 2 - Digital Management' : locale === 'ru' ? 'Фაза 2 - Цифровое управление' : locale === 'ar' ? 'المرحلة 2 - الإدارة الرقمية' : locale === 'de' ? 'Phase 2 - Digitales Management' : 'Faz 2 - Dijital Yönetim',
        status: locale === 'ka' ? '🚧 მიმდინარე' : locale === 'en' ? '🚧 In Progress' : locale === 'ru' ? '🚧 В процессе' : locale === 'ar' ? '🚧 قيد التنفيذ' : locale === 'de' ? '🚧 In Arbeit' : '🚧 Devam Ediyor',
        description: locale === 'ka'
          ? 'სრული ციფრული ტრანსფორმაცია - პილოტების, კომპანიების და ოპერატორების ციფრული პროფილები, ავტომატიზირებული ჯავშნების მართვა, რეალურ დროში ხელმისაწვდომობის ტრექინგი, ანალიტიკა და რეპორტინგი. მთელი ინდუსტრია გადადის ციფრულ მართვაზე.'
          : locale === 'en'
          ? 'Complete digital transformation - digital profiles for pilots, companies and operators, automated booking management, real-time availability tracking, analytics and reporting. The entire industry transitions to digital management.'
          : locale === 'ru'
          ? 'Полная цифровая трансформация - цифровые профили пилотов, компаний и операторов, автоматизированное управление бронированиями, отслеживание доступности в реальном времени, аналитика и отчетность. Вся индустрия переходит на цифровое управление.'
          : locale === 'ar'
          ? 'التحول الرقمي الكامل - ملفات تعريف رقمية للطيارين والشركات والمشغلين، إدارة الحجز الآلي، تتبع التوفر في الوقت الفعلي، التحليلات وإعداد التقارير. تنتقل الصناعة بأكملها إلى الإدارة الرقمية.'
          : locale === 'de'
          ? 'Vollständige digitale Transformation - digitale Profile für Piloten, Unternehmen und Betreiber, automatisiertes Buchungsmanagement, Echtzeit-Verfügbarkeitsverfolgung, Analytik und Berichterstattung. Die gesamte Branche wechselt zur digitalen Verwaltung.'
          : 'Tam dijital dönüşüm - pilotlar, şirketler ve operatörler için dijital profiller, otomatik rezervasyon yönetimi, gerçek zamanlı müsaitlik takibi, analitik ve raporlama. Tüm endüstri dijital yönetime geçiyor.',
      },

      phase3: {
        title: locale === 'ka' ? 'ფაზა 3 - გლობალური ინტეგრაცია' : locale === 'en' ? 'Phase 3 - Global Integration' : locale === 'ru' ? 'Фაза 3 - Глобальная интеграция' : locale === 'ar' ? 'المرحلة 3 - التكامل العالمي' : locale === 'de' ? 'Phase 3 - Globale Integration' : 'Faz 3 - Küresel Entegrasyon',
        status: locale === 'ka' ? '📅 დაგეგმილი' : locale === 'en' ? '📅 Planned' : locale === 'ru' ? '📅 Запланировано' : locale === 'ar' ? '📅 مخطط' : locale === 'de' ? '📅 Geplant' : '📅 Planlandı',
        description: locale === 'ka'
          ? 'მსოფლიო ბაზარში ინტეგრაცია - საერთაშორისო გადახდის სისტემების დანერგვა, მთელი მსოფლიოს ლოკაციების ცენტრალიზებული ბაზა, გლობალური booking პლატფორმა. საქართველო გახდება მსოფლიო პარაგლაიდინგის რუკაზე წამყვანი ციფრული ჰაბი.'
          : locale === 'en'
          ? 'Integration into global market - implementation of international payment systems, centralized database of worldwide locations, global booking platform. Georgia becomes a leading digital hub on the world paragliding map.'
          : locale === 'ru'
          ? 'Интеграция в мировой рынок - внедрение международных платежных систем, централизованная база локаций по всему миру, глобальная платформа бронирования. Грузия становится ведущим цифровым хабом на мировой карте парапланеризма.'
          : locale === 'ar'
          ? 'التكامل في السوق العالمية - تنفيذ أنظمة الدفع الدولية، قاعدة بيانات مركزية للمواقع في جميع أنحاء العالم، منصة حجز عالمية. تصبح جورجيا مركزًا رقميًا رائدًا على خريطة الطيران الشراعي العالمية.'
          : locale === 'de'
          ? 'Integration in den globalen Markt - Implementierung internationaler Zahlungssysteme, zentralisierte Datenbank weltweiter Standorte, globale Buchungsplattform. Georgien wird ein führender digitaler Hub auf der Weltgleitschirmkarte.'
          : 'Küresel pazara entegrasyon - uluslararası ödeme sistemlerinin uygulanması, dünya çapındaki konumların merkezi veritabanı, küresel rezervasyon platformu. Gürcistan, dünya yamaç paraşütü haritasında önde gelen bir dijital merkez haline geliyor.',
      },
    },

    cta: {
      title: locale === 'ka' ? 'დაიწყე შენი თავგადასავალი' : locale === 'en' ? 'Start Your Adventure' : locale === 'ru' ? 'Начни своё приключение' : locale === 'ar' ? 'ابدأ مغامرتك' : locale === 'de' ? 'Starte dein Abenteuer' : 'Macerana Başla',
      button: locale === 'ka' ? 'იხილე ლოკაციები' : locale === 'en' ? 'View Locations' : locale === 'ru' ? 'Смотреть локации' : locale === 'ar' ? 'عرض المواقع' : locale === 'de' ? 'Standorte ansehen' : 'Konumları Görüntüle',
    },
  };

  return (
    <main className="min-h-screen pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.2)] dark:bg-[#4697D2]/30 mb-4">
            <IoRocketOutline className="w-7 h-7 text-[#4697D2]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a] dark:text-white mb-2">
            {t.title}
          </h1>
          <p className="text-sm text-[#1a1a1a]/60 dark:text-white/60 max-w-xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        {/* Description */}
        <div className="mb-8">
          <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 p-5 shadow-xl">
            <h2 className="text-base font-semibold text-[#1a1a1a] dark:text-white mb-2">
              {t.description.title}
            </h2>
            <p className="text-sm text-[#1a1a1a]/70 dark:text-white/70 leading-relaxed">
              {t.description.text}
            </p>
          </div>
        </div>

        {/* Development Phases */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-[#1a1a1a] dark:text-white mb-4 text-center">
            {t.phases.title}
          </h2>
          <div className="space-y-3">
            {/* Phase 1 */}
            <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 p-4 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#4697D2]/20 dark:bg-[#4697D2]/30 flex items-center justify-center">
                  <IoRocketOutline className="w-5 h-5 text-[#4697D2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h3 className="text-sm font-semibold text-[#1a1a1a] dark:text-white">
                      {t.phases.phase1.title}
                    </h3>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/20 text-green-600 dark:text-green-400">
                      {t.phases.phase1.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#1a1a1a]/70 dark:text-white/70 leading-relaxed">
                    {t.phases.phase1.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Phase 2 */}
            <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 p-4 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#4697D2]/20 dark:bg-[#4697D2]/30 flex items-center justify-center">
                  <IoGlobeOutline className="w-5 h-5 text-[#4697D2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h3 className="text-sm font-semibold text-[#1a1a1a] dark:text-white">
                      {t.phases.phase2.title}
                    </h3>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                      {t.phases.phase2.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#1a1a1a]/70 dark:text-white/70 leading-relaxed">
                    {t.phases.phase2.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Phase 3 */}
            <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 p-4 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#4697D2]/20 dark:bg-[#4697D2]/30 flex items-center justify-center">
                  <IoCardOutline className="w-5 h-5 text-[#4697D2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h3 className="text-sm font-semibold text-[#1a1a1a] dark:text-white">
                      {t.phases.phase3.title}
                    </h3>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#4697D2]/20 text-[#4697D2]">
                      {t.phases.phase3.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#1a1a1a]/70 dark:text-white/70 leading-relaxed">
                    {t.phases.phase3.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 p-6 text-center shadow-xl">
          <h2 className="text-lg font-bold text-[#1a1a1a] dark:text-white mb-3">
            {t.cta.title}
          </h2>
          <a
            href={`/${locale}/locations`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4697D2] text-white hover:bg-[#3a7bb0] font-semibold text-sm transition-all"
          >
            <IoLocationOutline className="w-4 h-4" />
            {t.cta.button}
          </a>
        </div>
      </div>
    </main>
  );
}
