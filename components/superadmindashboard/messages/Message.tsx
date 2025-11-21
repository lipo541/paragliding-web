'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import RichTextEditor from '@/components/shared/RichTextEditor';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';

type RecipientType = 'USER' | 'ALL_USERS' | 'ROLE';
type RecipientRole = 'USER' | 'SUPER_ADMIN';
type Locale = 'ka' | 'en' | 'ru' | 'ar' | 'de' | 'tr';

interface MessageContent {
  subject: string;
  content: string;
}

export default function Message() {
  const [currentLocale, setCurrentLocale] = useState<Locale>('ka');
  const [messages, setMessages] = useState<Record<Locale, MessageContent>>({
    ka: { subject: '', content: '' },
    en: { subject: '', content: '' },
    ru: { subject: '', content: '' },
    ar: { subject: '', content: '' },
    de: { subject: '', content: '' },
    tr: { subject: '', content: '' },
  });
  const [recipientType, setRecipientType] = useState<RecipientType>('ALL_USERS');
  const [recipientRole, setRecipientRole] = useState<RecipientRole>('USER');
  const [specificUserId, setSpecificUserId] = useState('');
  const [sending, setSending] = useState(false);

  const supabase = createClient();

  const localeLabels: Record<Locale, string> = {
    ka: '🇬🇪 ქართული',
    en: '🇬🇧 English',
    ru: '🇷🇺 Русский',
    ar: '🇸🇦 العربية',
    de: '🇩🇪 Deutsch',
    tr: '🇹🇷 Türkçe',
  };

  const updateMessage = (locale: Locale, field: 'subject' | 'content', value: string) => {
    setMessages(prev => ({
      ...prev,
      [locale]: {
        ...prev[locale],
        [field]: value,
      },
    }));
  };

  const handleSendMessage = async () => {
    // Validation - ქართული სავალდებულოა
    if (!messages.ka.subject.trim()) {
      toast.error('გთხოვთ შეიყვანოთ თემა ქართულად');
      return;
    }

    if (!messages.ka.content.trim() || messages.ka.content === '<p></p>') {
      toast.error('გთხოვთ შეიყვანოთ შეტყობინების ტექსტი ქართულად');
      return;
    }

    if (recipientType === 'USER' && !specificUserId.trim()) {
      toast.error('გთხოვთ შეიყვანოთ მომხმარებლის ID');
      return;
    }

    setSending(true);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('არ ხართ ავტორიზებული');

      // Insert message with all locales
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_type: recipientType,
          recipient_role: recipientType === 'ROLE' ? recipientRole : null,
          subject_ka: messages.ka.subject,
          subject_en: messages.en.subject || null,
          subject_ru: messages.ru.subject || null,
          subject_ar: messages.ar.subject || null,
          subject_de: messages.de.subject || null,
          subject_tr: messages.tr.subject || null,
          content_ka: messages.ka.content,
          content_en: messages.en.content || null,
          content_ru: messages.ru.content || null,
          content_ar: messages.ar.content || null,
          content_de: messages.de.content || null,
          content_tr: messages.tr.content || null,
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // If specific user, create recipient entry manually
      if (recipientType === 'USER' && specificUserId) {
        const { error: recipientError } = await supabase
          .from('message_recipients')
          .insert({
            message_id: message.id,
            user_id: specificUserId,
          });

        if (recipientError) throw recipientError;
      }

      toast.success('შეტყობინება წარმატებით გაიგზავნა ყველა ენაზე!');
      
      // Reset form
      setMessages({
        ka: { subject: '', content: '' },
        en: { subject: '', content: '' },
        ru: { subject: '', content: '' },
        ar: { subject: '', content: '' },
        de: { subject: '', content: '' },
        tr: { subject: '', content: '' },
      });
      setCurrentLocale('ka');
      setRecipientType('ALL_USERS');
      setRecipientRole('USER');
      setSpecificUserId('');
    } catch (error: any) {
      console.error('Send message error:', error);
      toast.error(error.message || 'შეტყობინების გაგზავნა ვერ მოხერხდა');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-4">
        <h2 className="text-xl font-bold text-foreground">ახალი შეტყობინება</h2>
        <p className="text-xs text-foreground/60 mt-1">გაუგზავნეთ შეტყობინება მომხმარებლებს</p>
      </div>

      {/* Message Form */}
      <div className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-4 space-y-4">
        {/* Language Selector */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground/70">აირჩიეთ ენა</label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(localeLabels) as Locale[]).map((locale) => (
              <button
                key={locale}
                type="button"
                onClick={() => setCurrentLocale(locale)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentLocale === locale
                    ? 'bg-foreground text-background'
                    : 'bg-foreground/5 text-foreground hover:bg-foreground/10'
                }`}
              >
                {localeLabels[locale]}
                {messages[locale].subject && (
                  <span className="ml-1.5 text-xs opacity-70">✓</span>
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-foreground/60">
            ქართული სავალდებულოა. სხვა ენები არჩევითია.
          </p>
        </div>

        {/* Subject */}
        <Input
          label={`თემა (${localeLabels[currentLocale]})`}
          placeholder={`შეიყვანეთ შეტყობინების თემა ${currentLocale === 'ka' ? '' : `- ${currentLocale.toUpperCase()}`}`}
          value={messages[currentLocale].subject}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
            updateMessage(currentLocale, 'subject', e.target.value)
          }
          required={currentLocale === 'ka'}
        />

        {/* Recipient Type Selector */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground/70">ვის გაუგზავნოთ?</label>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => setRecipientType('ALL_USERS')}
              className={`p-3 rounded-lg border text-sm text-left transition-all ${
                recipientType === 'ALL_USERS'
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-transparent border-foreground/10 text-foreground hover:bg-foreground/5'
              }`}
            >
              <div className="font-medium">ყველა მომხმარებელი</div>
              <div className="text-xs opacity-70 mt-1">შეტყობინება მიუვა ყველა რეგისტრირებულ მომხმარებელს</div>
            </button>

            <button
              type="button"
              onClick={() => setRecipientType('ROLE')}
              className={`p-3 rounded-lg border text-sm text-left transition-all ${
                recipientType === 'ROLE'
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-transparent border-foreground/10 text-foreground hover:bg-foreground/5'
              }`}
            >
              <div className="font-medium">როლის მიხედვით</div>
              <div className="text-xs opacity-70 mt-1">შეტყობინება მიუვა კონკრეტული როლის მომხმარებლებს</div>
            </button>

            <button
              type="button"
              onClick={() => setRecipientType('USER')}
              className={`p-3 rounded-lg border text-sm text-left transition-all ${
                recipientType === 'USER'
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-transparent border-foreground/10 text-foreground hover:bg-foreground/5'
              }`}
            >
              <div className="font-medium">კონკრეტული მომხმარებელი</div>
              <div className="text-xs opacity-70 mt-1">შეტყობინება მიუვა მხოლოდ ერთ მომხმარებელს</div>
            </button>
          </div>
        </div>

        {/* Role Selector (if ROLE selected) */}
        {recipientType === 'ROLE' && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground/70">აირჩიეთ როლი</label>
            <select
              value={recipientRole}
              onChange={(e) => setRecipientRole(e.target.value as RecipientRole)}
              className="w-full px-4 py-2 bg-background border border-foreground/20 rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/30"
            >
              <option value="USER">USER - რეგულარული მომხმარებლები</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN - სუპერ ადმინები</option>
            </select>
          </div>
        )}

        {/* Specific User ID (if USER selected) */}
        {recipientType === 'USER' && (
          <div className="space-y-1">
            <Input
              label="მომხმარებლის ID"
              placeholder="შეიყვანეთ მომხმარებლის UUID"
              value={specificUserId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSpecificUserId(e.target.value)}
              required
            />
            <p className="text-xs text-foreground/60">მომხმარებლის უნიკალური იდენტიფიკატორი (UUID)</p>
          </div>
        )}

        {/* Rich Text Editor */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground/70">
            შეტყობინების ტექსტი ({localeLabels[currentLocale]})
          </label>
          <div className="border border-foreground/10 rounded-lg overflow-hidden">
            <RichTextEditor
              value={messages[currentLocale].content}
              onChange={(value) => updateMessage(currentLocale, 'content', value)}
              placeholder={`დაწერეთ შეტყობინება ${currentLocale === 'ka' ? 'ქართულად' : currentLocale.toUpperCase() + '-ზე'}...`}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="primary"
            onClick={handleSendMessage}
            disabled={sending}
            className="flex-1"
          >
            {sending ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                იგზავნება...
              </span>
            ) : (
              'გაგზავნა'
            )}
          </Button>
        </div>
      </div>

      {/* Preview */}
      {messages[currentLocale].content && messages[currentLocale].content !== '<p></p>' && (
        <div className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-foreground">
            გადახედვა ({localeLabels[currentLocale]})
          </h3>
          <div className="bg-foreground/5 rounded-lg p-4">
            <div className="text-sm font-semibold text-foreground mb-2">
              {messages[currentLocale].subject || 'თემა'}
            </div>
            <div 
              className="prose prose-sm dark:prose-invert max-w-none text-foreground/80"
              dangerouslySetInnerHTML={{ __html: messages[currentLocale].content }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
