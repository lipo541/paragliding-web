'use client';

import { IoLocationOutline, IoMailOutline, IoCallOutline, IoTimeOutline } from 'react-icons/io5';
import { FaFacebook, FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';

interface ContactPageProps {
  locale: string;
}

export default function ContactPage({ locale }: ContactPageProps) {
  const t = {
    title: locale === 'ka' ? 'დაგვიკავშირდით' : locale === 'en' ? 'Contact Us' : locale === 'ru' ? 'Свяжитесь с нами' : locale === 'ar' ? 'اتصل بنا' : locale === 'de' ? 'Kontakt' : 'İletişim',
    subtitle: locale === 'ka' ? 'გაქვთ კითხვები? ჩვენ აქ ვართ დასახმარებლად' : locale === 'en' ? 'Have questions? We are here to help' : locale === 'ru' ? 'Есть вопросы? Мы здесь, чтобы помочь' : locale === 'ar' ? 'هل لديك أسئلة؟ نحن هنا للمساعدة' : locale === 'de' ? 'Haben Sie Fragen? Wir sind hier um zu helfen' : 'Sorularınız mı var? Yardım için buradayız',
    contactInfo: locale === 'ka' ? 'საკონტაქტო ინფორმაცია' : locale === 'en' ? 'Contact Information' : locale === 'ru' ? 'Контактная информация' : locale === 'ar' ? 'معلومات الاتصال' : locale === 'de' ? 'Kontaktinformationen' : 'İletişim Bilgileri',
    address: locale === 'ka' ? 'მისამართი' : locale === 'en' ? 'Address' : locale === 'ru' ? 'Адрес' : locale === 'ar' ? 'العنوان' : locale === 'de' ? 'Adresse' : 'Adres',
    addressValue: locale === 'ka' ? 'თბილისი, საქართველო' : locale === 'en' ? 'Tbilisi, Georgia' : locale === 'ru' ? 'Тбилиси, Грузия' : locale === 'ar' ? 'تبليسي، جورجيا' : locale === 'de' ? 'Tiflis, Georgien' : 'Tiflis, Gürcistan',
    email: locale === 'ka' ? 'ელ. ფოსტა' : locale === 'en' ? 'Email' : locale === 'ru' ? 'Email' : locale === 'ar' ? 'البريد الإلكتروني' : locale === 'de' ? 'E-Mail' : 'E-posta',
    phone: locale === 'ka' ? 'ტელეფონი' : locale === 'en' ? 'Phone' : locale === 'ru' ? 'Телефон' : locale === 'ar' ? 'الهاتف' : locale === 'de' ? 'Telefon' : 'Telefon',
    hours: locale === 'ka' ? 'სამუშაო საათები' : locale === 'en' ? 'Working Hours' : locale === 'ru' ? 'Рабочие часы' : locale === 'ar' ? 'ساعات العمل' : locale === 'de' ? 'Arbeitszeiten' : 'Çalışma Saatleri',
    hoursValue: locale === 'ka' ? 'ორშ-შაბ: 09:00 - 18:00' : locale === 'en' ? 'Mon-Sat: 09:00 - 18:00' : locale === 'ru' ? 'Пн-Сб: 09:00 - 18:00' : locale === 'ar' ? 'الإثنين-السبت: 09:00 - 18:00' : locale === 'de' ? 'Mo-Sa: 09:00 - 18:00' : 'Pzt-Cmt: 09:00 - 18:00',
    social: locale === 'ka' ? 'სოციალური ქსელები' : locale === 'en' ? 'Social Media' : locale === 'ru' ? 'Соцсети' : locale === 'ar' ? 'وسائل التواصل الاجتماعي' : locale === 'de' ? 'Soziale Medien' : 'Sosyal Medya',
  };

  const contactInfo = [
    { icon: IoLocationOutline, label: t.address, value: t.addressValue },
    { icon: IoMailOutline, label: t.email, value: 'info@paragliding.ge', link: 'mailto:info@paragliding.ge' },
    { icon: IoCallOutline, label: t.phone, value: '+995 555 123 456', link: 'tel:+995555123456' },
    { icon: IoTimeOutline, label: t.hours, value: t.hoursValue },
  ];

  const socialLinks = [
    { name: 'Facebook', href: 'https://facebook.com', icon: FaFacebook },
    { name: 'Instagram', href: 'https://instagram.com', icon: FaInstagram },
    { name: 'YouTube', href: 'https://youtube.com', icon: FaYoutube },
    { name: 'Twitter', href: 'https://twitter.com', icon: FaTwitter },
  ];

  return (
    <main className="min-h-screen bg-background pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            {t.title}
          </h1>
          <p className="text-sm text-foreground/60">
            {t.subtitle}
          </p>
        </div>

        {/* Contact Information */}
        <div className="mb-8">
          <div className="rounded-2xl bg-foreground/5 p-5">
            <h2 className="text-base font-semibold text-foreground mb-4">
              {t.contactInfo}
            </h2>
            <div className="space-y-3">
              {contactInfo.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-foreground/10 flex-shrink-0">
                      <Icon className="w-4 h-4 text-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground/60 mb-0.5">
                        {item.label}
                      </p>
                      {item.link ? (
                        <a
                          href={item.link}
                          className="text-sm text-foreground hover:text-foreground/70 transition-colors"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-sm text-foreground">{item.value}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="rounded-2xl bg-foreground/5 p-5">
          <h2 className="text-base font-semibold text-foreground mb-3">
            {t.social}
          </h2>
          <div className="flex gap-2">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-foreground/10 hover:bg-foreground/20 text-foreground transition-colors"
                  aria-label={social.name}
                >
                  <Icon className="w-4 h-4" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
