'use client';

import { Users, Target, Plane, Globe, Heart, Award, TrendingUp, Shield } from 'lucide-react';

interface AboutUsProps {
  locale: string;
}

export default function AboutUs({ locale }: AboutUsProps) {
  const t = {
    title: locale === 'ka' ? 'ჩვენს შესახებ' : locale === 'en' ? 'About Us' : 'О нас',
    subtitle:
      locale === 'ka'
        ? 'პარაგლაიდინგის მსოფლიო საქართველოში - თქვენი თავგადასავალი იწყება აქ'
        : locale === 'en'
        ? 'The World of Paragliding in Georgia - Your Adventure Starts Here'
        : 'Мир парапланеризма в Грузии - Ваше приключение начинается здесь',
    
    mission: {
      title: locale === 'ka' ? 'ჩვენი მისია' : locale === 'en' ? 'Our Mission' : 'Наша миссия',
      description:
        locale === 'ka'
          ? 'ჩვენი მიზანია საქართველოში პარაგლაიდინგის განვითარება, პოპულარიზაცია და ხელმისაწვდომობის გაზრდა. ვქმნით ერთიან პლატფორმას, სადაც ყველას შეეძლება იპოვოს სრული ინფორმაცია ლოკაციების, ფასების, პილოტებისა და კომპანიების შესახებ.'
          : locale === 'en'
          ? 'Our goal is to develop, popularize and increase accessibility of paragliding in Georgia. We create a unified platform where everyone can find complete information about locations, prices, pilots and companies.'
          : 'Наша цель - развитие, популяризация и повышение доступности парапланеризма в Грузии. Мы создаем единую платформу, где каждый может найти полную информацию о локациях, ценах, пилотах и компаниях.',
    },

    vision: {
      title: locale === 'ka' ? 'ჩვენი ხედვა' : locale === 'en' ? 'Our Vision' : 'Наше видение',
      description:
        locale === 'ka'
          ? 'ვხედავთ საქართველოს როგორც პარაგლაიდინგის რეგიონულ ჰაბს, სადაც ადგილობრივი და საერთაშორისო ტურისტები აღმოაჩენენ უნიკალურ ლოკაციებს, უსაფრთხო პირობებს და პროფესიონალურ სერვისს. ჩვენი პლატფორმა იქნება #1 არჩევანი ყველასთვის, ვინც პარაგლაიდინგით დაინტერესებულია.'
          : locale === 'en'
          ? 'We envision Georgia as a regional paragliding hub where local and international tourists discover unique locations, safe conditions and professional service. Our platform will be the #1 choice for anyone interested in paragliding.'
          : 'Мы видим Грузию как региональный хаб парапланеризма, где местные и международные туристы открывают уникальные локации, безопасные условия и профессиональный сервис. Наша платформа станет выбором №1 для всех интересующихся парапланеризмом.',
    },

    values: [
      {
        icon: Shield,
        title: locale === 'ka' ? 'უსაფრთხოება' : locale === 'en' ? 'Safety' : 'Безопасность',
        description:
          locale === 'ka'
            ? 'პრიორიტეტი ნომერ 1 - მხოლოდ სერტიფიცირებული პილოტები და კომპანიები, სრული ინფორმაცია უსაფრთხოების ზომების შესახებ'
            : locale === 'en'
            ? 'Priority #1 - only certified pilots and companies, complete safety information'
            : 'Приоритет №1 - только сертифицированные пилоты и компании, полная информация о мерах безопасности',
      },
      {
        icon: Globe,
        title: locale === 'ka' ? 'ხელმისაწვდომობა' : locale === 'en' ? 'Accessibility' : 'Доступность',
        description:
          locale === 'ka'
            ? '6 ენაზე ხელმისაწვდომი პლატფორმა, მარტივი ჯავშნის სისტემა, გამჭვირვალე ფასები და პრომო-აქციები'
            : locale === 'en'
            ? 'Platform available in 6 languages, simple booking system, transparent prices and promotions'
            : 'Платформа на 6 языках, простая система бронирования, прозрачные цены и акции',
      },
      {
        icon: Heart,
        title: locale === 'ka' ? 'ხარისხი' : locale === 'en' ? 'Quality' : 'Качество',
        description:
          locale === 'ka'
            ? 'მაღალი ხარისხის სერვისი, რეიტინგები, რეალური მიმოხილვები მომხმარებლებისგან'
            : locale === 'en'
            ? 'High quality service, ratings, real reviews from users'
            : 'Высокое качество сервиса, рейтинги, реальные отзывы пользователей',
      },
      {
        icon: TrendingUp,
        title: locale === 'ka' ? 'განვითარება' : locale === 'en' ? 'Development' : 'Развитие',
        description:
          locale === 'ka'
            ? 'ტურიზმის განვითარება რეგიონებში, ახალი სამუშაო ადგილები, საერთაშორისო ვიზიბილობა'
            : locale === 'en'
            ? 'Tourism development in regions, new jobs, international visibility'
            : 'Развитие туризма в регионах, новые рабочие места, международная видимость',
      },
    ],

    features: [
      {
        title: locale === 'ka' ? 'ერთიანი პლატფორმა' : locale === 'en' ? 'Unified Platform' : 'Единая платформа',
        description:
          locale === 'ka'
            ? 'ყველა საჭირო ინფორმაცია ერთ ადგილას - ლოკაციები, პილოტები, კომპანიები, ფასები'
            : locale === 'en'
            ? 'All necessary information in one place - locations, pilots, companies, prices'
            : 'Вся необходимая информация в одном месте - локации, пилоты, компании, цены',
      },
      {
        title: locale === 'ka' ? 'სმარტ ჯავშანი' : locale === 'en' ? 'Smart Booking' : 'Умное бронирование',
        description:
          locale === 'ka'
            ? 'Backend ვალიდაცია, პრომო კოდები, გასტებისთვის და რეგისტრირებულებისთვის'
            : locale === 'en'
            ? 'Backend validation, promo codes, for guests and registered users'
            : 'Бэкенд валидация, промо-коды, для гостей и зарегистрированных',
      },
      {
        title: locale === 'ka' ? 'მრავალენოვანი' : locale === 'en' ? 'Multilingual' : 'Многоязычность',
        description:
          locale === 'ka'
            ? 'ქართული, ინგლისური, რუსული, არაბული, გერმანული, თურქული'
            : locale === 'en'
            ? 'Georgian, English, Russian, Arabic, German, Turkish'
            : 'Грузинский, английский, русский, арабский, немецкий, турецкий',
      },
      {
        title: locale === 'ka' ? 'CMS სისტემა' : locale === 'en' ? 'CMS System' : 'CMS система',
        description:
          locale === 'ka'
            ? 'სუპერადმინი ყველა კონტენტის მართვისთვის - ქვეყნები, ლოკაციები, პრომოები'
            : locale === 'en'
            ? 'Super admin for managing all content - countries, locations, promos'
            : 'Супер админ для управления контентом - страны, локации, промо',
      },
      {
        title: locale === 'ka' ? 'რეიტინგები' : locale === 'en' ? 'Ratings' : 'Рейтинги',
        description:
          locale === 'ka'
            ? '5-ვარსკვლავიანი რეიტინგი, კომენტარები, მოდერაცია'
            : locale === 'en'
            ? '5-star rating, comments, moderation'
            : '5-звездочный рейтинг, комментарии, модерация',
      },
      {
        title: locale === 'ka' ? 'მობილური' : locale === 'en' ? 'Mobile' : 'Мобильный',
        description:
          locale === 'ka'
            ? 'სრულად რესპონსიული დიზაინი ყველა მოწყობილობისთვის'
            : locale === 'en'
            ? 'Fully responsive design for all devices'
            : 'Полностью адаптивный дизайн для всех устройств',
      },
    ],

    roadmap: {
      title: locale === 'ka' ? 'ჩვენი გეგმები' : locale === 'en' ? 'Our Roadmap' : 'Наши планы',
      phases: [
        {
          phase: locale === 'ka' ? 'ფაზა 1 - MVP' : locale === 'en' ? 'Phase 1 - MVP' : 'Фаза 1 - MVP',
          status: locale === 'ka' ? '✅ დასრულებულია' : locale === 'en' ? '✅ Completed' : '✅ Завершено',
          items:
            locale === 'ka'
              ? ['ლოკაციების გვერდები', 'ჯავშნის სისტემა', 'პრომო კოდები', 'SuperAdmin პანელი']
              : locale === 'en'
              ? ['Location pages', 'Booking system', 'Promo codes', 'SuperAdmin panel']
              : ['Страницы локаций', 'Система бронирования', 'Промо-коды', 'SuperAdmin панель'],
        },
        {
          phase: locale === 'ka' ? 'ფაზა 2 - გაფართოება' : locale === 'en' ? 'Phase 2 - Expansion' : 'Фаза 2 - Расширение',
          status: locale === 'ka' ? '🚧 მიმდინარე' : locale === 'en' ? '🚧 In Progress' : '🚧 В процессе',
          items:
            locale === 'ka'
              ? ['პილოტების პროფილები', 'კომპანიების გვერდები', 'სწავლების სექცია', 'ტურები']
              : locale === 'en'
              ? ['Pilot profiles', 'Company pages', 'Training section', 'Tours']
              : ['Профили пилотов', 'Страницы компаний', 'Раздел обучения', 'Туры'],
        },
        {
          phase: locale === 'ka' ? 'ფაზა 3 - სკალირება' : locale === 'en' ? 'Phase 3 - Scaling' : 'Фаза 3 - Масштабирование',
          status: locale === 'ka' ? '📅 დაგეგმილი' : locale === 'en' ? '📅 Planned' : '📅 Запланировано',
          items:
            locale === 'ka'
              ? ['მობილური აპლიკაცია', 'AI რეკომენდაციები', 'ლაივ chat support', 'სოციალური ფუნქციები']
              : locale === 'en'
              ? ['Mobile app', 'AI recommendations', 'Live chat support', 'Social features']
              : ['Мобильное приложение', 'AI рекомендации', 'Живая поддержка', 'Социальные функции'],
        },
      ],
    },

    team: {
      title: locale === 'ka' ? 'გუნდი' : locale === 'en' ? 'Team' : 'Команда',
      description:
        locale === 'ka'
          ? 'პროფესიონალების გუნდი, რომელიც მუშაობს პარაგლაიდინგის ინდუსტრიის განვითარებაზე საქართველოში'
          : locale === 'en'
          ? 'Team of professionals working on paragliding industry development in Georgia'
          : 'Команда профессионалов, работающих над развитием парапланеризма в Грузии',
    },

    cta: {
      title:
        locale === 'ka'
          ? 'მზად ხარ პირველი ფრენისთვის?'
          : locale === 'en'
          ? 'Ready for Your First Flight?'
          : 'Готовы к первому полету?',
      description:
        locale === 'ka'
          ? 'აღმოაჩინე საქართველოს უნიკალური ლოკაციები და გამოსცადე პარაგლაიდინგის განუმეორებელი გამოცდილება'
          : locale === 'en'
          ? 'Discover unique locations in Georgia and experience unforgettable paragliding'
          : 'Откройте уникальные локации Грузии и испытайте незабываемый парапланеризм',
      button:
        locale === 'ka'
          ? 'დაათვალიერე ლოკაციები'
          : locale === 'en'
          ? 'Explore Locations'
          : 'Исследовать локации',
    },
  };

  return (
    <main className="min-h-screen bg-background pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center p-3 rounded-xl bg-foreground/5 border border-foreground/10 mb-6">
            <svg className="w-8 h-8 text-foreground" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L4 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-8-5z"/>
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">{t.title}</h1>
          <p className="text-lg text-foreground/70 max-w-3xl mx-auto">{t.subtitle}</p>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="p-6 rounded-xl bg-foreground/5 border border-foreground/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-foreground/10">
                <svg className="w-5 h-5 text-foreground" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-foreground">{t.mission.title}</h2>
            </div>
            <p className="text-foreground/70 leading-relaxed">{t.mission.description}</p>
          </div>

          <div className="p-6 rounded-xl bg-foreground/5 border border-foreground/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-foreground/10">
                <svg className="w-5 h-5 text-foreground" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-foreground">{t.vision.title}</h2>
            </div>
            <p className="text-foreground/70 leading-relaxed">{t.vision.description}</p>
          </div>
        </div>

        {/* Values */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-6 text-center">
            {locale === 'ka' ? 'ჩვენი ღირებულებები' : locale === 'en' ? 'Our Values' : 'Наши ценности'}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {t.values.map((value, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-foreground/5 border border-foreground/10 hover:bg-foreground/10 transition-colors"
              >
                <div className="p-2 rounded-lg bg-foreground/10 w-fit mb-3">
                  <value.icon className="w-5 h-5 text-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
                <p className="text-sm text-foreground/60 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-6 text-center">
            {locale === 'ka' ? 'ფუნქციონალი' : locale === 'en' ? 'Features' : 'Функционал'}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {t.features.map((feature, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-foreground/5 border border-foreground/10 hover:bg-foreground/10 transition-colors"
              >
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-foreground/60">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Roadmap */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-6 text-center">{t.roadmap.title}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {t.roadmap.phases.map((phase, idx) => (
              <div key={idx} className="p-6 rounded-xl bg-foreground/5 border border-foreground/10">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-foreground mb-2">{phase.phase}</h3>
                  <span className="text-sm font-medium">{phase.status}</span>
                </div>
                <ul className="space-y-2">
                  {phase.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/70">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="p-8 rounded-xl bg-foreground/5 border border-foreground/10 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-3">{t.cta.title}</h2>
          <p className="text-foreground/70 mb-6 max-w-2xl mx-auto">{t.cta.description}</p>
          <a
            href={`/${locale}/locations`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-foreground text-background hover:bg-foreground/90 font-semibold shadow-lg transition-all"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
            </svg>
            {t.cta.button}
          </a>
        </div>
      </div>
    </main>
  );
}
