'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, X, Loader2 } from 'lucide-react';
import { formatDistanceToNow, Locale } from 'date-fns';
import { ka, enUS, ru, ar, de, tr } from 'date-fns/locale';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { getNotificationIcon, getNotificationColor } from '@/lib/types/notification';
import type { Notification } from '@/lib/types/notification';

interface NotificationBellProps {
  locale?: string;
}

const localeMap: Record<string, Locale> = {
  ka,
  en: enUS,
  ru,
  ar,
  de,
  tr,
};

const translations = {
  ka: {
    notifications: 'შეტყობინებები',
    noNotifications: 'შეტყობინებები არ არის',
    markAllRead: 'ყველას წაკითხულად მონიშვნა',
    new: 'ახალი',
    viewAll: 'ყველას ნახვა',
    justNow: 'ახლახანს',
  },
  en: {
    notifications: 'Notifications',
    noNotifications: 'No notifications',
    markAllRead: 'Mark all as read',
    new: 'New',
    viewAll: 'View all',
    justNow: 'Just now',
  },
  ru: {
    notifications: 'Уведомления',
    noNotifications: 'Нет уведомлений',
    markAllRead: 'Отметить все как прочитанные',
    new: 'Новое',
    viewAll: 'Показать все',
    justNow: 'Только что',
  },
  ar: {
    notifications: 'الإشعارات',
    noNotifications: 'لا توجد إشعارات',
    markAllRead: 'تحديد الكل كمقروء',
    new: 'جديد',
    viewAll: 'عرض الكل',
    justNow: 'الآن',
  },
  de: {
    notifications: 'Benachrichtigungen',
    noNotifications: 'Keine Benachrichtigungen',
    markAllRead: 'Alle als gelesen markieren',
    new: 'Neu',
    viewAll: 'Alle anzeigen',
    justNow: 'Gerade eben',
  },
  tr: {
    notifications: 'Bildirimler',
    noNotifications: 'Bildirim yok',
    markAllRead: 'Tümünü okundu olarak işaretle',
    new: 'Yeni',
    viewAll: 'Tümünü görüntüle',
    justNow: 'Az önce',
  },
};

export default function NotificationBell({ locale = 'ka' }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const t = translations[locale as keyof typeof translations] || translations.ka;
  const dateLocale = localeMap[locale] || ka;

  const {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    remove,
  } = useNotifications({
    autoFetch: true,
    realtime: true,
    onNewNotification: (notification) => {
      // Play sound or show toast for new notifications
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message || undefined,
          icon: '/favicon.ico',
        });
      }
    },
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    // Less than 1 minute
    if (diffMs < 60000) {
      return t.justNow;
    }
    
    return formatDistanceToNow(date, { addSuffix: true, locale: dateLocale });
  };

  const getColorClasses = (type: Notification['type'], isRead: boolean) => {
    const color = getNotificationColor(type);
    if (isRead) {
      return 'bg-foreground/5';
    }
    
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-500/10 border-l-blue-500',
      green: 'bg-green-500/10 border-l-green-500',
      red: 'bg-red-500/10 border-l-red-500',
      orange: 'bg-orange-500/10 border-l-orange-500',
      purple: 'bg-purple-500/10 border-l-purple-500',
      yellow: 'bg-yellow-500/10 border-l-yellow-500',
      gray: 'bg-gray-500/10 border-l-gray-500',
    };
    
    return colorMap[color] || 'bg-foreground/10';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 transition-colors"
        aria-label={t.notifications}
      >
        <Bell className="w-5 h-5 text-foreground" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-red-500 rounded-full animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-h-[70vh] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-foreground/10 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-foreground/10">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Bell className="w-4 h-4" />
              {t.notifications}
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </h3>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-[#4697D2] hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {t.markAllRead}
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-[50vh]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-[#4697D2] animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-foreground/50">
                <Bell className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">{t.noNotifications}</p>
              </div>
            ) : (
              <div className="divide-y divide-foreground/5">
                {notifications.slice(0, 20).map((notification) => (
                  <div
                    key={notification.id}
                    className={`
                      relative p-3 border-l-4 transition-colors cursor-pointer
                      ${getColorClasses(notification.type, notification.is_read)}
                      ${!notification.is_read ? 'hover:bg-foreground/5' : 'hover:bg-foreground/8'}
                    `}
                    onClick={() => !notification.is_read && markRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <span className="text-xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </span>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm ${notification.is_read ? 'text-foreground/70' : 'text-foreground font-medium'}`}>
                            {notification.title}
                          </p>
                          
                          {/* New Badge */}
                          {!notification.is_read && (
                            <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-bold bg-[#4697D2] text-white rounded">
                              {t.new}
                            </span>
                          )}
                        </div>
                        
                        {notification.message && (
                          <p className="text-xs text-foreground/60 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                        )}
                        
                        <p className="text-[10px] text-foreground/40 mt-1">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.is_read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markRead(notification.id);
                            }}
                            className="p-1 hover:bg-foreground/10 rounded"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5 text-foreground/50" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(notification.id);
                          }}
                          className="p-1 hover:bg-red-500/10 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-foreground/50 hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 20 && (
            <div className="p-3 border-t border-foreground/10 text-center">
              <button className="text-sm text-[#4697D2] hover:underline">
                {t.viewAll}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
