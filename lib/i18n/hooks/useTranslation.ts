'use client';

import { usePathname } from 'next/navigation';
import type { Locale, Namespace, UseTranslationReturn, TranslationParams } from '../types';

// Import translations - we'll add more as we create them
import kaNavigation from '../locales/ka/navigation.json';
import enNavigation from '../locales/en/navigation.json';
import ruNavigation from '../locales/ru/navigation.json';
import arNavigation from '../locales/ar/navigation.json';
import deNavigation from '../locales/de/navigation.json';
import trNavigation from '../locales/tr/navigation.json';

import kaAuth from '../locales/ka/auth.json';
import enAuth from '../locales/en/auth.json';
import ruAuth from '../locales/ru/auth.json';
import arAuth from '../locales/ar/auth.json';
import deAuth from '../locales/de/auth.json';
import trAuth from '../locales/tr/auth.json';

import kaGloballocations from '../locales/ka/globallocations.json';
import enGloballocations from '../locales/en/globallocations.json';
import ruGloballocations from '../locales/ru/globallocations.json';
import arGloballocations from '../locales/ar/globallocations.json';
import deGloballocations from '../locales/de/globallocations.json';
import trGloballocations from '../locales/tr/globallocations.json';

import kaCountrypage from '../locales/ka/countrypage.json';
import enCountrypage from '../locales/en/countrypage.json';
import ruCountrypage from '../locales/ru/countrypage.json';
import arCountrypage from '../locales/ar/countrypage.json';
import deCountrypage from '../locales/de/countrypage.json';
import trCountrypage from '../locales/tr/countrypage.json';

import kaLocationinfocard from '../locales/ka/locationinfocard.json';
import enLocationinfocard from '../locales/en/locationinfocard.json';
import ruLocationinfocard from '../locales/ru/locationinfocard.json';
import arLocationinfocard from '../locales/ar/locationinfocard.json';
import deLocationinfocard from '../locales/de/locationinfocard.json';
import trLocationinfocard from '../locales/tr/locationinfocard.json';

import kaLocationpage from '../locales/ka/locationpage.json';
import enLocationpage from '../locales/en/locationpage.json';
import ruLocationpage from '../locales/ru/locationpage.json';
import arLocationpage from '../locales/ar/locationpage.json';
import deLocationpage from '../locales/de/locationpage.json';
import trLocationpage from '../locales/tr/locationpage.json';

import kaRating from '../locales/ka/rating.json';
import enRating from '../locales/en/rating.json';
import ruRating from '../locales/ru/rating.json';
import arRating from '../locales/ar/rating.json';
import deRating from '../locales/de/rating.json';
import trRating from '../locales/tr/rating.json';

import kaComments from '../locales/ka/comments.json';
import enComments from '../locales/en/comments.json';
import ruComments from '../locales/ru/comments.json';
import arComments from '../locales/ar/comments.json';
import deComments from '../locales/de/comments.json';
import trComments from '../locales/tr/comments.json';

import kaBookings from '../locales/ka/bookings.json';
import enBookings from '../locales/en/bookings.json';
import ruBookings from '../locales/ru/bookings.json';
import arBookings from '../locales/ar/bookings.json';
import deBookings from '../locales/de/bookings.json';
import trBookings from '../locales/tr/bookings.json';

import kaPromotionpage from '../locales/ka/promotionpage.json';
import enPromotionpage from '../locales/en/promotionpage.json';
import ruPromotionpage from '../locales/ru/promotionpage.json';
import arPromotionpage from '../locales/ar/promotionpage.json';
import dePromotionpage from '../locales/de/promotionpage.json';
import trPromotionpage from '../locales/tr/promotionpage.json';

import kaLogin from '../locales/ka/login.json';
import enLogin from '../locales/en/login.json';
import ruLogin from '../locales/ru/login.json';
import arLogin from '../locales/ar/login.json';
import deLogin from '../locales/de/login.json';
import trLogin from '../locales/tr/login.json';

