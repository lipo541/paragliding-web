'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  sender_id: string;
  recipient_type: 'USER' | 'ALL_USERS' | 'ROLE';
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
  recipient_count?: number;
}

interface MessageWithStats extends Message {
  total_recipients: number;
  read_count: number;
}

export default function MessagesList() {
  const [messages, setMessages] = useState<MessageWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<MessageWithStats | null>(null);
  const [viewLocale, setViewLocale] = useState<'ka' | 'en'>('ka');
  const supabase = createClient();

  const getLocalizedField = (msg: Message, field: 'subject' | 'content', locale: 'ka' | 'en' = 'ka') => {
    const localeField = `${field}_${locale}` as keyof Message;
    return (msg[localeField] as string) || msg[`${field}_ka`] || '';
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('არ ხართ ავტორიზებული');

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // For each message, get recipient stats
      const messagesWithStats = await Promise.all(
        (messagesData || []).map(async (msg: Message) => {
          const { data: recipients, error: recipientsError } = await supabase
            .from('message_recipients')
            .select('id, is_read')
            .eq('message_id', msg.id);

          if (recipientsError) {
            console.error('Error fetching recipients:', recipientsError);
            return {
              ...msg,
              total_recipients: 0,
              read_count: 0,
            };
          }

          return {
            ...msg,
            total_recipients: recipients?.length || 0,
            read_count: recipients?.filter((r: { is_read: boolean }) => r.is_read).length || 0,
          };
        })
      );

      setMessages(messagesWithStats);
    } catch (error: any) {
      console.error('Fetch messages error:', error);
      toast.error(error.message || 'შეტყობინებების ჩატვირთვა ვერ მოხერხდა');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('დარწმუნებული ხართ რომ გსურთ შეტყობინების წაშლა?')) return;

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      toast.success('შეტყობინება წაიშალა');
      setMessages(messages.filter(m => m.id !== messageId));
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
    } catch (error: any) {
      console.error('Delete message error:', error);
      toast.error(error.message || 'წაშლა ვერ მოხერხდა');
    }
  };

  const getRecipientTypeLabel = (msg: Message) => {
    if (msg.recipient_type === 'ALL_USERS') return 'ყველა მომხმარებელი';
    if (msg.recipient_type === 'ROLE') return `როლი: ${msg.recipient_role}`;
    return 'კონკრეტული მომხმარებელი';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-8 text-center">
        <svg className="w-16 h-16 mx-auto text-foreground/20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <h3 className="text-lg font-bold text-foreground mb-2">შეტყობინებები არ არის</h3>
        <p className="text-sm text-foreground/60">თქვენ ჯერ არ გაგიგზავნიათ არცერთი შეტყობინება</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Messages Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Messages List */}
        <div className="space-y-3">
          {messages.map((message) => (
            <button
              key={message.id}
              onClick={() => setSelectedMessage(message)}
              className={`w-full text-left bg-white/60 dark:bg-black/40 backdrop-blur-xl border rounded-2xl p-4 transition-all hover:shadow-md ${
                selectedMessage?.id === message.id
                  ? 'border-foreground shadow-md'
                  : 'border-white/20 dark:border-white/10'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground truncate">
                    {getLocalizedField(message, 'subject', viewLocale)}
                  </h3>
                  <p className="text-xs text-foreground/60 mt-1">{getRecipientTypeLabel(message)}</p>
                </div>
                <span className="text-xs text-foreground/40 whitespace-nowrap">
                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                </span>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 pt-2 border-t border-foreground/10">
                <div className="flex items-center gap-1.5 text-xs text-foreground/60">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>{message.total_recipients} მიმღები</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-foreground/60">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{message.read_count} წაკითხული</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Message Detail */}
        <div className="lg:sticky lg:top-4">
          {selectedMessage ? (
            <div className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-4 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-bold text-foreground">
                      {getLocalizedField(selectedMessage, 'subject', viewLocale)}
                    </h2>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setViewLocale('ka')}
                        className={`px-2 py-0.5 text-xs rounded ${viewLocale === 'ka' ? 'bg-foreground text-background' : 'bg-foreground/10 text-foreground'}`}
                      >
                        🇬🇪
                      </button>
                      <button
                        onClick={() => setViewLocale('en')}
                        className={`px-2 py-0.5 text-xs rounded ${viewLocale === 'en' ? 'bg-foreground text-background' : 'bg-foreground/10 text-foreground'}`}
                      >
                        🇬🇧
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-foreground/60 mt-1">
                    {new Date(selectedMessage.created_at).toLocaleString('ka-GE')}
                  </p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteMessage(selectedMessage.id)}
                >
                  წაშლა
                </Button>
              </div>

              {/* Recipient Info */}
              <div className="bg-foreground/5 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground/60">მიმღები:</span>
                  <span className="font-medium text-foreground">{getRecipientTypeLabel(selectedMessage)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground/60">სულ მიმღები:</span>
                  <span className="font-medium text-foreground">{selectedMessage.total_recipients}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground/60">წაკითხული:</span>
                  <span className="font-medium text-foreground">
                    {selectedMessage.read_count} ({selectedMessage.total_recipients > 0 
                      ? Math.round((selectedMessage.read_count / selectedMessage.total_recipients) * 100)
                      : 0}%)
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="border-t border-foreground/10 pt-4">
                <div 
                  className="prose prose-sm dark:prose-invert max-w-none text-foreground/80"
                  dangerouslySetInnerHTML={{ __html: getLocalizedField(selectedMessage, 'content', viewLocale) }}
                />
              </div>
            </div>
          ) : (
            <div className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-8 text-center">
              <svg className="w-12 h-12 mx-auto text-foreground/20 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              <p className="text-sm text-foreground/60">აირჩიეთ შეტყობინება დეტალების სანახავად</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
