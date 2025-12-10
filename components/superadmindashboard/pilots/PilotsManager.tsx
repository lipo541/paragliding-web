'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  User,
  Clock,
  CheckCircle,
  XCircle,
  EyeOff,
  Search,
  Eye,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  MessageSquare,
  Calendar,
  SortAsc,
  SortDesc,
  Users,
  Phone,
  Hash,
  RotateCcw,
  Info,
  Settings,
  Award,
  Plane,
  Building2,
  Mail,
  FileText,
  Edit,
  FileCheck,
} from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import Image from 'next/image';
import PilotEditForm from './PilotEditForm';

type PilotStatus = 'pending' | 'verified' | 'blocked' | 'hidden';
type SortField = 'created_at' | 'name' | 'status' | 'tandem_flights';
type SortDirection = 'asc' | 'desc';
type ExpandTab = 'info' | 'equipment' | 'seo';

interface Pilot {
  id: string;
  user_id: string;
  company_id: string | null;
  status: PilotStatus;
  // Slugs (multi-language)
  slug: string | null;
  slug_ka: string | null;
  slug_en: string | null;
  slug_ru: string | null;
  slug_ar: string | null;
  slug_de: string | null;
  slug_tr: string | null;
  // Personal info
  first_name_ka: string | null;
  first_name_ru: string | null;
  first_name_de: string | null;
  first_name_tr: string | null;
  first_name_ar: string | null;
  last_name_ka: string | null;
  last_name_ru: string | null;
  last_name_de: string | null;
  last_name_tr: string | null;
  last_name_ar: string | null;
  phone: string;
  email: string;
  birth_date: string | null;
  gender: 'male' | 'female' | 'other' | null;
  avatar_url: string | null;
  // Verification Documents
  verification_documents: string[];
  commercial_start_date: string | null;
  // Experience
  total_flights: number | null;
  tandem_flights: number | null;
  // Equipment - Wing
  wing_brand: string | null;
  wing_model: string | null;
  wing_certificate_url: string | null;
  // Equipment - Pilot Harness
  pilot_harness_brand: string | null;
  pilot_harness_model: string | null;
  pilot_harness_certificate_url: string | null;
  // Equipment - Passenger Harness
  passenger_harness_brand: string | null;
  passenger_harness_model: string | null;
  passenger_harness_certificate_url: string | null;
  // Equipment - Reserve
  reserve_brand: string | null;
  reserve_model: string | null;
  reserve_certificate_url: string | null;
  // Bio
  bio_ka: string | null;
  bio_en: string | null;
  bio_ru: string | null;
  bio_de: string | null;
  bio_tr: string | null;
  bio_ar: string | null;
  // SEO Titles (multi-language)
  seo_title_ka: string | null;
  seo_title_en: string | null;
  seo_title_ru: string | null;
  seo_title_ar: string | null;
  seo_title_de: string | null;
  seo_title_tr: string | null;
  // SEO Descriptions (multi-language)
  seo_description_ka: string | null;
  seo_description_en: string | null;
  seo_description_ru: string | null;
  seo_description_ar: string | null;
  seo_description_de: string | null;
  seo_description_tr: string | null;
  // OG Titles (multi-language)
  og_title_ka: string | null;
  og_title_en: string | null;
  og_title_ru: string | null;
  og_title_ar: string | null;
  og_title_de: string | null;
  og_title_tr: string | null;
  // OG Descriptions (multi-language)
  og_description_ka: string | null;
  og_description_en: string | null;
  og_description_ru: string | null;
  og_description_ar: string | null;
  og_description_de: string | null;
  og_description_tr: string | null;
  // OG Image (shared)
  og_image: string | null;
  // Timestamps
  created_at: string;
  updated_at: string;
  // Relations
  profiles?: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  };
  companies?: {
    name_ka: string | null;
    name_en: string | null;
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

export default function PilotsManager() {
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PilotStatus | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Expanded state
  const [expandedPilotId, setExpandedPilotId] = useState<string | null>(null);
  const [activeExpandTab, setActiveExpandTab] = useState<ExpandTab>('info');
  const [editingPilotId, setEditingPilotId] = useState<string | null>(null);

  // Status update
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Verification modal
  const [verifyModal, setVerifyModal] = useState<{
    pilotId: string;
    userId: string;
    pilotName: string;
  } | null>(null);
  const [sendingVerification, setSendingVerification] = useState(false);

  // Personal message
  const [messageModal, setMessageModal] = useState<{
    pilotId: string;
    userId: string;
    pilotName: string;
  } | null>(null);
  const [personalMessage, setPersonalMessage] = useState(defaultPersonalMessage);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageLang, setMessageLang] = useState<'ka' | 'en' | 'ru' | 'de' | 'tr' | 'ar'>('ka');

  // Bulk selection
  const [selectedPilots, setSelectedPilots] = useState<Set<string>>(new Set());

  const supabase = createClient();

  // Default verification messages in 6 languages
  const defaultVerificationMessages = {
    subject_ka: 'გილოცავთ! პილოტის პროფილი ვერიფიცირებულია',
    subject_en: 'Congratulations! Pilot Profile Verified',
    subject_ru: 'Поздравляем! Профиль пилота верифицирован',
    subject_de: 'Herzlichen Glückwunsch! Pilotenprofil verifiziert',
    subject_tr: 'Tebrikler! Pilot Profili Doğrulandı',
    subject_ar: 'تهانينا! تم التحقق من ملف الطيار',
    content_ka:
      'გილოცავთ! თქვენი პილოტის პროფილი წარმატებით გავლილია ვერიფიკაცია. ახლა თქვენ შეგიძლიათ მიიღოთ ჯავშნები და მართოთ თქვენი პროფილი.',
    content_en:
      'Congratulations! Your pilot profile has been successfully verified. You can now receive bookings and manage your profile.',
    content_ru:
      'Поздравляем! Ваш профиль пилота успешно верифицирован. Теперь вы можете принимать бронирования и управлять своим профилем.',
    content_de:
      'Herzlichen Glückwunsch! Ihr Pilotenprofil wurde erfolgreich verifiziert. Sie können jetzt Buchungen erhalten und Ihr Profil verwalten.',
    content_tr:
      'Tebrikler! Pilot profiliniz başarıyla doğrulandı. Artık rezervasyon alabilir ve profilinizi yönetebilirsiniz.',
    content_ar:
      'تهانينا! تم التحقق من ملف تعريف الطيار الخاص بك بنجاح. يمكنك الآن تلقي الحجوزات وإدارة ملفك الشخصي.',
  };

  const [verificationMessages, setVerificationMessages] = useState(defaultVerificationMessages);

  useEffect(() => {
    fetchPilots();
  }, []);

  const fetchPilots = async () => {
    setLoading(true);
    try {
      const { data: pilotsData, error: pilotsError } = await supabase
        .from('pilots')
        .select('*')
        .order('created_at', { ascending: false });

      if (pilotsError) throw pilotsError;

      const pilotsWithRelations = await Promise.all(
        (pilotsData || []).map(async (pilot: Pilot) => {
          // Get profile data
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, phone, email')
            .eq('id', pilot.user_id)
            .single();

          // Get company data if pilot has company
          let companyData = null;
          if (pilot.company_id) {
            const { data: company } = await supabase
              .from('companies')
              .select('name_ka, name_en')
              .eq('id', pilot.company_id)
              .single();
            companyData = company;
          }

          return {
            ...pilot,
            profiles: {
              full_name: profileData?.full_name || null,
              phone: profileData?.phone || null,
              email: profileData?.email || null,
            },
            companies: companyData,
          };
        })
      );

      setPilots(pilotsWithRelations);
    } catch (error) {
      console.error('Error fetching pilots:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePilotStatus = async (pilotId: string, newStatus: PilotStatus, userId: string) => {
    setUpdatingStatus(pilotId);
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      const { error: updateError } = await supabase
        .from('pilots')
        .update({ status: newStatus })
        .eq('id', pilotId);

      if (updateError) throw updateError;

      // Update user role based on status
      if (newStatus === 'verified') {
        const { error: roleError } = await supabase
          .from('profiles')
          .update({ role: 'TANDEM_PILOT' })
          .eq('id', userId);
        if (roleError) console.error('Error updating user role:', roleError);
      }

      if (newStatus === 'blocked' || newStatus === 'pending') {
        // Check if user has company role - don't downgrade if they are a company
        const { data: companyCheck } = await supabase
          .from('companies')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'verified')
          .single();

        if (!companyCheck) {
          const { error: roleError } = await supabase
            .from('profiles')
            .update({ role: 'USER' })
            .eq('id', userId);
          if (roleError) console.error('Error reverting user role:', roleError);
        }
      }

      setPilots((prev) => prev.map((p) => (p.id === pilotId ? { ...p, status: newStatus } : p)));
    } catch (error) {
      console.error('Error updating pilot status:', error);
      alert('შეცდომა სტატუსის განახლებისას');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const sendVerificationMessage = async () => {
    if (!verifyModal) return;

    setSendingVerification(true);
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      await updatePilotStatus(verifyModal.pilotId, 'verified', verifyModal.userId);

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
        await supabase.from('message_recipients').insert({
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

  // Send personal message to pilot
  const sendPersonalMessage = async () => {
    if (!messageModal) return;

    if (!personalMessage.subject_ka.trim() || !personalMessage.content_ka.trim()) {
      alert('გთხოვთ შეავსოთ ქართული სათაური და შეტყობინება');
      return;
    }

    setSendingMessage(true);
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
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
        await supabase.from('message_recipients').insert({
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

  // Filter and sort pilots
  const filteredAndSortedPilots = useMemo(() => {
    let result = [...pilots];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((pilot) => {
        const searchableFields = [
          pilot.first_name_ka,
          pilot.last_name_ka,
          pilot.phone,
          pilot.email,
          pilot.profiles?.full_name,
          pilot.companies?.name_ka,
          pilot.companies?.name_en,
        ];
        return searchableFields.some((field) => field?.toLowerCase().includes(query));
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((pilot) => pilot.status === statusFilter);
    }

    // Date range filter
    if (dateFrom) {
      result = result.filter((pilot) => new Date(pilot.created_at) >= new Date(dateFrom));
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter((pilot) => new Date(pilot.created_at) <= toDate);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'name':
          const nameA = (a.first_name_ka || '').toLowerCase();
          const nameB = (b.first_name_ka || '').toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'tandem_flights':
          comparison = (a.tandem_flights || 0) - (b.tandem_flights || 0);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [pilots, searchQuery, statusFilter, dateFrom, dateTo, sortField, sortDirection]);

  // Status counts
  const statusCounts = useMemo(() => {
    return {
      all: pilots.length,
      pending: pilots.filter((p) => p.status === 'pending').length,
      verified: pilots.filter((p) => p.status === 'verified').length,
      blocked: pilots.filter((p) => p.status === 'blocked').length,
      hidden: pilots.filter((p) => p.status === 'hidden').length,
    };
  }, [pilots]);

  const toggleExpand = (pilotId: string) => {
    if (expandedPilotId === pilotId) {
      setExpandedPilotId(null);
    } else {
      setExpandedPilotId(pilotId);
      setActiveExpandTab('info');
      setEditingPilotId(null);
    }
  };

  const toggleSelectPilot = (pilotId: string) => {
    setSelectedPilots((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(pilotId)) {
        newSet.delete(pilotId);
      } else {
        newSet.add(pilotId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedPilots.size === filteredAndSortedPilots.length) {
      setSelectedPilots(new Set());
    } else {
      setSelectedPilots(new Set(filteredAndSortedPilots.map((p) => p.id)));
    }
  };

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
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getPilotDisplayName = (pilot: Pilot) => {
    const firstName = pilot.first_name_ka || '';
    const lastName = pilot.last_name_ka || '';
    return `${firstName} ${lastName}`.trim() || 'უცნობი';
  };

  // Equipment renderer
  const renderEquipment = (
    brand: string | null,
    model: string | null,
    certificateUrl: string | null
  ) => {
    if (!brand && !model && !certificateUrl) return <span className="text-foreground/40">-</span>;
    return (
      <div className="space-y-1 text-sm">
        {(brand || model) && (
          <div>
            {brand && <span className="font-medium">{brand}</span>}
            {brand && model && <span className="text-foreground/60"> - </span>}
            {model && <span>{model}</span>}
          </div>
        )}
        {certificateUrl && (
          <div className="mt-2">
            <a
              href={certificateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-600 hover:underline"
            >
              <FileCheck className="h-3.5 w-3.5" />
              დოკუმენტის ნახვა
            </a>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with status badges */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            statusFilter === 'all'
              ? 'bg-foreground text-background'
              : 'bg-foreground/5 hover:bg-foreground/10 text-foreground'
          }`}
        >
          <Users className="h-4 w-4" />
          ყველა ({statusCounts.all})
        </button>
        {(['pending', 'verified', 'blocked', 'hidden'] as const).map((status) => {
          const config = statusConfig[status];
          const StatusIcon = config.icon;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === status
                  ? `${config.bg} ${config.color} border ${config.border}`
                  : 'bg-foreground/5 hover:bg-foreground/10 text-foreground'
              }`}
            >
              <StatusIcon className="h-4 w-4" />
              {config.label} ({statusCounts[status]})
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-foreground/10 bg-foreground/5 p-4">
        <div className="grid gap-3 md:grid-cols-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ძიება..."
              className="w-full rounded-lg border border-foreground/10 bg-foreground/5 py-2 pl-9 pr-3 text-sm placeholder:text-foreground/40 focus:border-foreground/30 focus:outline-none"
            />
          </div>

          {/* Date From */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-lg border border-foreground/10 bg-foreground/5 py-2 pl-9 pr-3 text-sm focus:border-foreground/30 focus:outline-none"
            />
          </div>

          {/* Date To */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-lg border border-foreground/10 bg-foreground/5 py-2 pl-9 pr-3 text-sm focus:border-foreground/30 focus:outline-none"
            />
          </div>

          {/* Reset & Sort */}
          <div className="flex gap-2">
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 rounded-lg border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm hover:bg-foreground/10"
            >
              <RotateCcw className="h-4 w-4" />
              ფილტრის გასუფთავება
            </button>
            <button
              onClick={() => toggleSort(sortField)}
              className="flex items-center gap-1.5 rounded-lg border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm hover:bg-foreground/10"
            >
              {sortDirection === 'asc' ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Sort options */}
        <div className="mt-3 flex gap-2">
          <span className="text-sm text-foreground/60">დალაგება:</span>
          {[
            { field: 'created_at' as SortField, label: 'თარიღი' },
            { field: 'name' as SortField, label: 'სახელი' },
            { field: 'status' as SortField, label: 'სტატუსი' },
            { field: 'tandem_flights' as SortField, label: 'ტანდემ ფრენები' },
          ].map((option) => (
            <button
              key={option.field}
              onClick={() => toggleSort(option.field)}
              className={`rounded px-2 py-0.5 text-xs transition-colors ${
                sortField === option.field
                  ? 'bg-foreground text-background'
                  : 'bg-foreground/10 hover:bg-foreground/20'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk actions */}
      {selectedPilots.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-foreground/20 bg-foreground/5 p-3">
          <span className="text-sm text-foreground/70">
            მონიშნულია: <strong>{selectedPilots.size}</strong>
          </span>
          <button
            onClick={() => setSelectedPilots(new Set())}
            className="text-sm text-foreground/60 hover:text-foreground"
          >
            მონიშვნის გაუქმება
          </button>
        </div>
      )}

      {/* Pilots list */}
      <div className="space-y-2">
        {/* Header row */}
        <div className="hidden items-center gap-3 rounded-lg bg-foreground/5 px-4 py-2 text-xs font-medium uppercase tracking-wide text-foreground/60 md:flex">
          <input
            type="checkbox"
            checked={
              selectedPilots.size === filteredAndSortedPilots.length &&
              filteredAndSortedPilots.length > 0
            }
            onChange={toggleSelectAll}
            className="h-4 w-4 rounded border-foreground/30"
          />
          <div className="w-10" />
          <div className="flex-1">პილოტი</div>
          <div className="w-32">ტელეფონი</div>
          <div className="w-32">ლიცენზია</div>
          <div className="w-24">ფრენები</div>
          <div className="w-32">კომპანია</div>
          <div className="w-24">სტატუსი</div>
          <div className="w-24">მოქმედებები</div>
        </div>

        {filteredAndSortedPilots.length === 0 ? (
          <div className="rounded-lg border border-foreground/10 bg-foreground/5 py-12 text-center">
            <User className="mx-auto h-12 w-12 text-foreground/30" />
            <p className="mt-2 text-foreground/60">პილოტები ვერ მოიძებნა</p>
          </div>
        ) : (
          filteredAndSortedPilots.map((pilot) => {
            const isExpanded = expandedPilotId === pilot.id;
            const isEditing = editingPilotId === pilot.id;
            const config = statusConfig[pilot.status];
            const StatusIcon = config.icon;
            const displayName = getPilotDisplayName(pilot);

            return (
              <div
                key={pilot.id}
                className={`rounded-lg border transition-all ${
                  isExpanded
                    ? 'border-foreground/30 bg-foreground/5'
                    : 'border-foreground/10 hover:border-foreground/20'
                }`}
              >
                {/* Main row */}
                <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedPilots.has(pilot.id)}
                    onChange={() => toggleSelectPilot(pilot.id)}
                    className="h-4 w-4 rounded border-foreground/30"
                  />

                  {/* Avatar */}
                  <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-foreground/10">
                    {pilot.avatar_url ? (
                      <Image
                        src={pilot.avatar_url}
                        alt={displayName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <User className="absolute inset-0 m-auto h-6 w-6 text-foreground/40" />
                    )}
                  </div>

                  {/* Pilot info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{displayName}</span>
                      {pilot.gender === 'female' && (
                        <span className="text-xs text-pink-500">♀</span>
                      )}
                      {pilot.gender === 'male' && (
                        <span className="text-xs text-blue-500">♂</span>
                      )}
                    </div>
                    <div className="text-sm text-foreground/60 truncate">{pilot.email}</div>
                  </div>

                  {/* Phone */}
                  <div className="w-32 text-sm text-foreground/70">{pilot.phone}</div>

                  {/* Documents */}
                  <div className="w-32 text-sm">
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3 text-foreground/50" />
                      <span>{pilot.verification_documents?.length || 0} დოკ.</span>
                    </div>
                  </div>

                  {/* Flights */}
                  <div className="w-24 text-sm">
                    <div className="flex items-center gap-1">
                      <Plane className="h-3 w-3 text-foreground/50" />
                      <span>{pilot.tandem_flights || 0} ტანდ.</span>
                    </div>
                    {pilot.total_flights && (
                      <div className="text-xs text-foreground/50">{pilot.total_flights} სულ</div>
                    )}
                  </div>

                  {/* Company */}
                  <div className="w-32 text-sm">
                    {pilot.companies ? (
                      <div className="flex items-center gap-1 text-foreground/70">
                        <Building2 className="h-3 w-3" />
                        <span className="truncate">
                          {pilot.companies.name_ka || pilot.companies.name_en}
                        </span>
                      </div>
                    ) : (
                      <span className="text-foreground/40">-</span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="w-24">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.bg} ${config.color}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {config.label}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex w-24 items-center gap-1">
                    <button
                      onClick={() => toggleExpand(pilot.id)}
                      className="rounded p-1.5 hover:bg-foreground/10"
                      title={isExpanded ? 'დახურვა' : 'გახსნა'}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setEditingPilotId(pilot.id)}
                      className="rounded p-1.5 hover:bg-foreground/10"
                      title="რედაქტირება"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() =>
                        setMessageModal({
                          pilotId: pilot.id,
                          userId: pilot.user_id,
                          pilotName: displayName,
                        })
                      }
                      className="rounded p-1.5 hover:bg-foreground/10"
                      title="შეტყობინება"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Editing form */}
                {isEditing && (
                  <div className="border-t border-foreground/10 p-4">
                    <PilotEditForm
                      pilot={pilot}
                      onCancel={() => setEditingPilotId(null)}
                      onSave={(updatedPilot) => {
                        setPilots((prev) =>
                          prev.map((p) =>
                            p.id === updatedPilot.id
                              ? { ...p, ...updatedPilot, status: updatedPilot.status as PilotStatus }
                              : p
                          )
                        );
                        setEditingPilotId(null);
                      }}
                    />
                  </div>
                )}

                {/* Expanded content */}
                {isExpanded && !isEditing && (
                  <div className="border-t border-foreground/10 p-4">
                    {/* Tabs */}
                    <div className="mb-4 flex gap-2 border-b border-foreground/10 pb-2">
                      {[
                        { id: 'info' as ExpandTab, label: 'ინფო', icon: Info },
                        { id: 'equipment' as ExpandTab, label: 'აღჭურვილობა', icon: Settings },
                        { id: 'seo' as ExpandTab, label: 'SEO', icon: Eye },
                      ].map((tab) => {
                        const TabIcon = tab.icon;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveExpandTab(tab.id)}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                              activeExpandTab === tab.id
                                ? 'bg-foreground text-background'
                                : 'hover:bg-foreground/10'
                            }`}
                          >
                            <TabIcon className="h-4 w-4" />
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Tab content: Info */}
                    {activeExpandTab === 'info' && (
                      <div className="grid gap-4 md:grid-cols-3">
                        {/* Personal Info */}
                        <div className="rounded-lg border border-foreground/10 bg-foreground/5 p-3">
                          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/60">
                            პირადი ინფორმაცია
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-foreground/60">სახელი:</span>
                              <span>
                                {pilot.first_name_ka} {pilot.last_name_ka}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-foreground/60">დაბადების თარიღი:</span>
                              <span>{pilot.birth_date || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-foreground/60">ელ-ფოსტა:</span>
                              <span>{pilot.email}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-foreground/60">ტელეფონი:</span>
                              <span>{pilot.phone}</span>
                            </div>
                          </div>
                        </div>

                        {/* Experience */}
                        <div className="rounded-lg border border-foreground/10 bg-foreground/5 p-3">
                          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/60">
                            გამოცდილება
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-foreground/60">დოკუმენტები:</span>
                              <span>{pilot.verification_documents?.length || 0} ატვირთული</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-foreground/60">კომ. დაწყება:</span>
                              <span>{pilot.commercial_start_date || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-foreground/60">სულ ფრენები:</span>
                              <span>{pilot.total_flights || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-foreground/60">ტანდემ ფრენები:</span>
                              <span className="font-medium">{pilot.tandem_flights || '-'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Bio */}
                        <div className="rounded-lg border border-foreground/10 bg-foreground/5 p-3">
                          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/60">
                            ბიოგრაფია
                          </h4>
                          <div className="space-y-2 text-sm">
                            {pilot.bio_ka && (
                              <div>
                                <span className="text-xs text-foreground/50">🇬🇪</span>
                                <p className="text-foreground/80 line-clamp-3">{pilot.bio_ka}</p>
                              </div>
                            )}
                            {pilot.bio_en && (
                              <div>
                                <span className="text-xs text-foreground/50">🇬🇧</span>
                                <p className="text-foreground/80 line-clamp-3">{pilot.bio_en}</p>
                              </div>
                            )}
                            {!pilot.bio_ka && !pilot.bio_en && (
                              <span className="text-foreground/40">-</span>
                            )}
                          </div>
                        </div>

                        {/* Status change actions */}
                        <div className="md:col-span-3">
                          <div className="flex flex-wrap gap-2">
                            {pilot.status !== 'verified' && (
                              <button
                                onClick={() =>
                                  setVerifyModal({
                                    pilotId: pilot.id,
                                    userId: pilot.user_id,
                                    pilotName: displayName,
                                  })
                                }
                                disabled={updatingStatus === pilot.id}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-green-500/10 px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-500/20 disabled:opacity-50 dark:text-green-400"
                              >
                                <CheckCircle className="h-4 w-4" />
                                ვერიფიკაცია
                              </button>
                            )}
                            {pilot.status !== 'pending' && (
                              <button
                                onClick={() =>
                                  updatePilotStatus(pilot.id, 'pending', pilot.user_id)
                                }
                                disabled={updatingStatus === pilot.id}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-500/10 px-3 py-1.5 text-sm font-medium text-yellow-600 hover:bg-yellow-500/20 disabled:opacity-50 dark:text-yellow-400"
                              >
                                <Clock className="h-4 w-4" />
                                მოლოდინში
                              </button>
                            )}
                            {pilot.status !== 'blocked' && (
                              <button
                                onClick={() =>
                                  updatePilotStatus(pilot.id, 'blocked', pilot.user_id)
                                }
                                disabled={updatingStatus === pilot.id}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-500/20 disabled:opacity-50 dark:text-red-400"
                              >
                                <XCircle className="h-4 w-4" />
                                დაბლოკვა
                              </button>
                            )}
                            {pilot.status !== 'hidden' && (
                              <button
                                onClick={() =>
                                  updatePilotStatus(pilot.id, 'hidden', pilot.user_id)
                                }
                                disabled={updatingStatus === pilot.id}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-foreground/10 px-3 py-1.5 text-sm font-medium text-foreground/70 hover:bg-foreground/20 disabled:opacity-50"
                              >
                                <EyeOff className="h-4 w-4" />
                                დამალვა
                              </button>
                            )}
                            {updatingStatus === pilot.id && (
                              <Spinner size="sm" />
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab content: Equipment */}
                    {activeExpandTab === 'equipment' && (
                      <div className="grid gap-4 md:grid-cols-2">
                        {/* Wing */}
                        <div className="rounded-lg border border-foreground/10 bg-foreground/5 p-3">
                          <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground/60">
                            <Plane className="h-4 w-4" />
                            ფრთა (Wing)
                          </h4>
                          {renderEquipment(
                            pilot.wing_brand,
                            pilot.wing_model,
                            pilot.wing_certificate_url
                          )}
                        </div>

                        {/* Harness */}
                        <div className="rounded-lg border border-foreground/10 bg-foreground/5 p-3">
                          <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground/60">
                            <Award className="h-4 w-4" />
                            პილოტის ჰარნესი
                          </h4>
                          {renderEquipment(
                            pilot.pilot_harness_brand,
                            pilot.pilot_harness_model,
                            pilot.pilot_harness_certificate_url
                          )}
                        </div>

                        {/* Reserve */}
                        <div className="rounded-lg border border-foreground/10 bg-foreground/5 p-3">
                          <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground/60">
                            <Award className="h-4 w-4 text-orange-500" />
                            სარეზერვო პარაშუტი
                          </h4>
                          {renderEquipment(
                            pilot.reserve_brand,
                            pilot.reserve_model,
                            pilot.reserve_certificate_url
                          )}
                        </div>

                        {/* Passenger Harness */}
                        <div className="rounded-lg border border-foreground/10 bg-foreground/5 p-3">
                          <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground/60">
                            <Settings className="h-4 w-4 text-green-500" />
                            მგზავრის ჰარნესი
                          </h4>
                          {renderEquipment(
                            pilot.passenger_harness_brand,
                            pilot.passenger_harness_model,
                            pilot.passenger_harness_certificate_url
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tab content: SEO */}
                    {activeExpandTab === 'seo' && (
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium text-foreground/60">Slug</label>
                            <p className="text-sm">{pilot.slug || '-'}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-foreground/60">
                              SEO Title (KA)
                            </label>
                            <p className="text-sm">{pilot.seo_title_ka || '-'}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-foreground/60">
                              SEO Title (EN)
                            </label>
                            <p className="text-sm">{pilot.seo_title_en || '-'}</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium text-foreground/60">
                              SEO Description (KA)
                            </label>
                            <p className="text-sm line-clamp-2">{pilot.seo_description_ka || '-'}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-foreground/60">
                              SEO Description (EN)
                            </label>
                            <p className="text-sm line-clamp-2">{pilot.seo_description_en || '-'}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-foreground/60">OG Image</label>
                            <p className="text-sm">
                              {pilot.og_image ? (
                                <a
                                  href={pilot.og_image}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline"
                                >
                                  ნახვა
                                </a>
                              ) : (
                                '-'
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Verification Modal */}
      {verifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-2xl rounded-2xl border border-foreground/10 bg-background p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                ვერიფიკაცია: {verifyModal.pilotName}
              </h3>
              <button
                onClick={() => setVerifyModal(null)}
                className="rounded p-1 hover:bg-foreground/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-4 text-sm text-foreground/60">
              ვერიფიკაციის შემდეგ პილოტს გაეგზავნება შეტყობინება
            </p>

            <div className="mb-4 flex gap-2">
              {(['ka', 'en', 'ru', 'de', 'tr', 'ar'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setMessageLang(lang)}
                  className={`rounded px-2 py-1 text-xs font-medium ${
                    messageLang === lang
                      ? 'bg-foreground text-background'
                      : 'bg-foreground/10 hover:bg-foreground/20'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground/60">
                  სათაური ({messageLang.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={verificationMessages[`subject_${messageLang}` as keyof typeof verificationMessages]}
                  onChange={(e) =>
                    setVerificationMessages((prev) => ({
                      ...prev,
                      [`subject_${messageLang}`]: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm focus:border-foreground/30 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground/60">
                  შეტყობინება ({messageLang.toUpperCase()})
                </label>
                <textarea
                  value={verificationMessages[`content_${messageLang}` as keyof typeof verificationMessages]}
                  onChange={(e) =>
                    setVerificationMessages((prev) => ({
                      ...prev,
                      [`content_${messageLang}`]: e.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full rounded-lg border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm focus:border-foreground/30 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setVerifyModal(null)}
                className="rounded-lg border border-foreground/20 px-4 py-2 text-sm font-medium hover:bg-foreground/5"
              >
                გაუქმება
              </button>
              <button
                onClick={sendVerificationMessage}
                disabled={sendingVerification}
                className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
              >
                {sendingVerification ? (
                  <Spinner size="sm" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                ვერიფიკაცია და გაგზავნა
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Personal Message Modal */}
      {messageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-2xl rounded-2xl border border-foreground/10 bg-background p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                შეტყობინება: {messageModal.pilotName}
              </h3>
              <button
                onClick={() => setMessageModal(null)}
                className="rounded p-1 hover:bg-foreground/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 flex gap-2">
              {(['ka', 'en', 'ru', 'de', 'tr', 'ar'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setMessageLang(lang)}
                  className={`rounded px-2 py-1 text-xs font-medium ${
                    messageLang === lang
                      ? 'bg-foreground text-background'
                      : 'bg-foreground/10 hover:bg-foreground/20'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground/60">
                  სათაური ({messageLang.toUpperCase()}) *
                </label>
                <input
                  type="text"
                  value={personalMessage[`subject_${messageLang}` as keyof typeof personalMessage]}
                  onChange={(e) =>
                    setPersonalMessage((prev) => ({
                      ...prev,
                      [`subject_${messageLang}`]: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm focus:border-foreground/30 focus:outline-none"
                  placeholder="შეტყობინების სათაური..."
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground/60">
                  შეტყობინება ({messageLang.toUpperCase()}) *
                </label>
                <textarea
                  value={personalMessage[`content_${messageLang}` as keyof typeof personalMessage]}
                  onChange={(e) =>
                    setPersonalMessage((prev) => ({
                      ...prev,
                      [`content_${messageLang}`]: e.target.value,
                    }))
                  }
                  rows={5}
                  className="w-full rounded-lg border border-foreground/10 bg-foreground/5 px-3 py-2 text-sm focus:border-foreground/30 focus:outline-none resize-none"
                  placeholder="შეტყობინების ტექსტი..."
                />
              </div>
            </div>

            <p className="mt-2 text-xs text-foreground/50">
              * ქართული სათაური და შეტყობინება სავალდებულოა
            </p>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setMessageModal(null);
                  setPersonalMessage(defaultPersonalMessage);
                }}
                className="rounded-lg border border-foreground/20 px-4 py-2 text-sm font-medium hover:bg-foreground/5"
              >
                გაუქმება
              </button>
              <button
                onClick={sendPersonalMessage}
                disabled={sendingMessage}
                className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-50"
              >
                {sendingMessage ? <Spinner size="sm" /> : <Send className="h-4 w-4" />}
                გაგზავნა
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