import kaRegister from '../locales/ka/register.json';
import enRegister from '../locales/en/register.json';
import ruRegister from '../locales/ru/register.json';
import arRegister from '../locales/ar/register.json';
import deRegister from '../locales/de/register.json';
import trRegister from '../locales/tr/register.json';

import kaUserbottomnav from '../locales/ka/userbottomnav.json';
import enUserbottomnav from '../locales/en/userbottomnav.json';
import ruUserbottomnav from '../locales/ru/userbottomnav.json';
import arUserbottomnav from '../locales/ar/userbottomnav.json';
import deUserbottomnav from '../locales/de/userbottomnav.json';
import trUserbottomnav from '../locales/tr/userbottomnav.json';

import kaCompanybottomnav from '../locales/ka/companybottomnav.json';
import enCompanybottomnav from '../locales/en/companybottomnav.json';
import ruCompanybottomnav from '../locales/ru/companybottomnav.json';
import arCompanybottomnav from '../locales/ar/companybottomnav.json';
import deCompanybottomnav from '../locales/de/companybottomnav.json';
import trCompanybottomnav from '../locales/tr/companybottomnav.json';

import kaUsernotification from '../locales/ka/usernotification.json';
import enUsernotification from '../locales/en/usernotification.json';
import ruUsernotification from '../locales/ru/usernotification.json';
import arUsernotification from '../locales/ar/usernotification.json';
import deUsernotification from '../locales/de/usernotification.json';
import trUsernotification from '../locales/tr/usernotification.json';
import kaUserprofile from '../locales/ka/userprofile.json';
import enUserprofile from '../locales/en/userprofile.json';
import ruUserprofile from '../locales/ru/userprofile.json';
import arUserprofile from '../locales/ar/userprofile.json';
import deUserprofile from '../locales/de/userprofile.json';
import trUserprofile from '../locales/tr/userprofile.json';
import kaUserbookings from '../locales/ka/userbookings.json';
import enUserbookings from '../locales/en/userbookings.json';
import ruUserbookings from '../locales/ru/userbookings.json';
import arUserbookings from '../locales/ar/userbookings.json';
import deUserbookings from '../locales/de/userbookings.json';
import trUserbookings from '../locales/tr/userbookings.json';

import kaFooter from '../locales/ka/footer.json';
import enFooter from '../locales/en/footer.json';
import ruFooter from '../locales/ru/footer.json';
import arFooter from '../locales/ar/footer.json';
import deFooter from '../locales/de/footer.json';
import trFooter from '../locales/tr/footer.json';

import kaPilotprofile from '../locales/ka/pilotprofile.json';
import enPilotprofile from '../locales/en/pilotprofile.json';
import ruPilotprofile from '../locales/ru/pilotprofile.json';
import arPilotprofile from '../locales/ar/pilotprofile.json';
import dePilotprofile from '../locales/de/pilotprofile.json';
import trPilotprofile from '../locales/tr/pilotprofile.json';

import kaPilotbottomnav from '../locales/ka/pilotbottomnav.json';
import enPilotbottomnav from '../locales/en/pilotbottomnav.json';
import ruPilotbottomnav from '../locales/ru/pilotbottomnav.json';
import arPilotbottomnav from '../locales/ar/pilotbottomnav.json';
import dePilotbottomnav from '../locales/de/pilotbottomnav.json';
import trPilotbottomnav from '../locales/tr/pilotbottomnav.json';

import kaPilotdashboard from '../locales/ka/pilotdashboard.json';
import enPilotdashboard from '../locales/en/pilotdashboard.json';
import ruPilotdashboard from '../locales/ru/pilotdashboard.json';
import arPilotdashboard from '../locales/ar/pilotdashboard.json';
import dePilotdashboard from '../locales/de/pilotdashboard.json';
import trPilotdashboard from '../locales/tr/pilotdashboard.json';

