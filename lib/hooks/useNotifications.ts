'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSupabase } from '@/lib/supabase/SupabaseProvider';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  subscribeToNotifications,
} from '@/lib/data/notifications';
import type { Notification } from '@/lib/types/notification';

interface UseNotificationsOptions {
  /** Auto-fetch notifications on mount */
  autoFetch?: boolean;
  /** Limit for initial fetch */
  limit?: number;
  /** Enable real-time subscriptions */
  realtime?: boolean;
  /** Callback when new notification arrives */
  onNewNotification?: (notification: Notification) => void;
}

interface UseNotificationsReturn {
  /** List of notifications */
  notifications: Notification[];
  /** Number of unread notifications */
  unreadCount: number;
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Refresh notifications from server */
  refresh: () => Promise<void>;
  /** Mark a notification as read */
  markRead: (id: string) => Promise<void>;
  /** Mark all notifications as read */
  markAllRead: () => Promise<void>;
  /** Delete a notification */
  remove: (id: string) => Promise<void>;
  /** Add notification locally (for optimistic updates) */
  addNotification: (notification: Notification) => void;
}

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const {
    autoFetch = true,
    limit = 50,
    realtime = true,
    onNewNotification,
  } = options;

  const { session } = useSupabase();
  const user = session?.user;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Store callback in ref to avoid re-subscribing
  const onNewNotificationRef = useRef(onNewNotification);
  onNewNotificationRef.current = onNewNotification;

  // Fetch notifications
  const refresh = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [notifs, count] = await Promise.all([
        getNotifications(limit),
        getUnreadCount(),
      ]);
      
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('შეტყობინებების ჩატვირთვა ვერ მოხერხდა');
    } finally {
      setLoading(false);
    }
  }, [user, limit]);

  // Mark single notification as read
  const markRead = useCallback(async (id: string) => {
    const success = await markAsRead(id);
    if (success) {
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, []);

  // Mark all as read
  const markAllRead = useCallback(async () => {
    const count = await markAllAsRead();
    if (count > 0) {
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    }
  }, []);

  // Delete notification
  const remove = useCallback(async (id: string) => {
    const success = await deleteNotification(id);
    if (success) {
      const notification = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  }, [notifications]);

  // Add notification locally
  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.is_read) {
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  // Handle new notification from real-time subscription
  const handleNewNotification = useCallback((notification: Notification) => {
    addNotification(notification);
    onNewNotificationRef.current?.(notification);
  }, [addNotification]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch && user) {
      refresh();
    }
  }, [autoFetch, user, refresh]);

  // Real-time subscription
  useEffect(() => {
    if (!realtime || !user) return;

    const unsubscribe = subscribeToNotifications(
      user.id,
      handleNewNotification,
      // On update (e.g., marked as read elsewhere)
      (updated) => {
        setNotifications(prev =>
          prev.map(n => (n.id === updated.id ? updated : n))
        );
        // Recalculate unread count
        setNotifications(prev => {
          const newUnread = prev.filter(n => !n.is_read).length;
          setUnreadCount(newUnread);
          return prev;
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [realtime, user, handleNewNotification]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refresh,
    markRead,
    markAllRead,
    remove,
    addNotification,
  };
}
