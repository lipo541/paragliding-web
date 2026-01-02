'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from '@/lib/i18n/hooks/useTranslation';
import Breadcrumbs, { breadcrumbLabels, type Locale } from '@/components/shared/Breadcrumbs';

interface Message {
  id: string;
  sender_id: string;
  recipient_type: string;
  recipient_role: string | null;
  subject_ka: string;
  subject_en: string | null;
  subject_ru: string | null;
  subject_ar: string | null;
  subject_de: string | null;
  subject_tr: string | null;
  content_ka: string;
  content_en: string | null;
  content_ru: string | null;
  content_ar: string | null;
  content_de: string | null;
  content_tr: string | null;
  created_at: string;
  updated_at: string;
}

interface MessageWithDetails {
  id: string;
  message_id: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  messages: Message | null;
}

export default function UserNotification() {
  const [messages, setMessages] = useState<MessageWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<MessageWithDetails | null>(null);
  const [userLocale, setUserLocale] = useState<'ka' | 'en' | 'ru' | 'ar' | 'de' | 'tr'>('ka');
  const { t } = useTranslation('usernotification');
  const supabase = createClient();

  // Detect user locale from browser/pathname
  useEffect(() => {
    const pathname = window.location.pathname;
    const localeFromPath = pathname.split('/')[1];
    if (['ka', 'en', 'ru', 'ar', 'de', 'tr'].includes(localeFromPath)) {
      setUserLocale(localeFromPath as typeof userLocale);
    }
  }, []);

  const getLocalizedField = (msg: Message | null, field: 'subject' | 'content') => {
    if (!msg) return '';
    const localeField = `${field}_${userLocale}` as keyof Message;
    return (msg[localeField] as string) || msg[`${field}_ka`] || '';
  };

  useEffect(() => {
    fetchMessages();
    
    // Real-time subscription
    const channel = supabase
      .channel('user-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_recipients',
        },
        (payload: any) => {
          console.log('New message received:', payload);
          fetchMessages();
          toast.success(t('newMessage'));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMessages = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error(t('notAuthorized'));

      // Get message recipients
      const { data: recipients, error: recipientsError } = await supabase
        .from('message_recipients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (recipientsError) throw recipientsError;

      if (!recipients || recipients.length === 0) {
        setMessages([]);
        return;
      }

      // Get all message IDs
      const messageIds = recipients.map((r: any) => r.message_id);
      console.log('Message IDs:', messageIds);

      // Get messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .in('id', messageIds);

      console.log('Messages data:', messagesData);
      console.log('Messages error:', messagesError);

      if (messagesError) throw messagesError;

      // Combine data
      const combined = recipients.map((recipient: any) => ({
        ...recipient,
        messages: messagesData?.find((msg: any) => msg.id === recipient.message_id) || null
      })) as MessageWithDetails[];

      console.log('Combined messages:', combined);
      setMessages(combined);
    } catch (error: any) {
      console.error('Fetch messages error:', error);
      toast.error(error.message || t('fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageRecipientId: string) => {
    try {
      const { error } = await supabase
        .from('message_recipients')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', messageRecipientId);

      if (error) throw error;

      // Update local state
      setMessages(messages.map(msg => 
        msg.id === messageRecipientId 
          ? { ...msg, is_read: true, read_at: new Date().toISOString() }
          : msg
      ));
      
      // Dispatch event to update navigation badge immediately
      window.dispatchEvent(new CustomEvent('message-read-updated'));
    } catch (error: any) {
      console.error('Mark as read error:', error);
      toast.error(t('markAsReadFailed'));
    }
  };

  const handleDeleteMessage = async (messageRecipientId: string) => {
    if (!confirm(t('deleteConfirm'))) return;

    try {
      const { error } = await supabase
        .from('message_recipients')
        .delete()
        .eq('id', messageRecipientId);

      if (error) throw error;

      toast.success(t('deleteSuccess'));
      setMessages(messages.filter(msg => msg.id !== messageRecipientId));
      if (selectedMessage?.id === messageRecipientId) {
        setSelectedMessage(null);
      }
    } catch (error: any) {
      console.error('Delete message error:', error);
      toast.error(t('deleteFailed'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-foreground/20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="text-lg font-bold text-foreground mb-2">{t('empty.title')}</h3>
          <p className="text-sm text-foreground/60">{t('empty.description')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:pr-20 py-6 space-y-4">
      {/* Breadcrumbs */}
      <div>
        <Breadcrumbs 
          items={[
            { label: breadcrumbLabels[userLocale as Locale]?.home || 'Home', href: `/${userLocale}` },
            { label: breadcrumbLabels[userLocale as Locale]?.notifications || 'Notifications' }
          ]} 
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Messages List */}
        <div className="space-y-3">
          {messages.filter(message => message.messages).map((message) => (
            <button
              key={message.id}
              onClick={() => {
                setSelectedMessage(message);
                if (!message.is_read) {
                  handleMarkAsRead(message.id);
                }
              }}
              className={`w-full text-left bg-white/60 dark:bg-black/40 backdrop-blur-xl border rounded-2xl p-4 transition-all hover:shadow-md relative ${
                selectedMessage?.id === message.id
                  ? 'border-foreground shadow-md'
                  : 'border-white/20 dark:border-white/10'
              }`}
            >
              {/* Unread indicator */}
              {!message.is_read && (
                <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full"></div>
              )}

              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-2 pr-4">
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm truncate ${message.is_read ? 'font-medium text-foreground/70' : 'font-bold text-foreground'}`}>
                    {getLocalizedField(message.messages, 'subject')}
                  </h3>
                  <p className="text-xs text-foreground/60 mt-1">
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {/* Preview */}
              <div
                className="text-xs text-muted-foreground line-clamp-2"
                dangerouslySetInnerHTML={{ __html: getLocalizedField(message.messages, 'content') }}
              />
            </button>
          ))}
        </div>

        {/* Message Detail */}
        <div className="lg:sticky lg:top-4">
          {selectedMessage && selectedMessage.messages ? (
            <div className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-4 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-foreground/10">
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-foreground">{getLocalizedField(selectedMessage.messages, 'subject')}</h2>
                  <p className="text-xs text-foreground/60 mt-1">
                    {new Date(selectedMessage.messages.created_at).toLocaleString('ka-GE')}
                  </p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteMessage(selectedMessage.id)}
                >
                  {t('delete')}
                </Button>
              </div>

              {/* Content */}
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-foreground [&_*]:text-foreground"
                dangerouslySetInnerHTML={{ __html: getLocalizedField(selectedMessage.messages, 'content') }}
              />

              {/* Read status */}
              {selectedMessage.read_at && (
                <div className="text-xs text-foreground/40 pt-3 border-t border-foreground/10">
                  {t('readAt')}: {new Date(selectedMessage.read_at).toLocaleString('ka-GE')}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-8 text-center">
              <svg className="w-12 h-12 mx-auto text-foreground/20 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-foreground/60">{t('selectMessage')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
