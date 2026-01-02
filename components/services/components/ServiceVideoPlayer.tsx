'use client';

import { useState, useMemo } from 'react';
import { Play, ExternalLink } from 'lucide-react';
import Image from 'next/image';

interface ServiceVideoPlayerProps {
  videoUrls: string[];
}

// Helper to extract video ID and platform
function parseVideoUrl(url: string): { platform: 'youtube' | 'vimeo' | 'unknown'; id: string | null } {
  // YouTube patterns
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
  ];
  
  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match) {
      return { platform: 'youtube', id: match[1] };
    }
  }
  
  // Vimeo patterns
  const vimeoPattern = /vimeo\.com\/(?:video\/)?(\d+)/;
  const vimeoMatch = url.match(vimeoPattern);
  if (vimeoMatch) {
    return { platform: 'vimeo', id: vimeoMatch[1] };
  }
  
  return { platform: 'unknown', id: null };
}

// Get thumbnail URL
function getThumbnailUrl(platform: 'youtube' | 'vimeo' | 'unknown', id: string | null): string {
  if (!id) return '/images/video-placeholder.jpg';
  
  if (platform === 'youtube') {
    return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
  }
  
  // Vimeo thumbnails require API call, use placeholder
  return '/images/video-placeholder.jpg';
}

// Get embed URL
function getEmbedUrl(platform: 'youtube' | 'vimeo' | 'unknown', id: string | null): string | null {
  if (!id) return null;
  
  if (platform === 'youtube') {
    return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
  }
  
  if (platform === 'vimeo') {
    return `https://player.vimeo.com/video/${id}?autoplay=1`;
  }
  
  return null;
}

export default function ServiceVideoPlayer({ videoUrls }: ServiceVideoPlayerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const videos = useMemo(() => {
    return videoUrls.map(url => {
      const parsed = parseVideoUrl(url);
      return {
        url,
        ...parsed,
        thumbnail: getThumbnailUrl(parsed.platform, parsed.id),
        embedUrl: getEmbedUrl(parsed.platform, parsed.id)
      };
    });
  }, [videoUrls]);

  if (!videoUrls || videoUrls.length === 0) {
    return null;
  }

  const activeVideo = videos[activeIndex];

  const handlePlay = () => {
    if (activeVideo.embedUrl) {
      setIsPlaying(true);
    } else {
      // Open in new tab for unknown platforms
      window.open(activeVideo.url, '_blank');
    }
  };

  const handleVideoChange = (index: number) => {
    setActiveIndex(index);
    setIsPlaying(false);
  };

  return (
    <div className="space-y-4">
      {/* Main Video Player */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
        {isPlaying && activeVideo.embedUrl ? (
          <iframe
            src={activeVideo.embedUrl}
            title="Video player"
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div 
            className="relative w-full h-full cursor-pointer group"
            onClick={handlePlay}
          >
            {/* Thumbnail */}
            {activeVideo.platform === 'youtube' && activeVideo.id ? (
              <Image
                src={activeVideo.thumbnail}
                alt="Video thumbnail"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-center">
                  <Play className="w-12 h-12 text-white/60 mx-auto mb-2" />
                  <span className="text-white/60 text-sm">ვიდეო</span>
                </div>
              </div>
            )}
            
            {/* Play button overlay */}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-[#4697D2] flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 text-white fill-current ml-1" />
              </div>
            </div>
            
            {/* Platform badge */}
            <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs font-medium capitalize">
              {activeVideo.platform === 'youtube' ? 'YouTube' : activeVideo.platform === 'vimeo' ? 'Vimeo' : 'ვიდეო'}
            </div>
            
            {/* External link for unknown platforms */}
            {activeVideo.platform === 'unknown' && (
              <div className="absolute bottom-3 right-3 flex items-center gap-1 px-3 py-1 bg-white/90 dark:bg-black/80 rounded-full text-gray-800 dark:text-white text-xs font-medium">
                <ExternalLink className="w-3 h-3" />
                გახსნა
              </div>
            )}
          </div>
        )}
      </div>

      {/* Video Thumbnails (if multiple) */}
      {videos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
          {videos.map((video, index) => (
            <button
              key={index}
              onClick={() => handleVideoChange(index)}
              className={`relative flex-shrink-0 w-28 h-16 rounded-lg overflow-hidden transition-all ${
                index === activeIndex
                  ? 'ring-2 ring-[#4697D2] ring-offset-2 ring-offset-white dark:ring-offset-black'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              {video.platform === 'youtube' && video.id ? (
                <Image
                  src={video.thumbnail}
                  alt={`Video ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              ) : (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <Play className="w-6 h-6 text-white/60" />
                </div>
              )}
              
              {/* Play icon overlay */}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Play className="w-5 h-5 text-white fill-current" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
