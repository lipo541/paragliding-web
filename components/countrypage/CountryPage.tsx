'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Country {
  id: string;
  name_ka: string;
  name_en: string;
  name_ru: string;
  slug_ka: string;
  slug_en: string;
  slug_ru: string;
  og_image_url?: string;
  content?: any;
  created_at?: string;
  updated_at?: string;
}

interface Location {
  id: string;
  name_ka: string;
  name_en: string;
  name_ru: string;
  slug_ka: string;
  slug_en: string;
  slug_ru: string;
  country_id: string;
}

interface CountryPageProps {
  slug: string;
  locale: string;
}

export default function CountryPage({ slug, locale }: CountryPageProps) {
  const [country, setCountry] = useState<Country | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  
  const imagesPerPage = 9; // Desktop: 9 (3x3), Mobile: 8 (2x4)

  const getLocalizedField = (obj: any, field: string, locale: string) => {
    const suffix = locale || 'en';
    return obj?.[`${field}_${suffix}`] || obj?.[`${field}_en`] || '';
  };

  useEffect(() => {
    const fetchCountryData = async () => {
      setIsLoading(true);
      const supabase = createClient();

      try {
        const slugField = `slug_${locale}`;
        const { data: countryData, error: countryError } = await supabase
          .from('countries')
          .select('*')
          .eq(slugField, slug)
          .eq('is_active', true)
          .single();

        if (countryError) throw countryError;
        setCountry(countryData);

        const { data: locationsData, error: locationsError } = await supabase
          .from('locations')
          .select('*')
          .eq('country_id', countryData.id)
          .order('name_ka');

        if (locationsError) throw locationsError;
        setLocations(locationsData || []);
      } catch (error) {
        console.error('Error fetching country data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCountryData();
  }, [slug, locale]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-foreground"></div>
      </div>
    );
  }

  if (!country) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <h1 className="text-xl font-bold text-foreground/70">
          {locale === 'en' ? 'Country not found' : locale === 'ru' ? 'Страна не найдена' : 'ქვეყანა ვერ მოიძებნა'}
        </h1>
        <Link href={`/${locale}`} className="px-5 py-2 text-sm rounded-lg bg-foreground/10 hover:bg-foreground/20 transition-colors">
          {locale === 'en' ? 'Back to home' : locale === 'ru' ? 'На главную' : 'მთავარზე დაბრუნება'}
        </Link>
      </div>
    );
  }

  const countryName = getLocalizedField(country, 'name', locale);
  const heroImageUrl = country.content?.shared_images?.hero_image?.url || country.og_image_url || '/images/default-hero.jpg';
  const heroImageAlt = country.content?.shared_images?.hero_image?.[`alt_${locale}`] || countryName;
  
  const contentData = country.content?.[locale] || country.content?.en || {};
  const pTag = contentData.p_tag || '';
  const h1Tag = contentData.h1_tag || '';
  const h2History = contentData.h2_history || '';
  const historyText = contentData.history_text || '';
  const galleryDescription = contentData.gallery_description || '';
  const gallery = country.content?.shared_images?.gallery || [];
  const videos = country.content?.shared_videos || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Full Screen Hero - Behind Header with Parallax & Ken Burns Effect */}
      <div className="relative h-screen w-full overflow-hidden -mt-16 lg:-mt-20">
        {/* Animated Background Image */}
        <div 
          className="absolute inset-0"
          style={{
            animation: 'kenBurns 25s ease-in-out infinite'
          }}
        >
          <Image 
            src={heroImageUrl} 
            alt={heroImageAlt} 
            fill 
            priority 
            unoptimized 
            className="object-cover"
            style={{ transform: 'scale(1.1)' }}
            sizes="100vw" 
          />
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-background"></div>
        
        {/* Floating Particles Effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/30 rounded-full blur-sm"
            style={{ animation: 'floatSlow 15s ease-in-out infinite' }}
          ></div>
          <div 
            className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-white/20 rounded-full blur-sm"
            style={{ animation: 'floatMedium 12s ease-in-out infinite' }}
          ></div>
          <div 
            className="absolute top-2/3 left-1/2 w-1 h-1 bg-white/40 rounded-full blur-sm"
            style={{ animation: 'floatFast 9s ease-in-out infinite' }}
          ></div>
          <div 
            className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-white/25 rounded-full blur-sm"
            style={{ animation: 'floatSlow 15s ease-in-out infinite 5s' }}
          ></div>
          <div 
            className="absolute top-1/2 left-1/3 w-1.5 h-1.5 bg-white/30 rounded-full blur-sm"
            style={{ animation: 'floatMedium 12s ease-in-out infinite 3s' }}
          ></div>
        </div>
        
        {/* Add keyframes */}
        <style jsx>{`
          @keyframes kenBurns {
            0% {
              transform: scale(1) translate(0, 0);
            }
            50% {
              transform: scale(1.15) translate(-2%, -1%);
            }
            100% {
              transform: scale(1) translate(0, 0);
            }
          }

          @keyframes floatSlow {
            0%, 100% {
              transform: translateY(0) translateX(0);
              opacity: 0.3;
            }
            50% {
              transform: translateY(-100px) translateX(50px);
              opacity: 0.6;
            }
          }

          @keyframes floatMedium {
            0%, 100% {
              transform: translateY(0) translateX(0);
              opacity: 0.2;
            }
            50% {
              transform: translateY(-150px) translateX(-30px);
              opacity: 0.5;
            }
          }

          @keyframes floatFast {
            0%, 100% {
              transform: translateY(0) translateX(0);
              opacity: 0.4;
            }
            50% {
              transform: translateY(-80px) translateX(40px);
              opacity: 0.7;
            }
          }
        `}</style>
        
        <div className="absolute inset-0 flex items-start pt-48 lg:pt-64">
          <div className="w-full max-w-[1280px] mx-auto px-4">
            <h1 className="text-xl lg:text-3xl font-bold text-white mb-2 drop-shadow-2xl max-w-3xl">{h1Tag || countryName}</h1>
            {pTag && <p className="text-xs lg:text-sm text-white/90 max-w-2xl leading-relaxed drop-shadow-lg mb-6">{pTag}</p>}
            
            {/* CTA Buttons */}
            <div className="flex items-center gap-3 mt-4">
              <Link
                href={`/${locale}/contact`}
                className="group flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg hover:bg-white/20 hover:border-white/30 transition-all duration-300 text-xs lg:text-sm font-medium shadow-lg hover:shadow-xl"
              >
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{locale === 'en' ? 'Contact Us' : locale === 'ru' ? 'Связаться' : 'დაკავშირება'}</span>
              </Link>
              
              <Link
                href={`/${locale}/book-flight`}
                className="group flex items-center gap-2 px-5 py-2.5 bg-background backdrop-blur-sm border border-background/20 text-foreground rounded-lg hover:bg-background/90 hover:border-background/30 transition-all duration-300 text-xs lg:text-sm font-semibold shadow-lg hover:shadow-2xl hover:scale-[1.02]"
              >
                <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>{locale === 'en' ? 'Book a Flight' : locale === 'ru' ? 'Забронировать полёт' : 'დაჯავშნე ფრენა'}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Super Compact */}
      <div className="w-full max-w-[1280px] mx-auto px-4 py-5 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          
          {/* Main Column - 3/4 */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* History - Full Width, Rich HTML Support with Read More */}
            {h2History && historyText && (
              <article className="rounded-lg border border-foreground/10 bg-foreground/[0.02] overflow-hidden">
                {/* Header with Mobile Accordion and Desktop Read More */}
                <div className="w-full p-4 lg:p-5 flex items-start justify-between gap-3">
                  <button
                    onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                    className="flex items-start gap-2 flex-1 lg:pointer-events-none text-left"
                  >
                    <div className="p-1.5 rounded bg-foreground/10 flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h2 className="text-sm lg:text-lg font-bold text-foreground text-left">{h2History}</h2>
                  </button>
                  
                  {/* Mobile: Dropdown Arrow */}
                  <button
                    onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                    className="lg:hidden p-1"
                  >
                    <svg 
                      className={`w-5 h-5 text-foreground/60 transition-transform duration-300 ${isHistoryExpanded ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Desktop: Read More Button */}
                  <button
                    onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                    className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-foreground/20 bg-foreground/5 hover:bg-foreground/10 hover:border-foreground/30 transition-all text-[11px] font-medium text-foreground/70 hover:text-foreground whitespace-nowrap"
                  >
                    <span>
                      {isHistoryExpanded 
                        ? (locale === 'en' ? 'Less' : locale === 'ru' ? 'Меньше' : 'ნაკლები')
                        : (locale === 'en' ? 'Read More' : locale === 'ru' ? 'Читать' : 'მეტის ნახვა')
                      }
                    </span>
                    <svg 
                      className={`w-3.5 h-3.5 transition-transform duration-300 ${isHistoryExpanded ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                
                {/* Content with smooth expand/collapse */}
                <div className={`relative overflow-hidden transition-all duration-500 ease-in-out ${isHistoryExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0 lg:max-h-[280px] lg:opacity-100'}`}>
                  <div className="px-4 pb-4 lg:px-5 lg:pb-5">
                    <div 
                      className={`prose prose-sm max-w-none text-foreground/80 transition-all duration-500 ease-in-out break-words
                        [&>h2]:text-base [&>h2]:lg:text-lg [&>h2]:font-bold [&>h2]:text-foreground [&>h2]:mt-4 [&>h2]:mb-2 [&>h2]:break-words
                        [&>h3]:text-sm [&>h3]:lg:text-base [&>h3]:font-semibold [&>h3]:text-foreground [&>h3]:mt-3 [&>h3]:mb-2 [&>h3]:break-words
                        [&>p]:mb-2 [&>p]:text-xs [&>p]:lg:text-sm [&>p]:leading-relaxed [&>p]:break-words
                        [&>ul]:my-2 [&>ul]:space-y-1 [&>ul]:pl-5
                        [&>ol]:my-2 [&>ol]:space-y-1 [&>ol]:pl-5
                        [&>li]:text-xs [&>li]:lg:text-sm [&>li]:leading-relaxed [&>li]:break-words
                        [&>li>p]:mb-1
                        [&>hr]:my-4 [&>hr]:border-foreground/10
                        [&_strong]:font-semibold [&_strong]:text-foreground
                        [&_em]:italic
                        ${!isHistoryExpanded ? 'lg:max-h-[280px]' : 'lg:max-h-none'}`}
                      dangerouslySetInnerHTML={{ __html: historyText }}
                    />
                    
                    {/* Gradient overlay when collapsed - Desktop only */}
                    {!isHistoryExpanded && (
                      <div className="hidden lg:block absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-foreground/[0.02] to-transparent pointer-events-none"></div>
                    )}
                  </div>
                </div>
              </article>
            )}

            {/* Divider */}
            {gallery.length > 0 && (
              <div className="border-t border-foreground/10 my-6"></div>
            )}

            {/* Gallery - Masonry Layout with Pagination */}
            {gallery.length > 0 && (() => {
              const totalPages = Math.ceil(gallery.length / imagesPerPage);
              const startIndex = (currentPage - 1) * imagesPerPage;
              const endIndex = startIndex + imagesPerPage;
              const currentImages = gallery.slice(startIndex, endIndex);
              
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {locale === 'en' ? 'Photos' : locale === 'ru' ? 'Фото' : 'ფოტოები'}
                    </h3>
                    <span className="text-xs text-foreground/50 px-2 py-0.5 rounded bg-foreground/5">{gallery.length}</span>
                  </div>
                  
                  <div className="columns-2 lg:columns-3 gap-2">
                    {currentImages.map((image: any, index: number) => {
                      const globalIndex = startIndex + index;
                      return (
                        <div key={globalIndex} className="break-inside-avoid mb-2">
                          <button
                            onClick={() => setLightboxIndex(globalIndex)}
                            className="relative rounded-lg overflow-hidden border border-foreground/10 hover:border-foreground/20 hover:shadow-md transition-all group w-full cursor-pointer"
                          >
                            <Image
                              src={image.url}
                              alt={image[`alt_${locale}`] || `${globalIndex + 1}`}
                              width={600}
                              height={400}
                              unoptimized
                              className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 1024px) 50vw, 33vw"
                            />
                            {/* Zoom icon overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                              <div className="w-10 h-10 rounded-full bg-white/0 group-hover:bg-white/90 flex items-center justify-center transition-all scale-0 group-hover:scale-100">
                                <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                                </svg>
                              </div>
                            </div>
                            {image[`alt_${locale}`] && (
                              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-[10px] text-white">{image[`alt_${locale}`]}</p>
                              </div>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-md border border-foreground/20 bg-foreground/5 hover:bg-foreground/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-medium text-foreground"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1.5 rounded-md border transition-all text-xs font-medium ${
                            currentPage === page
                              ? 'bg-foreground text-background border-foreground'
                              : 'border-foreground/20 bg-foreground/5 hover:bg-foreground/10 text-foreground'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded-md border border-foreground/20 bg-foreground/5 hover:bg-foreground/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-medium text-foreground"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Lightbox Modal */}
            {lightboxIndex !== null && (
              <div 
                className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={() => setLightboxIndex(null)}
              >
                {/* Close button */}
                <button
                  onClick={() => setLightboxIndex(null)}
                  className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all group"
                >
                  <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Previous button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(prev => prev === null ? null : (prev - 1 + gallery.length) % gallery.length);
                  }}
                  className="absolute left-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all group"
                >
                  <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Next button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(prev => prev === null ? null : (prev + 1) % gallery.length);
                  }}
                  className="absolute right-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all group"
                >
                  <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Image */}
                <div className="relative max-w-7xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
                  <Image
                    src={gallery[lightboxIndex].url}
                    alt={gallery[lightboxIndex][`alt_${locale}`] || `${lightboxIndex + 1}`}
                    width={1920}
                    height={1080}
                    unoptimized
                    className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
                  />
                  
                  {/* Image info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg">
                    <p className="text-sm text-white font-medium">
                      {gallery[lightboxIndex][`alt_${locale}`] || `${locale === 'en' ? 'Photo' : locale === 'ru' ? 'Фото' : 'სურათი'} ${lightboxIndex + 1}`}
                    </p>
                    <p className="text-xs text-white/70 mt-1">
                      {lightboxIndex + 1} / {gallery.length}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Divider */}
            {videos.length > 0 && (
              <div className="border-t border-foreground/10 my-6"></div>
            )}

            {/* YouTube Videos Playlist - YouTube Style Layout */}
            {videos.length > 0 && (() => {
              // Extract YouTube video ID helper
              const getYouTubeID = (url: string) => {
                const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                const match = url.match(regExp);
                return (match && match[2].length === 11) ? match[2] : null;
              };

              const activeVideo = videos[activeVideoIndex];
              const activeVideoId = getYouTubeID(activeVideo);

              return (
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {locale === 'en' ? 'Videos' : locale === 'ru' ? 'Видео' : 'ვიდეოები'}
                    </h3>
                    <span className="text-xs text-foreground/50 px-2 py-0.5 rounded bg-foreground/5">{videos.length}</span>
                  </div>

                  {/* YouTube Style Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    
                    {/* Main Video Player - Left/Top */}
                    <div className="lg:col-span-2 space-y-2">
                      <div id="main-video-player" className="relative rounded-lg overflow-hidden border border-foreground/10 bg-black shadow-lg">
                        <div className="relative aspect-video">
                          <iframe
                            key={activeVideoIndex}
                            src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=0`}
                            title={`${locale === 'en' ? 'Video' : locale === 'ru' ? 'Видео' : 'ვიდეო'} ${activeVideoIndex + 1}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute inset-0 w-full h-full"
                          />
                        </div>
                      </div>
                      
                      {/* Active Video Info */}
                      <div className="flex items-center gap-2 px-1">
                        <div className="flex items-center gap-2 px-2 py-1 rounded bg-red-600/10 border border-red-600/20">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></div>
                          <span className="text-[10px] font-semibold text-red-600 uppercase tracking-wide">
                            {locale === 'en' ? 'Now Playing' : locale === 'ru' ? 'Играет' : 'მიმდინარე'}
                          </span>
                        </div>
                        <span className="text-xs text-foreground/60">
                          {activeVideoIndex + 1} / {videos.length}
                        </span>
                      </div>
                    </div>

                    {/* Playlist - Right/Bottom - Height matches main video */}
                    <div className="lg:col-span-1 lg:self-start">
                      <div className="rounded-lg border border-foreground/10 bg-foreground/[0.02] overflow-hidden max-h-[400px] lg:max-h-[360px] flex flex-col">
                        {/* Playlist Header */}
                        <div className="px-3 py-2 bg-foreground/5 border-b border-foreground/10 flex-shrink-0">
                          <h4 className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wide">
                            {locale === 'en' ? 'Playlist' : locale === 'ru' ? 'Плейлист' : 'პლეილისტი'}
                          </h4>
                        </div>
                        
                        {/* Playlist Items - Scrollable, fills remaining height */}
                        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-foreground/40 scrollbar-track-foreground/10 hover:scrollbar-thumb-foreground/60 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-foreground/5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-foreground/30 hover:[&::-webkit-scrollbar-thumb]:bg-foreground/50">
                          {videos.map((videoUrl: string, index: number) => {
                            const videoId = getYouTubeID(videoUrl);
                            if (!videoId) return null;

                            const isActive = index === activeVideoIndex;
                            const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

                            return (
                              <button
                                key={index}
                                onClick={() => setActiveVideoIndex(index)}
                                className={`w-full flex items-start gap-2 p-2 transition-all hover:bg-foreground/5 border-l-2 ${
                                  isActive 
                                    ? 'bg-foreground/10 border-l-red-600' 
                                    : 'border-l-transparent hover:border-l-foreground/20'
                                }`}
                              >
                                {/* Thumbnail */}
                                <div className="relative w-28 flex-shrink-0 rounded overflow-hidden border border-foreground/10 group-hover:border-foreground/20">
                                  <div className="relative aspect-video bg-black">
                                    <img 
                                      src={thumbnailUrl}
                                      alt={`Video ${index + 1}`}
                                      className="absolute inset-0 w-full h-full object-cover"
                                    />
                                    
                                    {/* Play overlay */}
                                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                                      isActive ? 'bg-black/50' : 'bg-black/30 group-hover:bg-black/40'
                                    }`}>
                                      {isActive ? (
                                        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-600 text-white">
                                          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                          </svg>
                                          <span className="text-[9px] font-bold">PLAYING</span>
                                        </div>
                                      ) : (
                                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M8 5v14l11-7z" />
                                        </svg>
                                      )}
                                    </div>
                                    
                                    {/* Video number badge */}
                                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm">
                                      <span className="text-[9px] text-white font-bold">{index + 1}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Video Info */}
                                <div className="flex-1 min-w-0 text-left">
                                  <p className={`text-[11px] leading-tight line-clamp-2 transition-colors ${
                                    isActive 
                                      ? 'text-foreground font-semibold' 
                                      : 'text-foreground/70 hover:text-foreground'
                                  }`}>
                                    {locale === 'en' ? 'Video' : locale === 'ru' ? 'Видео' : 'ვიდეო'} {index + 1}
                                  </p>
                                  {isActive && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <div className="w-1 h-1 rounded-full bg-red-600 animate-pulse"></div>
                                      <span className="text-[9px] text-red-600 font-semibold">
                                        {locale === 'en' ? 'Now' : locale === 'ru' ? 'Сейчас' : 'ახლა'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Contact via Messaging Apps */}
            <div className="overflow-hidden rounded-xl border border-foreground/10 bg-foreground/[0.02] shadow-sm">
              {/* Header with Icon */}
              <div className="px-4 py-3 border-b border-foreground/10 bg-gradient-to-r from-foreground/[0.03] to-transparent">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-foreground/10">
                    <svg className="w-4 h-4 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-foreground">
                    {locale === 'en' ? 'Contact & Information' : locale === 'ru' ? 'Контакт и информация' : 'კონტაქტი და ინფორმაცია'}
                  </h3>
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Info Text */}
                <div className="text-xs text-foreground/70 leading-relaxed space-y-2">
                  <p className="flex items-start gap-2">
                    <svg className="w-3.5 h-3.5 text-foreground/40 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>
                      {locale === 'en' 
                        ? 'Each location on our platform has unique flight prices, packages, and conditions.' 
                        : locale === 'ru' 
                        ? 'Каждая локация на нашей платформе имеет уникальные цены, пакеты и условия полетов.' 
                        : 'ჩვენს პლატფორმაზე განთავსებულ ყველა ლოკაციას აქვს განსხვავებული ფრენის ღირებულება, პაკეტები და პირობები.'}
                    </span>
                  </p>
                  <p className="pl-5">
                    {locale === 'en' 
                      ? 'Visit ' 
                      : locale === 'ru' 
                      ? 'Посетите ' 
                      : 'ეწვიეთ '}
                    <Link 
                      href={`/${locale}/locations`}
                      className="font-semibold text-foreground hover:text-foreground/80 underline decoration-foreground/30 hover:decoration-foreground/60 transition-colors inline-flex items-center gap-1"
                    >
                      {locale === 'en' ? 'Locations page' : locale === 'ru' ? 'страницу локаций' : 'ლოკაციების გვერდს'}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </Link>
                    {locale === 'en' 
                      ? ' for detailed information, or contact us directly:' 
                      : locale === 'ru' 
                      ? ' для подробной информации или свяжитесь с нами напрямую:' 
                      : ', სადაც ყველა ლოკაცია დეტალურადაა განხილული, ან დაგვიკავშირდით პირდაპირ:'}
                  </p>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-foreground/10"></div>
                  <span className="text-[10px] font-semibold text-foreground/40 uppercase tracking-wider">
                    {locale === 'en' ? 'Messengers' : locale === 'ru' ? 'Мессенджеры' : 'მესენჯერები'}
                  </span>
                  <div className="h-px flex-1 bg-foreground/10"></div>
                </div>

                {/* Messaging Apps */}
                <div className="flex items-center justify-center gap-3">
                  {/* WhatsApp */}
                  <a
                    href="https://wa.me/your-number"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex items-center justify-center w-10 h-10 rounded-lg bg-[#25D366]/10 dark:bg-[#25D366]/20 border border-[#25D366]/20 dark:border-[#25D366]/30 hover:bg-[#25D366]/20 dark:hover:bg-[#25D366]/30 hover:border-[#25D366]/40 transition-all hover:scale-110 active:scale-95"
                    title="WhatsApp"
                  >
                    <svg className="w-5 h-5 text-[#25D366] dark:text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </a>

                  {/* Viber */}
                  <a
                    href="viber://chat?number=your-number"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex items-center justify-center w-10 h-10 rounded-lg bg-[#7360F2]/10 dark:bg-[#7360F2]/20 border border-[#7360F2]/20 dark:border-[#7360F2]/30 hover:bg-[#7360F2]/20 dark:hover:bg-[#7360F2]/30 hover:border-[#7360F2]/40 transition-all hover:scale-110 active:scale-95"
                    title="Viber"
                  >
                    <svg className="w-5 h-5 text-[#7360F2] dark:text-[#7360F2]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.4 0C9.473.028 5.333.344 2.746 2.699 1.497 3.814.704 5.316.088 7.113c-.614 1.798-.634 3.635-.647 5.522-.013 1.887.014 3.774.497 5.622.44 1.684 1.369 3.075 2.674 4.086.515.4 1.042.627 1.638.795.649.184 1.306.199 1.964.199h.005c.582 0 1.13-.019 1.665-.058 1.018-.074 1.897-.309 2.71-.664 3.155-1.382 5.28-4.254 6.197-7.383.684-2.334.851-4.79.493-7.234-.401-2.741-1.516-5.03-3.314-6.803C13.513.515 12.227.144 11.4 0zm.6 1.988c.682.124 1.697.464 2.813 1.746 1.465 1.685 2.434 3.693 2.787 5.912.29 1.824.189 3.694-.389 5.484-.837 2.593-2.549 4.977-5.096 6.021-.652.268-1.35.452-2.145.511-.504.037-1.016.055-1.554.055-2.175 0-3.682-.454-4.479-1.351-1.147-.952-1.922-2.16-2.298-3.587-.414-1.57-.414-3.178-.401-4.784.013-1.605.03-3.21.557-4.752.485-1.421 1.158-2.612 2.115-3.453 2.034-1.787 5.426-2.031 7.09-1.802zM8.08 6.576c-.206.033-.4.162-.54.35-.206.28-.474.96-.474.96s-.224.473-.224 1.126v.656c0 .653.224 1.126.224 1.126.06.12.134.224.22.318.52.573 1.22.764 1.957.764h.658c.734 0 1.434-.19 1.955-.764.086-.094.16-.199.22-.318 0 0 .224-.473.224-1.126v-.656c0-.653-.224-1.126-.224-1.126-.14-.188-.334-.317-.54-.35-.43-.07-1.083-.15-1.634-.15-.55 0-1.204.08-1.634.15zm3.49 2.395c.083 0 .15.068.15.15v.5c0 .083-.067.15-.15.15h-.5c-.082 0-.15-.067-.15-.15v-.5c0-.082.068-.15.15-.15zm-3.14 0c.083 0 .15.068.15.15v.5c0 .083-.067.15-.15.15h-.5c-.082 0-.15-.067-.15-.15v-.5c0-.082.068-.15.15-.15zm1.57 1.91c.7 0 1.27.57 1.27 1.27 0 .7-.57 1.27-1.27 1.27-.7 0-1.27-.57-1.27-1.27 0-.7.57-1.27 1.27-1.27z"/>
                    </svg>
                  </a>

                  {/* Telegram */}
                  <a
                    href="https://t.me/your-username"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex items-center justify-center w-10 h-10 rounded-lg bg-[#229ED9]/10 dark:bg-[#229ED9]/20 border border-[#229ED9]/20 dark:border-[#229ED9]/30 hover:bg-[#229ED9]/20 dark:hover:bg-[#229ED9]/30 hover:border-[#229ED9]/40 transition-all hover:scale-110 active:scale-95"
                    title="Telegram"
                  >
                    <svg className="w-5 h-5 text-[#229ED9] dark:text-[#229ED9]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Additional Dynamic Content */}
            {Object.entries(contentData).map(([key, value]) => {
              if (['p_tag', 'h1_tag', 'h2_history', 'history_text', 'gallery_description'].includes(key) || !value) return null;
              if (typeof value !== 'string' || value.length === 0) return null;
              
              return (
                <div key={key} className="p-4 rounded-lg border border-foreground/10 bg-foreground/[0.02]">
                  <h3 className="text-sm font-semibold text-foreground mb-2 capitalize flex items-center gap-1.5">
                    <span className="w-0.5 h-4 bg-foreground/30 rounded-full"></span>
                    {key.replace(/_/g, ' ')}
                  </h3>
                  <div 
                    className="prose prose-sm max-w-none text-foreground/80
                      [&>p]:mb-1.5 [&>p]:text-xs [&>p]:leading-relaxed
                      [&_strong]:font-semibold [&_strong]:text-foreground"
                    dangerouslySetInnerHTML={{ __html: value }}
                  />
                </div>
              );
            })}
          </div>

          {/* Sidebar - 1/4 */}
          <aside className="lg:col-span-1">
            <div className="sticky top-16 pt-2 space-y-3">
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                {locations.length > 0 && (
                  <div className="p-3 rounded-lg border border-foreground/10 bg-foreground/[0.02] hover:border-foreground/20 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-foreground/10">
                        <svg className="w-3.5 h-3.5 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[10px] text-foreground/60 font-medium">
                          {locale === 'en' ? 'Locations' : locale === 'ru' ? 'Локации' : 'ლოკაციები'}
                        </p>
                        <p className="text-sm font-bold text-foreground">{locations.length}</p>
                      </div>
                    </div>
                  </div>
                )}
                {gallery.length > 0 && (
                  <div className="p-3 rounded-lg border border-foreground/10 bg-foreground/[0.02] hover:border-foreground/20 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-foreground/10">
                        <svg className="w-3.5 h-3.5 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[10px] text-foreground/60 font-medium">
                          {locale === 'en' ? 'Photos' : locale === 'ru' ? 'Фото' : 'ფოტოები'}
                        </p>
                        <p className="text-sm font-bold text-foreground">{gallery.length}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Locations List */}
              {locations.length > 0 && (
                <div className="p-4 rounded-lg border border-foreground/10 bg-foreground/[0.02]">
                  <h3 className="text-xs font-semibold text-foreground/60 mb-3 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {locale === 'en' ? 'Flying Spots' : locale === 'ru' ? 'Места' : 'ლოკაციები'}
                  </h3>
                  <div className="space-y-1.5">
                    {locations.map((location) => (
                      <Link
                        key={location.id}
                        href={`/${locale}/locations/${slug}/${getLocalizedField(location, 'slug', locale)}`}
                        className="group block p-2 rounded-md border border-foreground/5 hover:border-foreground/20 hover:bg-foreground/[0.03] transition-all"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <svg className="w-3 h-3 text-foreground/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-xs font-medium text-foreground group-hover:text-foreground/70 transition-colors truncate">
                              {getLocalizedField(location, 'name', locale)}
                            </span>
                          </div>
                          <svg className="w-3 h-3 text-foreground/20 group-hover:text-foreground/40 group-hover:translate-x-0.5 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Booking CTA */}
              <div className="rounded-xl border-2 border-foreground/10 bg-foreground/[0.02] overflow-hidden shadow-lg">
                {/* Header */}
                <div className="bg-foreground text-background px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-background/20 backdrop-blur-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-wide">
                      {locale === 'en' ? 'Book a Flight' : locale === 'ru' ? 'Забронировать' : 'დაჯავშნე ფრენა'}
                    </h3>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                  {/* Icon & Text */}
                  <div className="text-center space-y-3">
                    <div className="flex justify-center">
                      <div className="p-3 rounded-full bg-foreground/10 border-2 border-foreground/20">
                        <svg className="w-8 h-8 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-foreground">
                        {locale === 'en' 
                          ? 'Ready for Adventure?' 
                          : locale === 'ru' 
                          ? 'Готовы к приключению?' 
                          : 'მზად ხართ თავგადასავლისთვის?'}
                      </h4>
                      <p className="text-[11px] text-foreground/70 leading-relaxed">
                        {locale === 'en' 
                          ? `Book your tandem paragliding flight at any of our ${locations.length} locations` 
                          : locale === 'ru' 
                          ? `Забронируйте тандемный полет на любой из ${locations.length} локаций` 
                          : `დაჯავშნეთ თქვენი ფრენა ჩვენს ${locations.length} ლოკაციიდან ნებისმიერზე`}
                      </p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-foreground flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-[10px] text-foreground/70">
                        {locale === 'en' ? 'Professional pilots' : locale === 'ru' ? 'Профессиональные пилоты' : 'პროფესიონალი პილოტები'}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-foreground flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-[10px] text-foreground/70">
                        {locale === 'en' ? 'Safety certified equipment' : locale === 'ru' ? 'Сертифицированное оборудование' : 'სერტიფიცირებული აღჭურვილობა'}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-foreground flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-[10px] text-foreground/70">
                        {locale === 'en' ? 'Photo & video included' : locale === 'ru' ? 'Фото и видео включены' : 'ფოტო და ვიდეო შედის'}
                      </span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button 
                    onClick={() => window.location.href = `/${locale}/contact`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-foreground text-background hover:bg-foreground/90 rounded-lg font-semibold text-sm transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {locale === 'en' ? 'Book Now' : locale === 'ru' ? 'Забронировать' : 'დაჯავშნე ახლავე'}
                  </button>

                  {/* Info Text */}
                  <p className="text-[9px] text-center text-foreground/50 leading-relaxed">
                    {locale === 'en' 
                      ? 'We will help you choose the best location and time for your flight' 
                      : locale === 'ru' 
                      ? 'Мы поможем выбрать лучшую локацию и время для полета' 
                      : 'დაგეხმარებით აირჩიოთ საუკეთესო ლოკაცია და დრო'}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
