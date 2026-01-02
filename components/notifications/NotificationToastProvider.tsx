'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, Bell, CheckCircle, AlertCircle, Info, Calendar, Users, CreditCard } from 'lucide-react';
import { useSupabase } from '@/lib/supabase/SupabaseProvider';
import { subscribeToNotifications } from '@/lib/data/notifications';
import { getNotificationIcon, getNotificationColor } from '@/lib/types/notification';
import type { Notification, NotificationType } from '@/lib/types/notification';

interface Toast {
  id: string;
  notification: Notification;
  isLeaving: boolean;
}

interface NotificationToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
  autoHideDuration?: number;
}

const getToastIcon = (type: NotificationType) => {
  switch (type) {
    case 'new_booking':
    case 'group_booking':
      return Calendar;
    case 'booking_confirmed':
    case 'request_approved':
      return CheckCircle;
    case 'booking_cancelled':
    case 'payment_failed':
    case 'request_rejected':
      return AlertCircle;
    case 'booking_assigned':
    case 'booking_reassigned':
      return Users;
    case 'payment_received':
      return CreditCard;
    default:
      return Bell;
  }
};

const getToastColorClasses = (type: NotificationType) => {
  const color = getNotificationColor(type);
  const colorMap: Record<string, string> = {
    blue: 'border-l-blue-500 bg-blue-500/10',
    green: 'border-l-green-500 bg-green-500/10',
    red: 'border-l-red-500 bg-red-500/10',
    orange: 'border-l-orange-500 bg-orange-500/10',
    purple: 'border-l-purple-500 bg-purple-500/10',
    yellow: 'border-l-yellow-500 bg-yellow-500/10',
    gray: 'border-l-gray-500 bg-gray-500/10',
  };
  return colorMap[color] || 'border-l-blue-500 bg-blue-500/10';
};

export function NotificationToastProvider({
  children,
  maxToasts = 5,
  autoHideDuration = 5000,
}: NotificationToastProviderProps) {
  const { session } = useSupabase();
  const user = session?.user;
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Add new toast
  const addToast = useCallback((notification: Notification) => {
    const toastId = `toast-${notification.id}-${Date.now()}`;
    
    setToasts((prev) => {
      // Remove oldest if exceeds max
      const updated = prev.length >= maxToasts ? prev.slice(1) : prev;
      return [...updated, { id: toastId, notification, isLeaving: false }];
    });

    // Auto-hide after duration
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === toastId ? { ...t, isLeaving: true } : t))
      );
      
      // Remove after animation
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, 300);
    }, autoHideDuration);

    // Play sound
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch {}
  }, [maxToasts, autoHideDuration]);

  // Remove toast
  const removeToast = useCallback((toastId: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === toastId ? { ...t, isLeaving: true } : t))
    );
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 300);
  }, []);

  // Subscribe to notifications
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToNotifications(user.id, (notification) => {
      addToast(notification);
    });

    return () => {
      unsubscribe();
    };
  }, [user, addToast]);

  return (
    <>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-md w-full pointer-events-none">
        {toasts.map((toast) => {
          const Icon = getToastIcon(toast.notification.type);
          const colorClasses = getToastColorClasses(toast.notification.type);
          
          return (
            <div
              key={toast.id}
              className={`
                pointer-events-auto
                transform transition-all duration-300 ease-out
                ${toast.isLeaving 
                  ? 'opacity-0 translate-x-full' 
                  : 'opacity-100 translate-x-0'
                }
              `}
            >
              <div className={`
                relative overflow-hidden rounded-xl shadow-2xl border border-foreground/10
                bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl
                border-l-4 ${colorClasses}
              `}>
                <div className="p-4 flex items-start gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    <span className="text-2xl">
                      {getNotificationIcon(toast.notification.type)}
                    </span>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">
                      {toast.notification.title}
                    </p>
                    {toast.notification.message && (
                      <p className="text-xs text-foreground/70 mt-0.5 line-clamp-2">
                        {toast.notification.message}
                      </p>
                    )}
                  </div>
                  
                  {/* Close Button */}
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="flex-shrink-0 p-1 rounded-lg hover:bg-foreground/10 transition-colors"
                  >
                    <X className="w-4 h-4 text-foreground/50" />
                  </button>
                </div>
                
                {/* Progress Bar */}
                <div className="h-1 bg-foreground/5">
                  <div 
                    className="h-full bg-[#4697D2] dark:bg-[#CAFA00] animate-shrink"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default NotificationToastProvider;
