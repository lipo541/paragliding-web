'use client';

import { useState } from 'react';
import { Video, Play } from 'lucide-react';

interface CompanyVideosProps {
  videos: string[];
  locale: string;
  translations: {
    videos: string;
    video: string;
  };
}

// YouTube / Vimeo embed URL generator
function getEmbedUrl(url: string): string | null {
  // YouTube video
  const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch) {
    return `https://www.youtube-nocookie.com/embed/${youtubeMatch[1]}`;
  }

  // YouTube playlist
  const playlistMatch = url.match(/youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/);
  if (playlistMatch) {
    return `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistMatch[1]}`;
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return null;
}

// YouTube thumbnail
function getVideoThumbnail(url: string): string | null {
  const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch) {
    return `https://img.youtube.com/vi/${youtubeMatch[1]}/mqdefault.jpg`;
  }
  return null;
}

export default function CompanyVideos({ videos, locale, translations }: CompanyVideosProps) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (!videos || videos.length === 0) {
    return null;
  }

  const embedUrl = getEmbedUrl(videos[activeIdx]);

  return (
    <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl p-5 animate-fadeIn">
      <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-white mb-4">
        <Video className="w-4 h-4 text-[#4697D2] dark:text-[#CAFA00]" />
        {translations.videos}
        <span className="ml-auto text-xs px-2 py-0.5 rounded bg-[rgba(70,151,210,0.2)] dark:bg-black/50 text-zinc-600 dark:text-white/80">
          {videos.length}
        </span>
      </h2>

      {/* YouTube style layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Main Video Player */}
        <div className="lg:col-span-2 space-y-2">
          <div className="relative rounded-lg overflow-hidden border border-[#4697D2]/30 dark:border-white/20 bg-black shadow-lg">
            <div className="relative aspect-video">
              {embedUrl ? (
                <iframe
                  key={activeIdx}
                  src={embedUrl}
                  title={`${translations.video} ${activeIdx + 1}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                  <p className="text-sm text-zinc-400">
                    {locale === 'ka' ? 'ვიდეო მიუწვდომელია' : 'Video unavailable'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Video Playlist */}
        {videos.length > 1 && (
          <div className="lg:col-span-1 space-y-1.5 max-h-[280px] lg:max-h-none overflow-y-auto pr-1">
            {videos.map((url, i) => {
              const thumb = getVideoThumbnail(url);
              const isActive = i === activeIdx;

              return (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  className={`
                    flex items-center gap-2 w-full p-1.5 rounded-lg transition-all text-left
                    ${isActive
                      ? 'bg-[#4697D2]/20 dark:bg-[#4697D2]/30 border border-[#4697D2]/50'
                      : 'bg-white/20 dark:bg-white/5 border border-transparent hover:bg-white/30 dark:hover:bg-white/10'
                    }
                  `}
                >
                  {/* Thumbnail */}
                  <div className="relative w-20 h-12 rounded overflow-hidden flex-shrink-0 bg-black/20">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-4 h-4 text-white/30" />
                      </div>
                    )}
                    {/* Play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`
                        w-6 h-6 rounded-full flex items-center justify-center
                        ${isActive ? 'bg-[#4697D2]' : 'bg-black/40'}
                      `}>
                        <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                    {/* Index badge */}
                    <div className="absolute bottom-0.5 right-0.5 bg-black/70 px-1 rounded">
                      <span className="text-[9px] text-white font-bold">{i + 1}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${isActive ? 'text-[#4697D2] dark:text-[#CAFA00]' : 'text-zinc-700 dark:text-white'}`}>
                      {translations.video} {i + 1}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
