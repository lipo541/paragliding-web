'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Building2, Clock, CheckCircle, XCircle, EyeOff, Search, Eye, 
  ChevronDown, ChevronUp, X, Send, MessageSquare, Calendar,
  SortAsc, SortDesc, Users, Phone, Hash, RotateCcw, Info, Settings,
  Trash2, AlertTriangle
} from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import CompanyEditForm from './CompanyEditForm';

type CompanyStatus = 'pending' | 'verified' | 'blocked' | 'hidden';
type SortField = 'created_at' | 'name' | 'status';
type SortDirection = 'asc' | 'desc';
type ExpandTab = 'info' | 'seo';

interface Company {
  id: string;
  user_id: string;
  country_id: string | null;
  identification_code: string;
  phone: string;
  email: string | null;
  logo_url: string | null;
  founded_date: string | null;
  status: CompanyStatus;
  created_at: string;
  // Multi-language names
  name_ka: string | null;
  name_en: string | null;
  name_ru: string | null;
  name_ar: string | null;
  name_de: string | null;
  name_tr: string | null;
  // Slugs
  slug_ka: string | null;
  slug_en: string | null;
  slug_ru: string | null;
  slug_ar: string | null;
  slug_de: string | null;
  slug_tr: string | null;
  // SEO titles
  seo_title_ka: string | null;
  seo_title_en: string | null;
  seo_title_ru: string | null;
  seo_title_ar: string | null;
  seo_title_de: string | null;
  seo_title_tr: string | null;
  // SEO descriptions
  seo_description_ka: string | null;
  seo_description_en: string | null;
  seo_description_ru: string | null;
  seo_description_ar: string | null;
  seo_description_de: string | null;
  seo_description_tr: string | null;
  // OG titles
  og_title_ka: string | null;
  og_title_en: string | null;
  og_title_ru: string | null;
  og_title_ar: string | null;
  og_title_de: string | null;
  og_title_tr: string | null;
  // OG descriptions
  og_description_ka: string | null;
  og_description_en: string | null;
  og_description_ru: string | null;
  og_description_ar: string | null;
  og_description_de: string | null;
  og_description_tr: string | null;
  // OG image
  og_image: string | null;
  // Cover image
  cover_image_url: string | null;
  // Location IDs
  location_ids: string[];
  // Descriptions
  description_ka: string | null;
  description_en: string | null;
  description_ru: string | null;
  description_de: string | null;
  description_tr: string | null;
  description_ar: string | null;
  profiles?: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  };
}

const statusConfig = {
  pending: {
    label: 'მოლოდინში',
    icon: Clock,
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
  },
  verified: {
    label: 'დადასტურებული',
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
  },
  blocked: {
    label: 'დაბლოკილი',
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
  },
  hidden: {
    label: 'დამალული',
    icon: EyeOff,
    color: 'text-foreground/60',
    bg: 'bg-foreground/5',
    border: 'border-foreground/20',
  },
};

// Personal message templates
const defaultPersonalMessage = {
  subject_ka: '',
  subject_en: '',
  subject_ru: '',
  subject_de: '',
  subject_tr: '',
  subject_ar: '',
  content_ka: '',
  content_en: '',
  content_ru: '',
  content_de: '',
  content_tr: '',
  content_ar: '',
};

