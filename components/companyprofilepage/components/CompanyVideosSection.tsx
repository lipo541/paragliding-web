'use client';

import { useState } from 'react';
import { Video, Play } from 'lucide-react';

interface CompanyVideosSectionProps {
  videos: string[];
  locale: string;
  translations: {
    videos: string;
    video: string;
    nowPlaying: string;
    playlist: string;
  };
}

// YouTube / Vimeo embed URL generator
function getEmbedUrl(url: string): string | null {
  const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch) return `https://www.youtube-nocookie.com/embed/${youtubeMatch[1]}`;

  const playlistMatch = url.match(/youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/);
  if (playlistMatch) return `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistMatch[1]}`;

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return null;
}

export default function CompanyVideosSection({ videos, locale, translations }: CompanyVideosSectionProps) {
  const [videoIdx, setVideoIdx] = useState(0);

  if (!videos || videos.length === 0) return null;

  const embedUrl = getEmbedUrl(videos[videoIdx]);

  return (
    <div className="bg-[rgba(70,151,210,0.15)] dark:bg-black/40 backdrop-blur-xl rounded-xl shadow-xl shadow-black/10 dark:shadow-black/30 border border-[#4697D2]/30 dark:border-white/10 p-4">
      <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-white mb-3">
        <Video className="w-4 h-4 text-[#4697D2] dark:text-[#CAFA00]" />
        {translations.videos}
        <span className="ml-auto text-xs px-2 py-0.5 rounded bg-[rgba(70,151,210,0.2)] dark:bg-black/50 text-zinc-600 dark:text-white/80">
          {videos.length}
        </span>
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Main Video Player */}
        <div className="lg:col-span-2 space-y-2">
          <div className="relative rounded-lg overflow-hidden border border-white/20 bg-black shadow-lg">
            <div className="relative aspect-video">
              {embedUrl ? (
                <iframe
                  key={videoIdx}
                  src={embedUrl}
                  title={`${translations.video} ${videoIdx + 1}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                  <p className="text-sm text-zinc-400">{locale === 'ka' ? 'ვიდეო მიუწვდომელია' : 'Video unavailable'}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Now Playing Info */}
          <div className="flex items-center gap-2 px-1">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-600/20 border border-red-600/30">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[9px] font-semibold text-red-400 uppercase tracking-wide">
                {translations.nowPlaying}
              </span>
            </div>
            <span className="text-xs text-zinc-500 dark:text-white/80">{videoIdx + 1} / {videos.length}</span>
          </div>
        </div>

        {/* Playlist */}
        {videos.length > 1 && (
          <div className="lg:col-span-1 lg:self-start">
            <div className="rounded-lg overflow-hidden max-h-[280px] lg:max-h-[240px] flex flex-col border border-[#4697D2]/30 dark:border-white/10 bg-[rgba(70,151,210,0.1)] dark:bg-black/30">
              {/* Playlist Header */}
              <div className="px-3 py-2 bg-[rgba(70,151,210,0.15)] dark:bg-black/50 border-b border-[#4697D2]/30 dark:border-white/10 flex-shrink-0">
                <h4 className="text-[10px] font-semibold text-zinc-700 dark:text-white uppercase tracking-wide">
                  {translations.playlist}
                </h4>
              </div>
              
              {/* Playlist Items */}
              <div className="flex-1 overflow-y-auto">
                {videos.map((videoUrl, i) => {
                  const embedUrlItem = getEmbedUrl(videoUrl);
                  const videoId = embedUrlItem?.split('/embed/')[1]?.split('?')[0];
                  const isActive = i === videoIdx;
                  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '';

                  return (
                    <button
                      key={i}
                      onClick={() => setVideoIdx(i)}
                      className={`w-full flex items-start gap-2 p-2 transition-all hover:bg-[rgba(70,151,210,0.15)] dark:hover:bg-black/50 border-l-2 ${
                        isActive 
                          ? 'bg-[rgba(70,151,210,0.2)] dark:bg-black/60 border-l-red-600' 
                          : 'border-l-transparent hover:border-l-[#4697D2]/50'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="relative w-20 flex-shrink-0 rounded overflow-hidden border border-[#4697D2]/30 dark:border-white/10">
                        <div className="relative aspect-video bg-black">
                          {thumbnailUrl && (
                            <img src={thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                          )}
                          <div className={`absolute inset-0 flex items-center justify-center ${isActive ? 'bg-black/50' : 'bg-black/30'}`}>
                            {isActive ? (
                              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-600 text-white">
                                <span className="text-[7px] font-bold">▶</span>
                              </div>
                            ) : (
                              <Play className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div className="absolute top-0.5 left-0.5 px-1 py-0.5 rounded bg-black/80">
                            <span className="text-[8px] text-white font-bold">{i + 1}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Video title */}
                      <div className="flex-1 min-w-0 text-left">
                        <p className={`text-[10px] font-medium truncate ${isActive ? 'text-[#4697D2] dark:text-[#CAFA00]' : 'text-zinc-700 dark:text-white'}`}>
                          {translations.video} {i + 1}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
