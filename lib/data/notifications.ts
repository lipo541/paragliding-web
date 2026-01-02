// =====================================================
// Notifications Data Functions
// =====================================================
// CRUD operations and real-time subscriptions for notifications
// =====================================================

import { createClient } from '@/lib/supabase/client';
import type { Notification, NotificationWithDetails, RecipientType, NotificationType } from '@/lib/types/notification';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// =====================================================
// Fetch Functions
// =====================================================

/**
 * Get all notifications for the current user
 */
export async function getNotifications(limit = 50, offset = 0): Promise<Notification[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (error) {
    // Silently return empty array - notifications table may not exist yet
    // This is expected until the notifications migration is run
    return [];
  }
  
  return data || [];
}

/**
 * Get notifications with related booking/pilot/company details
 */
export async function getNotificationsWithDetails(limit = 50): Promise<NotificationWithDetails[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      booking:bookings(
        id,
        full_name,
        selected_date,
        flight_type_name,
        number_of_people,
        status
      ),
      pilot:pilots(
        id,
        first_name,
        last_name,
        avatar_url
      ),
      company:companies(
        id,
        name,
        logo_url
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    // Silently return empty array - notifications table may not exist yet
    return [];
  }
  
  return data || [];
}

/**
 * Get unread notifications count
 */
export async function getUnreadCount(): Promise<number> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .rpc('get_unread_notification_count');
  
  if (error) {
    // Silently return 0 - RPC function may not exist yet
    // This is expected until the notifications migration is run
    return 0;
  }
  
  return data || 0;
}

/**
 * Get unread notifications
 */
export async function getUnreadNotifications(): Promise<Notification[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('is_read', false)
    .order('created_at', { ascending: false });
  
  if (error) {
    // Silently return empty array - notifications table may not exist yet
    return [];
  }
  
  return data || [];
}

// =====================================================
// Update Functions
// =====================================================

/**
 * Mark a single notification as read
 */
export async function markAsRead(notificationId: string): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await supabase
    .rpc('mark_notification_read', { p_notification_id: notificationId });
  
  if (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
  
  return true;
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<number> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .rpc('mark_all_notifications_read');
  
  if (error) {
    console.error('Error marking all notifications as read:', error);
    return 0;
  }
  
  return data || 0;
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);
  
  if (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
  
  return true;
}

/**
 * Delete all read notifications
 */
export async function deleteAllRead(): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('is_read', true);
  
  if (error) {
    console.error('Error deleting read notifications:', error);
    return false;
  }
  
  return true;
}

// =====================================================
// Create Functions (mainly for testing/admin)
// =====================================================

/**
 * Create a notification (usually done via database triggers)
 */
export async function createNotification(
  recipientId: string,
  recipientType: RecipientType,
  type: NotificationType,
  title: string,
  message?: string,
  bookingId?: string,
  groupId?: string,
  pilotId?: string,
  companyId?: string,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .rpc('create_notification', {
      p_recipient_id: recipientId,
      p_recipient_type: recipientType,
      p_type: type,
      p_title: title,
      p_message: message || null,
      p_booking_id: bookingId || null,
      p_group_id: groupId || null,
      p_pilot_id: pilotId || null,
      p_company_id: companyId || null,
      p_metadata: metadata || {},
    });
  
  if (error) {
    console.error('Error creating notification:', error);
    return null;
  }
  
  return data;
}

// =====================================================
// Real-time Subscription
// =====================================================

export type NotificationCallback = (notification: Notification) => void;

/**
 * Subscribe to real-time notifications for the current user
 * Returns a cleanup function to unsubscribe
 */
export function subscribeToNotifications(
  userId: string,
  onNewNotification: NotificationCallback,
  onNotificationUpdate?: NotificationCallback
): () => void {
  const supabase = createClient();
  
  const channel: RealtimeChannel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${userId}`,
      },
      (payload: RealtimePostgresChangesPayload<Notification>) => {
        if (payload.new && 'id' in payload.new) {
          onNewNotification(payload.new as Notification);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${userId}`,
      },
      (payload: RealtimePostgresChangesPayload<Notification>) => {
        if (onNotificationUpdate && payload.new && 'id' in payload.new) {
          onNotificationUpdate(payload.new as Notification);
        }
      }
    )
    .subscribe();
  
  // Return cleanup function
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to all notifications (for super admins)
 */
export function subscribeToAllNotifications(
  onNewNotification: NotificationCallback
): () => void {
  const supabase = createClient();
  
  const channel: RealtimeChannel = supabase
    .channel('all-notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      },
      (payload: RealtimePostgresChangesPayload<Notification>) => {
        if (payload.new && 'id' in payload.new) {
          onNewNotification(payload.new as Notification);
        }
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to bookings changes (for real-time booking updates)
 */
export function subscribeToBookings(
  filter: { pilotId?: string; companyId?: string },
  onBookingChange: (booking: unknown, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
): () => void {
  const supabase = createClient();
  
  let channelFilter = '';
  if (filter.pilotId) {
    channelFilter = `pilot_id=eq.${filter.pilotId}`;
  } else if (filter.companyId) {
    channelFilter = `company_id=eq.${filter.companyId}`;
  }
  
  const channel: RealtimeChannel = supabase
    .channel(`bookings:${filter.pilotId || filter.companyId || 'all'}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: channelFilter || undefined,
      },
      (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
        const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
        const data = eventType === 'DELETE' ? payload.old : payload.new;
        onBookingChange(data, eventType);
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}