export default function CompaniesManager() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CompanyStatus | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Expanded state
  const [expandedCompanyId, setExpandedCompanyId] = useState<string | null>(null);
  const [activeExpandTab, setActiveExpandTab] = useState<ExpandTab>('info');
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  
  // Status update
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  
  // Verification modal
  const [verifyModal, setVerifyModal] = useState<{ companyId: string; userId: string; companyName: string } | null>(null);
  const [sendingVerification, setSendingVerification] = useState(false);
  
  // Personal message
  const [messageModal, setMessageModal] = useState<{ companyId: string; userId: string; companyName: string } | null>(null);
  const [personalMessage, setPersonalMessage] = useState(defaultPersonalMessage);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageLang, setMessageLang] = useState<'ka' | 'en' | 'ru' | 'de' | 'tr' | 'ar'>('ka');

  // Bulk selection
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());

  // Delete modal
  const [deleteModal, setDeleteModal] = useState<{
    companyId: string;
    userId: string;
    companyName: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  const supabase = createClient();

  // Default verification messages in 6 languages
  const defaultVerificationMessages = {
    subject_ka: 'გილოცავთ! კომპანია ვერიფიცირებულია',
    subject_en: 'Congratulations! Company Verified',
    subject_ru: 'Поздравляем! Компания верифицирована',
    subject_de: 'Herzlichen Glückwunsch! Unternehmen verifiziert',
    subject_tr: 'Tebrikler! Şirket Doğrulandı',
    subject_ar: 'تهانينا! تم التحقق من الشركة',
    content_ka: 'გილოცავთ! თქვენ წარმატებით გაიარეთ ვერიფიკაცია. ახლა თქვენ გაქვთ საშუალება ისარგებლოთ კომპანიის პანელით და მართოთ თქვენი ბიზნესი ჩვენს პლატფორმაზე.',
    content_en: 'Congratulations! You have successfully passed verification. You can now use the company dashboard and manage your business on our platform.',
    content_ru: 'Поздравляем! Вы успешно прошли верификацию. Теперь вы можете использовать панель управления компанией и управлять своим бизнесом на нашей платформе.',
    content_de: 'Herzlichen Glückwunsch! Sie haben die Verifizierung erfolgreich bestanden. Sie können jetzt das Unternehmens-Dashboard nutzen und Ihr Geschäft auf unserer Plattform verwalten.',
    content_tr: 'Tebrikler! Doğrulamayı başarıyla geçtiniz. Artık şirket panelini kullanabilir ve platformumuzda işinizi yönetebilirsiniz.',
    content_ar: 'تهانينا! لقد اجتزت التحقق بنجاح. يمكنك الآن استخدام لوحة تحكم الشركة وإدارة عملك على منصتنا.',
  };

  const [verificationMessages, setVerificationMessages] = useState(defaultVerificationMessages);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (companiesError) throw companiesError;

      const companiesWithProfiles = await Promise.all(
        (companiesData || []).map(async (company: Company) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, phone, email')
            .eq('id', company.user_id)
            .single();

          return {
            ...company,
            profiles: {
              full_name: profileData?.full_name || null,
              phone: profileData?.phone || null,
              email: profileData?.email || null,
            },
          };
        })
      );

      setCompanies(companiesWithProfiles);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCompanyStatus = async (companyId: string, newStatus: CompanyStatus, userId: string) => {
    setUpdatingStatus(companyId);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      const { error: updateError } = await supabase
        .from('companies')
        .update({ status: newStatus })
        .eq('id', companyId);

      if (updateError) throw updateError;

      if (newStatus === 'verified') {
        const { error: roleError } = await supabase
          .from('profiles')
          .update({ role: 'COMPANY' })
          .eq('id', userId);
        if (roleError) console.error('Error updating user role:', roleError);
      }

      if (newStatus === 'blocked' || newStatus === 'pending') {
        const { error: roleError } = await supabase
          .from('profiles')
          .update({ role: 'USER' })
          .eq('id', userId);
        if (roleError) console.error('Error reverting user role:', roleError);
      }

      setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, status: newStatus } : c));
    } catch (error) {
      console.error('Error updating company status:', error);
      alert('შეცდომა სტატუსის განახლებისას');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const sendVerificationMessage = async () => {
    if (!verifyModal) return;
    
    setSendingVerification(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      await updateCompanyStatus(verifyModal.companyId, 'verified', verifyModal.userId);

      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUser.id,
          recipient_type: 'USER',
          ...verificationMessages,
        })
        .select('id')
        .single();

      if (!messageError && messageData) {
        await supabase
          .from('message_recipients')
          .insert({
            message_id: messageData.id,
            user_id: verifyModal.userId,
            is_read: false,
          });
      }

      setVerifyModal(null);
      setVerificationMessages(defaultVerificationMessages);
    } catch (error) {
      console.error('Error sending verification:', error);
      alert('შეცდომა ვერიფიკაციის გაგზავნისას');
    } finally {
      setSendingVerification(false);
    }
  };

  // Delete company completely
  const deleteCompany = async () => {
    if (!deleteModal) return;

    setDeleting(true);
    try {
      const { companyId, userId, companyName } = deleteModal;

      // 1. Update pilots to remove company_id (set to null)
      const { error: pilotsError } = await supabase
        .from('pilots')
        .update({ company_id: null })
        .eq('company_id', companyId);
      if (pilotsError) console.error('Error removing pilots from company:', pilotsError);

      // 2. Delete pilot company requests
      const { error: requestsError } = await supabase
        .from('pilot_company_requests')
        .delete()
        .eq('company_id', companyId);
      if (requestsError) console.error('Error deleting company requests:', requestsError);

      // 3. Delete bookings associated with the company
      const { error: bookingsError } = await supabase
        .from('bookings')
        .delete()
        .eq('company_id', companyId);
      if (bookingsError) console.error('Error deleting bookings:', bookingsError);

      // 4. Finally, delete the company record itself
      const { error: deleteError } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);

      if (deleteError) throw deleteError;

      // 5. Reset user role back to USER
      const { error: roleError } = await supabase
        .from('profiles')
        .update({ role: 'USER' })
        .eq('id', userId);

      if (roleError) console.error('Error resetting user role:', roleError);

      // Remove from local state
      setCompanies((prev) => prev.filter((c) => c.id !== companyId));
      
      // Close modal
      setDeleteModal(null);
      
      alert(`კომპანია "${companyName}" და მასთან დაკავშირებული მონაცემები წარმატებით წაიშალა`);
    } catch (error) {
      console.error('Error deleting company:', error);
      alert('შეცდომა კომპანიის წაშლისას');
    } finally {
      setDeleting(false);
    }
  };

  // Send personal message to company
  const sendPersonalMessage = async () => {
    if (!messageModal) return;
    
    // Check if at least Georgian subject/content is filled
    if (!personalMessage.subject_ka.trim() || !personalMessage.content_ka.trim()) {
      alert('გთხოვთ შეავსოთ ქართული სათაური და შეტყობინება');
      return;
    }
    
    setSendingMessage(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUser.id,
          recipient_type: 'USER',
          ...personalMessage,
        })
        .select('id')
        .single();

      if (messageError) throw messageError;

      if (messageData) {
        await supabase
          .from('message_recipients')
          .insert({
            message_id: messageData.id,
            user_id: messageModal.userId,
            is_read: false,
          });
      }

      setMessageModal(null);
      setPersonalMessage(defaultPersonalMessage);
      alert('შეტყობინება წარმატებით გაიგზავნა');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('შეცდომა შეტყობინების გაგზავნისას');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleStatusChange = async (companyId: string, newStatus: CompanyStatus, userId: string) => {
    if (newStatus === 'verified') {
      const company = companies.find(c => c.id === companyId);
      setVerifyModal({ companyId, userId, companyName: company?.name_ka || company?.name_en || '' });
      return;
    }

    setUpdatingStatus(companyId);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      await updateCompanyStatus(companyId, newStatus, userId);

      const statusMessages = {
        blocked: {
          subject_ka: 'კომპანია დაბლოკილია',
          subject_en: 'Company Blocked',
          content_ka: 'თქვენი კომპანიის რეგისტრაცია დაბლოკილია. დამატებითი ინფორმაციისთვის დაგვიკავშირდით.',
          content_en: 'Your company registration has been blocked. Please contact us for more information.',
        },
        hidden: {
          subject_ka: 'კომპანია დამალულია',
          subject_en: 'Company Hidden',
          content_ka: 'თქვენი კომპანია დროებით დამალულია საიტზე.',
          content_en: 'Your company is temporarily hidden on the site.',
        },
        pending: {
          subject_ka: 'კომპანია განხილვაშია',
          subject_en: 'Company Under Review',
          content_ka: 'თქვენი კომპანიის სტატუსი შეიცვალა და ხელახლა განიხილება.',
          content_en: 'Your company status has changed and is under review again.',
        },
      };

      const msg = statusMessages[newStatus as keyof typeof statusMessages];
      if (msg) {
        const { data: messageData, error: messageError } = await supabase
          .from('messages')
          .insert({
            sender_id: currentUser.id,
            recipient_type: 'USER',
            subject_ka: msg.subject_ka,
            subject_en: msg.subject_en,
            content_ka: msg.content_ka,
            content_en: msg.content_en,
          })
          .select('id')
          .single();

        if (!messageError && messageData) {
          await supabase
            .from('message_recipients')
            .insert({
              message_id: messageData.id,
              user_id: userId,
              is_read: false,
            });
        }
      }
    } catch (error) {
      console.error('Error changing status:', error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Filtered and sorted companies
  const filteredCompanies = useMemo(() => {
    let result = companies.filter((company: Company) => {
      const matchesSearch = 
        (company.name_ka || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (company.name_en || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.identification_code.includes(searchQuery) ||
        company.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.phone.includes(searchQuery) ||
        company.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || company.status === statusFilter;

      // Date filter
      let matchesDate = true;
      if (dateFrom) {
        matchesDate = new Date(company.created_at) >= new Date(dateFrom);
      }
      if (dateTo && matchesDate) {
        matchesDate = new Date(company.created_at) <= new Date(dateTo + 'T23:59:59');
      }

      return matchesSearch && matchesStatus && matchesDate;
    });

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = (a.name_ka || a.name_en || '').localeCompare(b.name_ka || b.name_en || '');
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'created_at':
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [companies, searchQuery, statusFilter, dateFrom, dateTo, sortField, sortDirection]);

  // Status counts
  const statusCounts = useMemo(() => ({
    all: companies.length,
    pending: companies.filter(c => c.status === 'pending').length,
    verified: companies.filter(c => c.status === 'verified').length,
    blocked: companies.filter(c => c.status === 'blocked').length,
    hidden: companies.filter(c => c.status === 'hidden').length,
  }), [companies]);

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setSortField('created_at');
    setSortDirection('desc');
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Bulk actions
  const toggleSelectCompany = (id: string) => {
    const newSet = new Set(selectedCompanies);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedCompanies(newSet);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const langConfig = [
    { code: 'ka' as const, flag: '🇬🇪', name: 'ქართული' },
    { code: 'en' as const, flag: '🇬🇧', name: 'English' },
    { code: 'ru' as const, flag: '🇷🇺', name: 'Русский' },
    { code: 'de' as const, flag: '🇩🇪', name: 'Deutsch' },
    { code: 'tr' as const, flag: '🇹🇷', name: 'Türkçe' },
    { code: 'ar' as const, flag: '🇸🇦', name: 'العربية' },
  ];

  return (
    <div className="space-y-4">
      {/* Verification Modal */}
      {verifyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-foreground/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-green-500/10">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">კომპანიის ვერიფიკაცია</h3>
                  <p className="text-xs text-foreground/60">{verifyModal.companyName}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setVerifyModal(null);
                  setVerificationMessages(defaultVerificationMessages);
                }}
                className="p-1.5 hover:bg-foreground/5 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-foreground/60" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[60vh] space-y-3">
              <p className="text-xs text-foreground/60">
                შეტყობინება გაეგზავნება მომხმარებელს 6 ენაზე.
              </p>

              {langConfig.map((lang) => (
                <div key={lang.code} className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <span>{lang.flag}</span> {lang.name}
                  </label>
                  <input
                    type="text"
                    value={verificationMessages[`subject_${lang.code}` as keyof typeof verificationMessages]}
                    onChange={(e) => setVerificationMessages(prev => ({ ...prev, [`subject_${lang.code}`]: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-foreground/5 border border-foreground/10 rounded-lg text-foreground text-xs"
                    placeholder="სათაური"
                    dir={lang.code === 'ar' ? 'rtl' : 'ltr'}
                  />
                  <textarea
                    value={verificationMessages[`content_${lang.code}` as keyof typeof verificationMessages]}
                    onChange={(e) => setVerificationMessages(prev => ({ ...prev, [`content_${lang.code}`]: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-foreground/5 border border-foreground/10 rounded-lg text-foreground text-xs resize-none"
                    rows={2}
                    placeholder="შეტყობინება"
                    dir={lang.code === 'ar' ? 'rtl' : 'ltr'}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-foreground/10 bg-foreground/5">
              <button
                onClick={() => {
                  setVerifyModal(null);
                  setVerificationMessages(defaultVerificationMessages);
                }}
                disabled={sendingVerification}
                className="px-3 py-1.5 text-xs font-medium text-foreground/70 hover:bg-foreground/5 rounded-lg transition-colors"
              >
                გაუქმება
              </button>
              <button
                onClick={sendVerificationMessage}
                disabled={sendingVerification}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                {sendingVerification ? <Spinner size="sm" /> : <Send className="w-3.5 h-3.5" />}
                დადასტურება
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Personal Message Modal */}
      {messageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-foreground/10 rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">პერსონალური შეტყობინება</h3>
                  <p className="text-xs text-foreground/60">{messageModal.companyName}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMessageModal(null);
                  setPersonalMessage(defaultPersonalMessage);
                }}
                className="p-1.5 hover:bg-foreground/5 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-foreground/60" />
              </button>
            </div>

            {/* Language tabs */}
            <div className="px-4 pt-3 flex gap-1 overflow-x-auto">
              {langConfig.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setMessageLang(lang.code)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    messageLang === lang.code
                      ? 'bg-foreground text-background'
                      : 'bg-foreground/5 text-foreground/70 hover:bg-foreground/10'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span className="hidden sm:inline">{lang.name}</span>
                  {personalMessage[`subject_${lang.code}` as keyof typeof personalMessage] && (
                    <span className="text-[10px] opacity-70">✓</span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-foreground/70 mb-1">სათაური</label>
                <input
                  type="text"
                  value={personalMessage[`subject_${messageLang}` as keyof typeof personalMessage]}
                  onChange={(e) => setPersonalMessage(prev => ({ ...prev, [`subject_${messageLang}`]: e.target.value }))}
                  className="w-full px-3 py-2 bg-foreground/5 border border-foreground/10 rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  placeholder={`სათაური (${langConfig.find(l => l.code === messageLang)?.name})`}
                  dir={messageLang === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground/70 mb-1">შეტყობინება</label>
                <textarea
                  value={personalMessage[`content_${messageLang}` as keyof typeof personalMessage]}
                  onChange={(e) => setPersonalMessage(prev => ({ ...prev, [`content_${messageLang}`]: e.target.value }))}
                  className="w-full px-3 py-2 bg-foreground/5 border border-foreground/10 rounded-lg text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  rows={4}
                  placeholder={`შეტყობინება (${langConfig.find(l => l.code === messageLang)?.name})`}
                  dir={messageLang === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-foreground/10 bg-foreground/5">
              <button
                onClick={() => {
                  setMessageModal(null);
                  setPersonalMessage(defaultPersonalMessage);
                }}
                disabled={sendingMessage}
                className="px-3 py-1.5 text-xs font-medium text-foreground/70 hover:bg-foreground/5 rounded-lg transition-colors"
              >
                გაუქმება
              </button>
              <button
                onClick={sendPersonalMessage}
                disabled={sendingMessage || (!personalMessage.subject_ka.trim() || !personalMessage.content_ka.trim())}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition-colors"
              >
                {sendingMessage ? <Spinner size="sm" /> : <Send className="w-3.5 h-3.5" />}
                გაგზავნა
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header with Stats */}
      <div className="bg-foreground/5 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              კომპანიების მართვა
            </h2>
            <p className="text-xs text-foreground/60 mt-0.5">
              სულ {companies.length} კომპანია • ნაჩვენებია {filteredCompanies.length}
            </p>
          </div>
          
          {/* Status badges */}
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(statusConfig) as CompanyStatus[]).map((status) => {
              const config = statusConfig[status];
              const count = statusCounts[status];
              const isActive = statusFilter === status;
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(isActive ? 'all' : status)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                    isActive 
                      ? `${config.bg} ${config.color} ${config.border} border` 
                      : 'bg-foreground/5 text-foreground/60 hover:bg-foreground/10'
                  }`}
                >
                  <config.icon className="w-3 h-3" />
                  <span>{config.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-foreground/10' : 'bg-foreground/5'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col lg:flex-row gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <input
              type="text"
              placeholder="ძებნა..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-background border border-foreground/10 rounded-lg text-foreground text-sm placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>

          {/* Date filters */}
          <div className="flex gap-2">
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="pl-8 pr-2 py-2 bg-background border border-foreground/10 rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                title="თარიღიდან"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="pl-8 pr-2 py-2 bg-background border border-foreground/10 rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                title="თარიღამდე"
              />
            </div>
          </div>

          {/* Sort buttons */}
          <div className="flex gap-1">
            <button
              onClick={() => toggleSort('created_at')}
              className={`flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                sortField === 'created_at' ? 'bg-foreground text-background' : 'bg-background border border-foreground/10 text-foreground/70 hover:bg-foreground/5'
              }`}
              title="დალაგება თარიღით"
            >
              <Calendar className="w-3.5 h-3.5" />
              {sortField === 'created_at' && (sortDirection === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />)}
            </button>
            <button
              onClick={() => toggleSort('name')}
              className={`flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                sortField === 'name' ? 'bg-foreground text-background' : 'bg-background border border-foreground/10 text-foreground/70 hover:bg-foreground/5'
              }`}
              title="დალაგება სახელით"
            >
              <Hash className="w-3.5 h-3.5" />
              {sortField === 'name' && (sortDirection === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />)}
            </button>
            {(searchQuery || statusFilter !== 'all' || dateFrom || dateTo) && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 px-2.5 py-2 bg-red-500/10 text-red-600 rounded-lg text-xs font-medium hover:bg-red-500/20 transition-colors"
                title="ფილტრების გასუფთავება"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Selection Bar */}
      {selectedCompanies.size > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-2 flex items-center justify-between">
          <span className="text-sm text-blue-600 dark:text-blue-400">
            მონიშნულია {selectedCompanies.size} კომპანია
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCompanies(new Set())}
              className="px-3 py-1 text-xs text-foreground/70 hover:bg-foreground/5 rounded-lg transition-colors"
            >
              გაუქმება
            </button>
          </div>
        </div>
      )}

      {/* Companies List */}
      <div className="space-y-2">
        {filteredCompanies.length === 0 ? (
          <div className="text-center py-12 bg-foreground/5 rounded-xl">
            <Building2 className="w-10 h-10 mx-auto mb-2 text-foreground/20" />
            <p className="text-sm text-foreground/60">კომპანიები ვერ მოიძებნა</p>
            {(searchQuery || statusFilter !== 'all' || dateFrom || dateTo) && (
              <button
                onClick={resetFilters}
                className="mt-2 text-xs text-blue-600 hover:underline"
              >
                ფილტრების გასუფთავება
              </button>
            )}
          </div>
        ) : (
          filteredCompanies.map((company) => {
            const status = statusConfig[company.status];
            const StatusIcon = status.icon;
            const isExpanded = expandedCompanyId === company.id;
            const isSelected = selectedCompanies.has(company.id);

            return (
              <div 
                key={company.id} 
                className={`bg-background border rounded-xl overflow-hidden transition-all ${
                  isSelected ? 'border-blue-500/50 ring-1 ring-blue-500/20' : 'border-foreground/10'
                }`}
              >
                {/* Company Row - Compact */}
                <div className="flex items-center gap-3 p-3">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectCompany(company.id)}
                    className="w-4 h-4 rounded border-foreground/20 text-blue-600 focus:ring-blue-500/20"
                  />

                  {/* Logo - Smaller */}
                  <button
                    onClick={() => setExpandedCompanyId(isExpanded ? null : company.id)}
                    className="flex-shrink-0"
                  >
                    {company.logo_url ? (
                      <img
                        src={company.logo_url}
                        alt={company.name_ka || company.name_en || 'Company'}
                        className="w-10 h-10 rounded-lg object-cover border border-foreground/10"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-foreground/5 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-foreground/30" />
                      </div>
                    )}
                  </button>

                  {/* Info - Click to expand */}
                  <button
                    onClick={() => setExpandedCompanyId(isExpanded ? null : company.id)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {company.name_ka || company.name_en || 'უსახელო'}
                      </h3>
                      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full ${status.bg} border ${status.border}`}>
                        <StatusIcon className={`w-3 h-3 ${status.color}`} />
                        <span className={`text-[10px] font-medium ${status.color}`}>{status.label}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-foreground/50">
                      <span className="flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {company.identification_code}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {company.phone}
                      </span>
                      <span className="hidden sm:flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(company.created_at).toLocaleDateString('ka-GE')}
                      </span>
                    </div>
                  </button>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-1">
                    {company.status !== 'verified' && (
                      <button
                        onClick={() => handleStatusChange(company.id, 'verified', company.user_id)}
                        disabled={updatingStatus === company.id}
                        className="p-1.5 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
                        title="დადასტურება"
                      >
                        {updatingStatus === company.id ? <Spinner size="sm" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                    )}
                    {company.status !== 'blocked' && (
                      <button
                        onClick={() => handleStatusChange(company.id, 'blocked', company.user_id)}
                        disabled={updatingStatus === company.id}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors"
                        title="დაბლოკვა"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setMessageModal({ 
                          companyId: company.id, 
                          userId: company.user_id, 
                          companyName: company.name_ka || company.name_en || '' 
                        });
                      }}
                      className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors"
                      title="შეტყობინების გაგზავნა"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setExpandedCompanyId(isExpanded ? null : company.id)}
                      className="p-1.5 rounded-lg bg-foreground/5 text-foreground/60 hover:bg-foreground/10 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Section */}
                {isExpanded && (
                  <div className="border-t border-foreground/10 animate-fadeIn">
                    {/* Tabs */}
                    <div className="flex gap-1 px-3 pt-3">
                      <button
                        onClick={() => setActiveExpandTab('info')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          activeExpandTab === 'info'
                            ? 'bg-foreground text-background'
                            : 'bg-foreground/5 text-foreground/60 hover:bg-foreground/10'
                        }`}
                      >
                        <Info className="w-3.5 h-3.5" />
                        ინფორმაცია
                      </button>
                      <button
                        onClick={() => {
                          setActiveExpandTab('seo');
                          setEditingCompanyId(company.id);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          activeExpandTab === 'seo'
                            ? 'bg-foreground text-background'
                            : 'bg-foreground/5 text-foreground/60 hover:bg-foreground/10'
                        }`}
                      >
                        <Settings className="w-3.5 h-3.5" />
                        SEO / რედაქტირება
                      </button>
                    </div>

                    <div className="p-3">
                      {/* Info Tab */}
                      {activeExpandTab === 'info' && (
                        <div className="space-y-3">
                          {/* Owner & Company Info - Two columns */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Owner Info */}
                            <div className="bg-foreground/5 rounded-lg p-3">
                              <p className="text-xs font-medium text-foreground/60 mb-2 flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                მფლობელი
                              </p>
                              <div className="space-y-1 text-xs">
                                <p className="flex items-center gap-2">
                                  <span className="text-foreground/50 w-16">სახელი:</span>
                                  <span className="text-foreground font-medium">{company.profiles?.full_name || '-'}</span>
                                </p>
                                <p className="flex items-center gap-2">
                                  <span className="text-foreground/50 w-16">ტელეფონი:</span>
                                  <span className="text-foreground">{company.profiles?.phone || '-'}</span>
                                </p>
                                <p className="flex items-center gap-2">
                                  <span className="text-foreground/50 w-16">ელ.ფოსტა:</span>
                                  <span className="text-foreground">{company.profiles?.email || '-'}</span>
                                </p>
                              </div>
                            </div>

                            {/* Company Details */}
                            <div className="bg-foreground/5 rounded-lg p-3">
                              <p className="text-xs font-medium text-foreground/60 mb-2 flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                კომპანია
                              </p>
                              <div className="space-y-1 text-xs">
                                <p className="flex items-center gap-2">
                                  <span className="text-foreground/50 w-16">ელ.ფოსტა:</span>
                                  <span className="text-foreground">{company.email || '-'}</span>
                                </p>
                                <p className="flex items-center gap-2">
                                  <span className="text-foreground/50 w-16">დაარსება:</span>
                                  <span className="text-foreground">
                                    {company.founded_date ? new Date(company.founded_date).toLocaleDateString('ka-GE') : '-'}
                                  </span>
                                </p>
                                <p className="flex items-center gap-2">
                                  <span className="text-foreground/50 w-16">რეგისტ.:</span>
                                  <span className="text-foreground">{new Date(company.created_at).toLocaleDateString('ka-GE')}</span>
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Descriptions */}
                          {(company.description_ka || company.description_en || company.description_ru) && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-foreground/60">აღწერა</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {company.description_ka && (
                                  <div className="bg-foreground/5 rounded-lg p-2">
                                    <p className="text-[10px] text-foreground/40 mb-1">🇬🇪</p>
                                    <p className="text-xs text-foreground line-clamp-3">{company.description_ka}</p>
                                  </div>
                                )}
                                {company.description_en && (
                                  <div className="bg-foreground/5 rounded-lg p-2">
                                    <p className="text-[10px] text-foreground/40 mb-1">🇬🇧</p>
                                    <p className="text-xs text-foreground line-clamp-3">{company.description_en}</p>
                                  </div>
                                )}
                                {company.description_ru && (
                                  <div className="bg-foreground/5 rounded-lg p-2">
                                    <p className="text-[10px] text-foreground/40 mb-1">🇷🇺</p>
                                    <p className="text-xs text-foreground line-clamp-3">{company.description_ru}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Status Actions */}
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-foreground/10">
                            {company.status !== 'verified' && (
                              <button
                                onClick={() => handleStatusChange(company.id, 'verified', company.user_id)}
                                disabled={updatingStatus === company.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors"
                              >
                                {updatingStatus === company.id ? <Spinner size="sm" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                დადასტურება
                              </button>
                            )}
                            {company.status !== 'blocked' && (
                              <button
                                onClick={() => handleStatusChange(company.id, 'blocked', company.user_id)}
                                disabled={updatingStatus === company.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded-lg text-xs font-medium transition-colors"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                დაბლოკვა
                              </button>
                            )}
                            {company.status === 'verified' && (
                              <button
                                onClick={() => handleStatusChange(company.id, 'hidden', company.user_id)}
                                disabled={updatingStatus === company.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground/5 text-foreground/70 hover:bg-foreground/10 rounded-lg text-xs font-medium transition-colors"
                              >
                                <EyeOff className="w-3.5 h-3.5" />
                                დამალვა
                              </button>
                            )}
                            {company.status === 'hidden' && (
                              <button
                                onClick={() => handleStatusChange(company.id, 'verified', company.user_id)}
                                disabled={updatingStatus === company.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground/5 text-foreground/70 hover:bg-foreground/10 rounded-lg text-xs font-medium transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                გამოჩენა
                              </button>
                            )}
                            {company.status === 'blocked' && (
                              <button
                                onClick={() => handleStatusChange(company.id, 'pending', company.user_id)}
                                disabled={updatingStatus === company.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 rounded-lg text-xs font-medium transition-colors"
                              >
                                <Clock className="w-3.5 h-3.5" />
                                განხილვაში დაბრუნება
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setMessageModal({ 
                                  companyId: company.id, 
                                  userId: company.user_id, 
                                  companyName: company.name_ka || company.name_en || '' 
                                });
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 rounded-lg text-xs font-medium transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              შეტყობინება
                            </button>
                            {/* Delete Button */}
                            <button
                              onClick={() =>
                                setDeleteModal({
                                  companyId: company.id,
                                  userId: company.user_id,
                                  companyName: company.name_ka || company.name_en || 'კომპანია',
                                })
                              }
                              disabled={updatingStatus === company.id || deleting}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/10 text-red-700 hover:bg-red-600/20 rounded-lg text-xs font-medium transition-colors border border-red-600/30 dark:text-red-500 ml-auto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              წაშლა
                            </button>
                          </div>
                        </div>
                      )}

                      {/* SEO Tab */}
                      {activeExpandTab === 'seo' && editingCompanyId === company.id && (
                        <CompanyEditForm
                          company={company as any}
                          onCancel={() => {
                            setEditingCompanyId(null);
                            setActiveExpandTab('info');
                          }}
                          onSave={(updatedCompany: any) => {
                            setCompanies(prev => 
                              prev.map(c => c.id === updatedCompany.id ? { ...c, ...updatedCompany, status: c.status } as Company : c)
                            );
                            setEditingCompanyId(null);
                            setActiveExpandTab('info');
                          }}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-red-500/30 bg-background p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
                  კომპანიის წაშლა
                </h3>
                <p className="text-sm text-foreground/60">
                  ეს მოქმედება შეუქცევადია
                </p>
              </div>
            </div>

            <div className="mb-6 rounded-lg bg-red-500/10 p-4">
              <p className="text-sm text-foreground/80">
                ნამდვილად გსურთ კომპანიის <strong>&quot;{deleteModal.companyName}&quot;</strong> წაშლა?
              </p>
              <ul className="mt-3 space-y-1 text-xs text-foreground/60">
                <li>• კომპანიის პროფილი და ინფორმაცია</li>
                <li>• კომპანიის პილოტები გახდებიან დამოუკიდებელი</li>
                <li>• პილოტების მოთხოვნები კომპანიაში</li>
                <li>• კომპანიის ყველა ჯავშანი</li>
              </ul>
              <p className="mt-3 text-xs font-medium text-red-600 dark:text-red-400">
                ⚠️ ეს მოქმედება შეუქცევადია!
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                disabled={deleting}
                className="flex-1 rounded-lg border border-foreground/20 px-4 py-2.5 text-sm font-medium text-foreground/70 hover:bg-foreground/5 disabled:opacity-50"
              >
                გაუქმება
              </button>
              <button
                onClick={deleteCompany}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Spinner size="sm" />
                    იშლება...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    წაშლა
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
