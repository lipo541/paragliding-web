'use client';

import { useState, useEffect, useCallback, useRef, MouseEvent, TouchEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { HeroSlide, HeroSlideButton, getSlideTitle, getSlideDescription, getButtonText, HeroLocale } from '@/lib/types/hero';
import { cn } from '@/lib/utils';

interface HeroSectionProps {
  locale: HeroLocale;
  initialSlides?: HeroSlide[];
}

export default function HeroSection({ locale, initialSlides = [] }: HeroSectionProps) {
  const router = useRouter();
  const [slides, setSlides] = useState<HeroSlide[]>(initialSlides);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(initialSlides.length === 0);
  
  // Drag/Swipe state
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // მინიმუმ swipe დისტანცია
  const minSwipeDistance = 50;

  // Initialize slides from SSR data
  useEffect(() => {
    if (initialSlides.length > 0) {
      setSlides(initialSlides);
      setIsLoading(false);
    }
  }, [initialSlides]);

  // ავტო-გადაადგილება
  const startAutoPlay = useCallback(() => {
    if (slides.length <= 1) return;
    
    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 6000);
  }, [slides.length]);

  const stopAutoPlay = useCallback(() => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
  }, []);

  useEffect(() => {
    startAutoPlay();
    return () => stopAutoPlay();
  }, [startAutoPlay, stopAutoPlay]);

  // ნავიგაციის ფუნქციები
  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
    stopAutoPlay();
    startAutoPlay();
  }, [stopAutoPlay, startAutoPlay]);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Mouse drag handlers
  const handleMouseDown = (e: MouseEvent) => {
    if (slides.length <= 1) return;
    setIsDragging(true);
    setStartX(e.clientX);
    setTranslateX(0);
    stopAutoPlay();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const diff = e.clientX - startX;
    setTranslateX(diff);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    if (translateX > minSwipeDistance) {
      prevSlide();
    } else if (translateX < -minSwipeDistance) {
      nextSlide();
    }
    
    setTranslateX(0);
    startAutoPlay();
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleMouseUp();
    }
  };

  // Touch handlers
  const handleTouchStart = (e: TouchEvent) => {
    if (slides.length <= 1) return;
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setTranslateX(0);
    stopAutoPlay();
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientX - startX;
    setTranslateX(diff);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    if (translateX > minSwipeDistance) {
      prevSlide();
    } else if (translateX < -minSwipeDistance) {
      nextSlide();
    }
    
    setTranslateX(0);
    startAutoPlay();
  };

  // ღილაკის click handler
  const handleButtonClick = (button: HeroSlideButton) => {
    const isExternalUrl = (url: string) => {
      return url?.startsWith('http://') || url?.startsWith('https://');
    };

    switch (button.action_type) {
      case 'link':
        if (button.action_url) {
          if (button.open_in_new_tab || isExternalUrl(button.action_url)) {
            window.open(button.action_url, '_blank', 'noopener,noreferrer');
          } else {
            router.push(button.action_url);
          }
        }
        break;
      case 'contact':
        router.push(`/${locale}/contact`);
        break;
      case 'pilot':
        if (button.pilot_id) {
          router.push(`/${locale}/pilot/${button.pilot_id}`);
        }
        break;
      case 'location':
        if (button.location_id) {
          router.push(`/${locale}/locations/${button.location_id}`);
        }
        break;
      case 'company':
        if (button.company_id) {
          router.push(`/${locale}/company/${button.company_id}`);
        }
        break;
      case 'service':
        if (button.service_id) {
          router.push(`/${locale}/services/${button.service_id}`);
        }
        break;
    }
  };

  // ღილაკის ფორმა
  const getShapeClasses = (shape: string) => {
    switch (shape) {
      case 'pill':
        return 'rounded-full';
      case 'square':
        return 'rounded-lg';
      case 'rounded':
      default:
        return 'rounded-xl';
    }
  };

  // ღილაკის სტილის ვარიანტები - Glass Mode (როგორც საიტზე)
  const getButtonClasses = (variant: string, shape: string = 'rounded') => {
    const baseClasses = `group inline-flex items-center gap-2 px-6 py-3 font-medium transition-all duration-300 text-sm md:text-base cursor-pointer ${getShapeClasses(shape)}`;
    
    switch (variant) {
      case 'glass-dark':
        // შავი glass - როგორც საიტზე
        return cn(baseClasses, 'bg-black/40 border border-white/20 text-white hover:bg-black/60 hover:border-white/40 backdrop-blur-md shadow-lg');
      case 'glass-light':
        // თეთრი glass - როგორც საიტზე
        return cn(baseClasses, 'bg-white/90 border border-white/50 text-black hover:bg-white hover:shadow-xl backdrop-blur-md shadow-lg');
      case 'glass-primary':
        // პრაიმერი glass - როგორც საიტზე
        return cn(baseClasses, 'bg-[rgba(70,151,210,0.4)] border border-[#4697D2]/50 text-white hover:bg-[rgba(70,151,210,0.6)] hover:border-[#4697D2]/70 backdrop-blur-md shadow-lg');
      // Legacy support
      case 'primary':
        return cn(baseClasses, 'bg-black/40 border border-white/20 text-white hover:bg-black/60 backdrop-blur-md');
      case 'secondary':
        return cn(baseClasses, 'bg-white/90 border border-white/50 text-black hover:bg-white backdrop-blur-md');
      case 'outline':
        return cn(baseClasses, 'bg-[rgba(70,151,210,0.4)] border border-[#4697D2]/50 text-white hover:bg-[rgba(70,151,210,0.6)] backdrop-blur-md');
      default:
        return cn(baseClasses, 'bg-black/40 border border-white/20 text-white hover:bg-black/60 backdrop-blur-md');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="relative h-screen -mt-[72px] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-black animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // თუ სლაიდები არ არის - fallback
  if (slides.length === 0) {
    return (
      <div className="relative h-screen -mt-[72px] bg-gradient-to-br from-sky-400 to-blue-600 dark:from-gray-900 dark:to-black">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              პარაპლანით ფრენა
            </h1>
            <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
              აღმოაჩინეთ საქართველოს უნიკალური ლოკაციები პარაპლანით ფრენისთვის
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentSlide = slides[currentIndex];

  return (
    <section 
      ref={sliderRef}
      className={cn(
        "relative h-screen -mt-[72px] overflow-hidden select-none",
        isDragging ? "cursor-grabbing" : "cursor-grab"
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* სურათების სლაიდერი - Apple სტილი */}
      <div 
        className="absolute inset-0 flex transition-transform duration-500 ease-out"
        style={{ 
          transform: `translateX(calc(-${currentIndex * 100}% + ${isDragging ? translateX : 0}px))`,
          transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)'
        }}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className="relative w-full h-full flex-shrink-0"
          >
            {/* Light Mode Image */}
            <Image
              src={slide.image_url_light}
              alt={getSlideTitle(slide, locale)}
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-cover dark:hidden"
              draggable={false}
            />
            {/* Dark Mode Image */}
            <Image
              src={slide.image_url_dark}
              alt={getSlideTitle(slide, locale)}
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-cover hidden dark:block"
              draggable={false}
            />
            {/* Gradient Overlay - Apple სტილი */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
        ))}
      </div>

      {/* კონტენტი - მარცხნივ განლაგებული */}
      <div className="relative z-20 h-full flex items-center pb-24 pt-[72px]">
        <div className="w-full max-w-[1280px] mx-auto px-4">
          <div className="max-w-2xl text-black dark:text-white">
            {/* სათაური */}
            {currentIndex === 0 ? (
              <h1 
                key={`title-${currentIndex}`}
                className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold mb-3 md:mb-4 leading-tight tracking-tight animate-fade-in-up"
              >
                {getSlideTitle(currentSlide, locale)}
              </h1>
            ) : (
              <h2 
                key={`title-${currentIndex}`}
                className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold mb-3 md:mb-4 leading-tight tracking-tight animate-fade-in-up"
              >
                {getSlideTitle(currentSlide, locale)}
              </h2>
            )}

            {/* აღწერა */}
            {getSlideDescription(currentSlide, locale) && (
              <p 
                key={`desc-${currentIndex}`}
                className="text-base md:text-lg text-black/80 dark:text-white/80 mb-6 md:mb-8 max-w-lg font-light animate-fade-in-up animation-delay-100"
              >
                {getSlideDescription(currentSlide, locale)}
              </p>
            )}

            {/* ღილაკები */}
            {currentSlide.buttons && currentSlide.buttons.length > 0 && (
              <div 
                key={`buttons-${currentIndex}`}
                className="flex flex-wrap items-center gap-4 animate-fade-in-up animation-delay-200"
              >
                {currentSlide.buttons.map((button) => (
                  <button
                    key={button.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleButtonClick(button);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className={getButtonClasses(button.variant, button.shape || 'rounded')}
                  >
                    {button.action_type === 'contact' && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    )}
                    <span>{getButtonText(button, locale)}</span>
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ნავიგაციის წერტილები - Apple სტილი */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md bg-black/20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                goToSlide(index);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className={cn(
                'transition-all duration-300 rounded-full',
                index === currentIndex 
                  ? 'w-6 h-2 bg-white' 
                  : 'w-2 h-2 bg-white/50 hover:bg-white/75'
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* ნავიგაციის ისრები - Apple სტილი (hover-ზე ჩანს) */}
      {slides.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
              stopAutoPlay();
              startAutoPlay();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 p-3 md:p-4 rounded-full backdrop-blur-md bg-black/20 hover:bg-black/40 transition-all duration-300 text-white opacity-60 hover:opacity-100"
            aria-label="Previous slide"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
              stopAutoPlay();
              startAutoPlay();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 p-3 md:p-4 rounded-full backdrop-blur-md bg-black/20 hover:bg-black/40 transition-all duration-300 text-white opacity-60 hover:opacity-100"
            aria-label="Next slide"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </section>
  );
}
