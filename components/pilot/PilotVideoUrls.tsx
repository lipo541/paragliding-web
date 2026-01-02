'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Video, Plus, Trash2, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface PilotVideoUrlsProps {
  pilotId: string;
  videoUrls: string[];
  onUpdate: (urls: string[]) => void;
  maxVideos?: number;
}

// YouTube და Vimeo ვალიდაცია
const isValidVideoUrl = (url: string): boolean => {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[\w-]+/;
  const vimeoRegex = /^(https?:\/\/)?(www\.)?vimeo\.com\/\d+/;
  return youtubeRegex.test(url) || vimeoRegex.test(url);
};

// YouTube thumbnail URL
const getVideoThumbnail = (url: string): string | null => {
  // YouTube
  const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch) {
    return `https://img.youtube.com/vi/${youtubeMatch[1]}/mqdefault.jpg`;
  }
  
  // Vimeo - placeholder
  return null;
};

// Embed URL
const getEmbedUrl = (url: string): string | null => {
  // YouTube
  const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }
  
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  
  return null;
};

export default function PilotVideoUrls({
  pilotId,
  videoUrls = [],
  onUpdate,
  maxVideos = 5,
}: PilotVideoUrlsProps) {
  const [newUrl, setNewUrl] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const addVideo = useCallback(async () => {
    if (!newUrl.trim()) {
      setError('შეიყვანეთ URL');
      return;
    }

    if (!isValidVideoUrl(newUrl.trim())) {
      setError('მხოლოდ YouTube ან Vimeo ლინკებია დაშვებული');
      return;
    }

    if (videoUrls.includes(newUrl.trim())) {
      setError('ეს ვიდეო უკვე დამატებულია');
      return;
    }

    if (videoUrls.length >= maxVideos) {
      setError(`მაქსიმუმ ${maxVideos} ვიდეო შეგიძლიათ დაამატოთ`);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const updatedUrls = [...videoUrls, newUrl.trim()];
      
      const { error: dbError } = await supabase
        .from('pilots')
        .update({ video_urls: updatedUrls })
        .eq('id', pilotId);

      if (dbError) throw dbError;

      onUpdate(updatedUrls);
      setNewUrl('');
      toast.success('ვიდეო დამატებულია');
    } catch (err) {
      console.error('Add video error:', err);
      toast.error('ვიდეოს დამატებისას მოხდა შეცდომა');
    } finally {
      setSaving(false);
    }
  }, [newUrl, videoUrls, maxVideos, pilotId, onUpdate, supabase]);

  const removeVideo = useCallback(async (urlToRemove: string) => {
    setSaving(true);

    try {
      const updatedUrls = videoUrls.filter(url => url !== urlToRemove);
      
      const { error: dbError } = await supabase
        .from('pilots')
        .update({ video_urls: updatedUrls })
        .eq('id', pilotId);

      if (dbError) throw dbError;

      onUpdate(updatedUrls);
      toast.success('ვიდეო წაშლილია');
    } catch (err) {
      console.error('Remove video error:', err);
      toast.error('ვიდეოს წაშლისას მოხდა შეცდომა');
    } finally {
      setSaving(false);
    }
  }, [videoUrls, pilotId, onUpdate, supabase]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Video className="w-4 h-4 text-[#4697D2]" />
        <div>
          <h4 className="text-sm font-medium text-[#1a1a1a] dark:text-white">
            ვიდეოები
          </h4>
          <p className="text-xs text-[#1a1a1a]/50 dark:text-white/50">
            დაამატეთ თქვენი ფრენების ვიდეოები (მაქს. {maxVideos})
          </p>
        </div>
      </div>

      {/* დამატების ფორმა */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={newUrl}
            onChange={(e) => {
              setNewUrl(e.target.value);
              setError('');
            }}
            placeholder="YouTube ან Vimeo ლინკი..."
            className="
              flex-1 px-3 py-2 rounded-lg text-sm
              bg-[#1a1a1a]/5 dark:bg-white/10
              text-[#1a1a1a] dark:text-white
              placeholder:text-[#1a1a1a]/40 dark:placeholder:text-white/40
              border border-transparent
              focus:border-[#4697D2] focus:outline-none
              transition-colors duration-200
            "
          />
          <button
            onClick={addVideo}
            disabled={saving || videoUrls.length >= maxVideos}
            className="
              px-4 py-2 rounded-lg
              bg-[#4697D2] text-white text-sm font-medium
              hover:bg-[#3a82bb] transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center gap-1.5
            "
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            დამატება
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </p>
        )}
      </div>

      {/* ვიდეოების სია */}
      {videoUrls.length > 0 && (
        <div className="space-y-3">
          {videoUrls.map((url, index) => {
            const thumbnail = getVideoThumbnail(url);
            const embedUrl = getEmbedUrl(url);
            
            return (
              <div
                key={`${url}-${index}`}
                className="
                  flex items-center gap-3 p-2 rounded-lg
                  bg-[#1a1a1a]/5 dark:bg-white/10
                  group transition-colors
                "
              >
                {/* Thumbnail */}
                <div className="w-24 h-14 rounded overflow-hidden bg-black/20 flex-shrink-0">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={`Video ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-6 h-6 text-white/30" />
                    </div>
                  )}
                </div>

                {/* URL Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#1a1a1a]/70 dark:text-white/70 truncate">
                    {url}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {embedUrl && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="
                        p-1.5 rounded-lg
                        bg-[#1a1a1a]/10 dark:bg-white/10
                        text-[#1a1a1a]/70 dark:text-white/70
                        hover:text-[#4697D2] transition-colors
                      "
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => removeVideo(url)}
                    disabled={saving}
                    className="
                      p-1.5 rounded-lg
                      bg-red-500/10 text-red-500
                      hover:bg-red-500/20 transition-colors
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {videoUrls.length === 0 && (
        <div className="text-center py-4 text-sm text-[#1a1a1a]/50 dark:text-white/50">
          ჯერ არ გაქვთ დამატებული ვიდეო
        </div>
      )}
    </div>
  );
}