import kaPilotbookings from '../locales/ka/pilotbookings.json';
import enPilotbookings from '../locales/en/pilotbookings.json';
import ruPilotbookings from '../locales/ru/pilotbookings.json';
import arPilotbookings from '../locales/ar/pilotbookings.json';
import dePilotbookings from '../locales/de/pilotbookings.json';
import trPilotbookings from '../locales/tr/pilotbookings.json';

import kaCompanies from '../locales/ka/companies.json';
import enCompanies from '../locales/en/companies.json';
import ruCompanies from '../locales/ru/companies.json';
import arCompanies from '../locales/ar/companies.json';
import deCompanies from '../locales/de/companies.json';
import trCompanies from '../locales/tr/companies.json';

import kaPilots from '../locales/ka/pilots.json';
import enPilots from '../locales/en/pilots.json';
import ruPilots from '../locales/ru/pilots.json';
import arPilots from '../locales/ar/pilots.json';
import dePilots from '../locales/de/pilots.json';
import trPilots from '../locales/tr/pilots.json';

import kaCompanyprofile from '../locales/ka/companyprofile.json';
import enCompanyprofile from '../locales/en/companyprofile.json';
import ruCompanyprofile from '../locales/ru/companyprofile.json';
import arCompanyprofile from '../locales/ar/companyprofile.json';
import deCompanyprofile from '../locales/de/companyprofile.json';
import trCompanyprofile from '../locales/tr/companyprofile.json';

