// =====================================================
// Notification Types
// =====================================================
// TypeScript types for real-time notifications system
// =====================================================

export type NotificationType =
  | 'new_booking'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_completed'
  | 'booking_assigned'
  | 'booking_reassigned'
  | 'booking_rescheduled'
  | 'group_booking'
  | 'payment_received'
  | 'payment_failed'
  | 'pilot_request'
  | 'company_invite'
  | 'request_approved'
  | 'request_rejected'
  | 'system_message'
  | 'reminder';

export type RecipientType = 'pilot' | 'company' | 'customer' | 'admin';

export interface Notification {
  id: string;
  recipient_id: string;
  recipient_type: RecipientType;
  type: NotificationType;
  title: string;
  message: string | null;
  booking_id: string | null;
  group_id: string | null;
  pilot_id: string | null;
  company_id: string | null;
  metadata: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  expires_at: string | null;
}

export interface NotificationInsert {
  recipient_id: string;
  recipient_type: RecipientType;
  type: NotificationType;
  title: string;
  message?: string | null;
  booking_id?: string | null;
  group_id?: string | null;
  pilot_id?: string | null;
  company_id?: string | null;
  metadata?: Record<string, unknown>;
}

export interface NotificationWithDetails extends Notification {
  booking?: {
    id: string;
    full_name: string;
    selected_date: string;
    flight_type_name: string | null;
    number_of_people: number;
    status: string;
  } | null;
  pilot?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  } | null;
  company?: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
}

// Helper to get notification icon based on type
export const getNotificationIcon = (type: NotificationType): string => {
  const icons: Record<NotificationType, string> = {
    new_booking: '📋',
    booking_confirmed: '✅',
    booking_cancelled: '❌',
    booking_completed: '🎉',
    booking_assigned: '👤',
    booking_reassigned: '🔄',
    booking_rescheduled: '📅',
    group_booking: '👥',
    payment_received: '💰',
    payment_failed: '⚠️',
    pilot_request: '🙋',
    company_invite: '📨',
    request_approved: '✅',
    request_rejected: '❌',
    system_message: '📢',
    reminder: '⏰',
  };
  return icons[type] || '🔔';
};

// Helper to get notification color based on type
export const getNotificationColor = (type: NotificationType): string => {
  const colors: Record<NotificationType, string> = {
    new_booking: 'blue',
    booking_confirmed: 'green',
    booking_cancelled: 'red',
    booking_completed: 'green',
    booking_assigned: 'blue',
    booking_reassigned: 'orange',
    booking_rescheduled: 'orange',
    group_booking: 'purple',
    payment_received: 'green',
    payment_failed: 'red',
    pilot_request: 'blue',
    company_invite: 'blue',
    request_approved: 'green',
    request_rejected: 'red',
    system_message: 'gray',
    reminder: 'yellow',
  };
  return colors[type] || 'gray';
};