const translations: Record<Locale, Partial<Record<Namespace, any>>> = {
  ka: {
    navigation: kaNavigation,
    auth: kaAuth,
    globallocations: kaGloballocations,
    countrypage: kaCountrypage,
    locationinfocard: kaLocationinfocard,
    locationpage: kaLocationpage,
    rating: kaRating,
    comments: kaComments,
    bookings: kaBookings,
    promotionpage: kaPromotionpage,
    login: kaLogin,
    register: kaRegister,
    userbottomnav: kaUserbottomnav,
    companybottomnav: kaCompanybottomnav,
    usernotification: kaUsernotification,
    userprofile: kaUserprofile,
    userbookings: kaUserbookings,
    footer: kaFooter,
    pilotprofile: kaPilotprofile,
    pilotbottomnav: kaPilotbottomnav,
    pilotdashboard: kaPilotdashboard,
    pilotbookings: kaPilotbookings,
    companies: kaCompanies,
    pilots: kaPilots,
    companyprofile: kaCompanyprofile,
  },
  en: {
    navigation: enNavigation,
    auth: enAuth,
    globallocations: enGloballocations,
    countrypage: enCountrypage,
    locationinfocard: enLocationinfocard,
    locationpage: enLocationpage,
    rating: enRating,
    comments: enComments,
    bookings: enBookings,
    promotionpage: enPromotionpage,
    login: enLogin,
    register: enRegister,
    userbottomnav: enUserbottomnav,
    companybottomnav: enCompanybottomnav,
    usernotification: enUsernotification,
    userprofile: enUserprofile,
    userbookings: enUserbookings,
    footer: enFooter,
    pilotprofile: enPilotprofile,
    pilotbottomnav: enPilotbottomnav,
    pilotdashboard: enPilotdashboard,
    pilotbookings: enPilotbookings,
    companies: enCompanies,
    pilots: enPilots,
    companyprofile: enCompanyprofile,
  },
  ru: {
    navigation: ruNavigation,
    auth: ruAuth,
    globallocations: ruGloballocations,
    countrypage: ruCountrypage,
    locationinfocard: ruLocationinfocard,
    locationpage: ruLocationpage,
    rating: ruRating,
    comments: ruComments,
    bookings: ruBookings,
    promotionpage: ruPromotionpage,
    login: ruLogin,
    register: ruRegister,
    userbottomnav: ruUserbottomnav,
    companybottomnav: ruCompanybottomnav,
    usernotification: ruUsernotification,
    userprofile: ruUserprofile,
    userbookings: ruUserbookings,
    footer: ruFooter,
    pilotprofile: ruPilotprofile,
    pilotbottomnav: ruPilotbottomnav,
    pilotdashboard: ruPilotdashboard,
    pilotbookings: ruPilotbookings,
    companies: ruCompanies,
    pilots: ruPilots,
    companyprofile: ruCompanyprofile,
  },
  ar: {
    navigation: arNavigation,
    auth: arAuth,
    globallocations: arGloballocations,
    countrypage: arCountrypage,
    locationinfocard: arLocationinfocard,
    locationpage: arLocationpage,
    rating: arRating,
    comments: arComments,
    bookings: arBookings,
    promotionpage: arPromotionpage,
    login: arLogin,
    register: arRegister,
    userbottomnav: arUserbottomnav,
    companybottomnav: arCompanybottomnav,
    usernotification: arUsernotification,
    userprofile: arUserprofile,
    userbookings: arUserbookings,
    footer: arFooter,
    pilotprofile: arPilotprofile,
    pilotbottomnav: arPilotbottomnav,
    pilotdashboard: arPilotdashboard,
    pilotbookings: arPilotbookings,
    companies: arCompanies,
    pilots: arPilots,
    companyprofile: arCompanyprofile,
  },
  de: {
    navigation: deNavigation,
    auth: deAuth,
    globallocations: deGloballocations,
    countrypage: deCountrypage,
    locationinfocard: deLocationinfocard,
    locationpage: deLocationpage,
    rating: deRating,
    comments: deComments,
    bookings: deBookings,
    promotionpage: dePromotionpage,
    login: deLogin,
    register: deRegister,
    userbottomnav: deUserbottomnav,
    companybottomnav: deCompanybottomnav,
    usernotification: deUsernotification,
    userprofile: deUserprofile,
    userbookings: deUserbookings,
    footer: deFooter,
    pilotprofile: dePilotprofile,
    pilotbottomnav: dePilotbottomnav,
    pilotdashboard: dePilotdashboard,
    pilotbookings: dePilotbookings,
    companies: deCompanies,
    pilots: dePilots,
    companyprofile: deCompanyprofile,
  },
  tr: {
    navigation: trNavigation,
    auth: trAuth,
    globallocations: trGloballocations,
    countrypage: trCountrypage,
    locationinfocard: trLocationinfocard,
    locationpage: trLocationpage,
    rating: trRating,
    comments: trComments,
    bookings: trBookings,
    promotionpage: trPromotionpage,
    login: trLogin,
    register: trRegister,
    userbottomnav: trUserbottomnav,
    companybottomnav: trCompanybottomnav,
    usernotification: trUsernotification,
    userprofile: trUserprofile,
    userbookings: trUserbookings,
    footer: trFooter,
    pilotprofile: trPilotprofile,
    pilotbottomnav: trPilotbottomnav,
    pilotdashboard: trPilotdashboard,
    pilotbookings: trPilotbookings,
    companies: trCompanies,
    pilots: trPilots,
    companyprofile: trCompanyprofile,
  },
};

export function useTranslation(namespace: Namespace): UseTranslationReturn {
  const pathname = usePathname();
  const locale = (pathname.split('/')[1] || 'ka') as Locale;

  const t = (key: string, params?: TranslationParams): string => {
    const keys = key.split('.');
    let value: any = translations[locale]?.[namespace];

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        console.warn(`Translation missing: ${locale}.${namespace}.${key}`);
        return key;
      }
    }

    // Simple interpolation for parameters like {count}, {name}, etc.
    if (params && typeof value === 'string') {
      return value.replace(/\{(\w+)\}/g, (_, param) => 
        String(params[param] ?? `{${param}}`)
      );
    }

    return value;
  };

  return { t, locale };
}
