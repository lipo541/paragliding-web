'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Building2, Search, Check, X, AlertCircle, Phone, Globe, Clock } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useTranslation } from '@/lib/i18n/hooks/useTranslation';
import cn from 'classnames';

interface Company {
  id: string;
  user_id: string;
  name_ka: string;
  name_en: string | null;
  phone: string;
  email: string;
  logo_url: string | null;
  description_ka: string | null;
  description_en: string | null;
  status: 'pending' | 'verified' | 'blocked' | 'hidden';
  created_at: string;
}

interface PilotCompanyRequest {
  id: string;
  pilot_id: string;
  company_id: string;
  status: 'pending' | 'approved' | 'rejected';
  initiated_by: 'pilot_request' | 'company_invite';
  message: string | null;
  response_message: string | null;
  created_at: string;
  responded_at: string | null;
  company: Company;
}

interface Pilot {
  id: string;
  company_id: string | null;
  company?: Company;
}

type TabType = 'active' | 'requests' | 'search';

export default function PilotCompanies() {
  const { t } = useTranslation('pilotprofile');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [pilotRequests, setPilotRequests] = useState<PilotCompanyRequest[]>([]);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);  // All verified companies
  const [searchResults, setSearchResults] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [pilot, setPilot] = useState<Pilot | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'primary';
    onConfirm: () => void;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const supabase = createClient();

  // Fetch pilot's company requests
  const fetchPilotRequests = useCallback(async (pilotId: string) => {
    const { data, error } = await supabase
      .from('pilot_company_requests')
      .select(`
        *,
        company:companies(*)
      `)
      .eq('pilot_id', pilotId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPilotRequests(data as PilotCompanyRequest[]);
    }
  }, [supabase]);

  // Fetch pilot data with current company
  const fetchPilotData = useCallback(async (userId: string) => {
    const { data: pilotData } = await supabase
      .from('pilots')
      .select(`
        id,
        company_id,
        company:companies(*)
      `)
      .eq('user_id', userId)
      .single();

    if (pilotData) {
      setPilot(pilotData as Pilot);
      await fetchPilotRequests(pilotData.id);
    }
    return pilotData;
  }, [supabase, fetchPilotRequests]);

  // Fetch all verified companies
  const fetchAllCompanies = useCallback(async (pilotId: string, existingCompanyId: string | null) => {
    // Get IDs of companies pilot already has ACTIVE requests for (pending or approved)
    // Rejected requests should NOT exclude companies - pilot can request again
    const { data: requests } = await supabase
      .from('pilot_company_requests')
      .select('company_id')
      .eq('pilot_id', pilotId)
      .in('status', ['pending', 'approved']);
    
    const existingCompanyIds = (requests || []).map((r: { company_id: string }) => r.company_id);
    if (existingCompanyId) {
      existingCompanyIds.push(existingCompanyId);
    }

    let queryBuilder = supabase
      .from('companies')
      .select('*')
      .eq('status', 'verified')
      .order('name_ka', { ascending: true });

    // Exclude companies pilot already has active connection with
    if (existingCompanyIds.length > 0) {
      queryBuilder = queryBuilder.not('id', 'in', `(${existingCompanyIds.join(',')})`);
    }

    const { data, error } = await queryBuilder;
    
    if (!error && data) {
      console.log('Fetched verified companies:', data.length);
      setAllCompanies(data as Company[]);
    } else {
      console.error('Error fetching companies:', error);
    }
  }, [supabase]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const pilotData = await fetchPilotData(user.id);
      if (pilotData) {
        await fetchAllCompanies(pilotData.id, pilotData.company_id);
      }
      setLoading(false);
    };

    init();
  }, [supabase, fetchPilotData, fetchAllCompanies]);

  // Search verified companies
  const searchCompanies = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    
    // Get IDs of companies we already have requests for
    const existingCompanyIds = pilotRequests.map(pr => pr.company_id);
    // Also exclude current company
    if (pilot?.company_id) {
      existingCompanyIds.push(pilot.company_id);
    }

    let queryBuilder = supabase
      .from('companies')
      .select('*')
      .eq('status', 'verified')
      .ilike('name_ka', `%${query}%`)
      .limit(10);

    // Exclude existing companies
    if (existingCompanyIds.length > 0) {
      queryBuilder = queryBuilder.not('id', 'in', `(${existingCompanyIds.join(',')})`);
    }

    const { data, error } = await queryBuilder;

    if (!error && data) {
      setSearchResults(data as Company[]);
    }
    
    setSearching(false);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.length >= 2) {
      searchCompanies(value);
    } else {
      setSearchResults([]);
    }
  };

  // Send join request to company
  const requestJoinCompany = async (companyId: string, message?: string) => {
    if (!pilot) return;
    
    setActionLoading(companyId);
    
    // First check if there's an existing rejected request - if so, update it
    const { data: existingRequest } = await supabase
      .from('pilot_company_requests')
      .select('id, status')
      .eq('company_id', companyId)
      .eq('pilot_id', pilot.id)
      .single();
    
    let error;
    
    if (existingRequest && existingRequest.status === 'rejected') {
      // Update existing rejected request to pending
      const result = await supabase
        .from('pilot_company_requests')
        .update({
          status: 'pending',
          initiated_by: 'pilot_request',
          message: message || 'Re-requested to join',
          response_message: null,
          responded_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRequest.id);
      error = result.error;
    } else {
      // Create new request
      const result = await supabase
        .from('pilot_company_requests')
        .insert({
          company_id: companyId,
          pilot_id: pilot.id,
          status: 'pending',
          initiated_by: 'pilot_request',
          message: message || null
        });
      error = result.error;
    }

    if (error) {
      console.error('Error sending request:', error);
      alert(`Error: ${error.message}`);
    } else {
      await fetchPilotRequests(pilot.id);
      setSearchResults(prev => prev.filter(c => c.id !== companyId));
      // Also remove from all companies list
      setAllCompanies(prev => prev.filter(c => c.id !== companyId));
    }
    
    setActionLoading(null);
  };

  // Cancel pending request
  const cancelRequest = async (requestId: string) => {
    if (!pilot) return;
    
    setActionLoading(requestId);
    
    const { error } = await supabase
      .from('pilot_company_requests')
      .delete()
      .eq('id', requestId);

    if (!error) {
      await fetchPilotRequests(pilot.id);
    }
    
    setActionLoading(null);
    setConfirmDialog(null);
  };

  // Leave current company
  const leaveCurrentCompany = async () => {
    if (!pilot) return;
    
    setActionLoading('leave');
    
    const { error } = await supabase
      .from('pilots')
      .update({ company_id: null })
      .eq('id', pilot.id);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await fetchPilotData(user.id);
      }
    }
    
    setActionLoading(null);
    setConfirmDialog(null);
  };

  // Accept company invite (when company invited pilot)
  const acceptCompanyInvite = async (requestId: string, companyId: string) => {
    if (!pilot) return;
    
    setActionLoading(requestId);
    
    // Update request status to approved
    const { error: requestError } = await supabase
      .from('pilot_company_requests')
      .update({ 
        status: 'approved',
        responded_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (!requestError) {
      // Update pilot's company_id
      await supabase
        .from('pilots')
        .update({ company_id: companyId })
        .eq('id', pilot.id);
        
      // Refresh data
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await fetchPilotData(user.id);
      }
    }
    
    setActionLoading(null);
  };

  // Reject company invite
  const rejectCompanyInvite = async (requestId: string) => {
    if (!pilot) return;
    
    setActionLoading(requestId);
    
    const { error } = await supabase
      .from('pilot_company_requests')
      .update({ 
        status: 'rejected',
        responded_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (!error) {
      await fetchPilotRequests(pilot.id);
    }
    
    setActionLoading(null);
    setConfirmDialog(null);
  };

  // Filtered data - separate pilot's requests from company invites
  const myPendingRequests = pilotRequests.filter(pr => pr.status === 'pending' && pr.initiated_by === 'pilot_request');
  const companyInvites = pilotRequests.filter(pr => pr.status === 'pending' && pr.initiated_by === 'company_invite');
  const pendingRequests = pilotRequests.filter(pr => pr.status === 'pending');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 pt-6 px-4 md:pr-20 selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="animate-fadeIn">
          <h1 className="text-xl lg:text-2xl font-bold text-[#1a1a1a] dark:text-white mb-1">
            {t('title') || 'კომპანიები'}
          </h1>
          <p className="text-sm text-[#1a1a1a]/50 dark:text-white/50">
            {t('subtitle') || 'მართეთ თქვენი კომპანიის კავშირები'}
          </p>
        </div>

        {/* Current Company Card */}
        {pilot?.company && (
          <div className="animate-fadeIn">
            <div className="rounded-2xl backdrop-blur-md bg-gradient-to-r from-green-500/20 to-emerald-500/20 dark:from-green-500/10 dark:to-emerald-500/10 border border-green-500/30 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {t('currentCompany') || 'მიმდინარე კომპანია'}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#4697D2] to-[#4697D2]/60 flex items-center justify-center text-white text-xl font-bold overflow-hidden flex-shrink-0">
                  {pilot.company.logo_url ? (
                    <img src={pilot.company.logo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-8 h-8" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#1a1a1a] dark:text-white">
                    {pilot.company.name_ka || pilot.company.name_en}
                  </h3>
                  <p className="text-sm text-[#1a1a1a]/60 dark:text-white/60">
                    {pilot.company.email}
                  </p>
                </div>
                <button
                  onClick={() => setConfirmDialog({
                    open: true,
                    title: t('leaveCompanyTitle') || 'კომპანიიდან გასვლა',
                    message: t('leaveCompanyMessage') || 'დარწმუნებული ხართ რომ გსურთ კომპანიიდან გასვლა?',
                    variant: 'danger',
                    onConfirm: leaveCurrentCompany
                  })}
                  disabled={actionLoading === 'leave'}
                  className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 text-sm font-medium hover:bg-red-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {actionLoading === 'leave' ? <Spinner size="sm" /> : (
                    <>
                      <X className="w-4 h-4" />
                      {t('leave') || 'გასვლა'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 animate-fadeIn">
          <div className="rounded-xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1a1a1a] dark:text-white">
                  {pilot?.company_id ? 1 : 0}
                </p>
                <p className="text-xs text-[#1a1a1a]/60 dark:text-white/60">
                  {t('activeCompany') || 'აქტიური კომპანია'}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1a1a1a] dark:text-white">
                  {pendingRequests.length}
                </p>
                <p className="text-xs text-[#1a1a1a]/60 dark:text-white/60">
                  {t('pendingRequests') || 'მომლოდინე მოთხოვნები'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap animate-fadeIn">
          {[
            { key: 'active', label: t('tabActive') || 'აქტიური', count: pilot?.company_id ? 1 : 0 },
            { key: 'requests', label: t('tabRequests') || 'მოთხოვნები', count: pendingRequests.length },
            { key: 'search', label: t('tabSearch') || 'ძიება', icon: Search },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2',
                activeTab === tab.key
                  ? 'bg-[#4697D2] text-white shadow-lg'
                  : 'bg-[rgba(70,151,210,0.15)] dark:bg-black/40 text-[#1a1a1a] dark:text-white border border-[#4697D2]/30 dark:border-white/10'
              )}
            >
              {tab.icon && <tab.icon className="w-4 h-4" />}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={cn(
                  'px-1.5 py-0.5 rounded-full text-xs',
                  activeTab === tab.key ? 'bg-white/20' : 'bg-[#4697D2]/20 text-[#4697D2]'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="animate-fadeIn">
          {/* Search Tab */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1a1a1a]/40 dark:text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder={t('searchPlaceholder') || 'მოძებნეთ კომპანია...'}
                  className="w-full pl-12 pr-4 py-3 rounded-xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 text-[#1a1a1a] dark:text-white placeholder:text-[#1a1a1a]/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#4697D2]/50"
                />
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#1a1a1a]/10 dark:bg-white/10 flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-[#1a1a1a]/60 dark:text-white/60" />
                  </button>
                )}
              </div>

              {searching ? (
                <div className="flex justify-center py-8">
                  <Spinner size="md" />
                </div>
              ) : searchQuery.length >= 2 && searchResults.length > 0 ? (
                <div className="space-y-3">
                  {searchResults.map(company => (
                    <CompanyCard
                      key={company.id}
                      company={company}
                      onJoin={() => requestJoinCompany(company.id)}
                      actionLoading={actionLoading === company.id}
                      t={t}
                    />
                  ))}
                </div>
              ) : searchQuery.length >= 2 ? (
                <div className="text-center py-8 text-[#1a1a1a]/60 dark:text-white/60">
                  {t('noResults') || 'კომპანია ვერ მოიძებნა'}
                </div>
              ) : allCompanies.length > 0 ? (
                // Show all verified companies when not searching
                <div className="space-y-3">
                  <p className="text-sm text-[#1a1a1a]/60 dark:text-white/60 mb-3">
                    {t('availableCompanies') || 'ხელმისაწვდომი კომპანიები'}
                  </p>
                  {allCompanies.map(company => (
                    <CompanyCard
                      key={company.id}
                      company={company}
                      onJoin={() => requestJoinCompany(company.id)}
                      actionLoading={actionLoading === company.id}
                      t={t}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[#1a1a1a]/60 dark:text-white/60">
                  {t('noCompaniesAvailable') || 'ამჟამად ხელმისაწვდომი კომპანიები არ არის'}
                </div>
              )}
            </div>
          )}

          {/* Active Tab */}
          {activeTab === 'active' && (
            <div className="space-y-3">
              {!pilot?.company_id ? (
                <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl p-12 text-center">
                  <Building2 className="w-16 h-16 mx-auto mb-4 text-[#4697D2]/30 dark:text-white/30" />
                  <h3 className="text-lg font-semibold text-[#1a1a1a] dark:text-white mb-2">
                    {t('noActiveCompany') || 'არ გაქვთ აქტიური კომპანია'}
                  </h3>
                  <p className="text-sm text-[#1a1a1a]/60 dark:text-white/60 mb-4">
                    {t('noActiveCompanyHint') || 'მოძებნეთ და გაუგზავნეთ მოთხოვნა კომპანიას'}
                  </p>
                  <button
                    onClick={() => setActiveTab('search')}
                    className="px-4 py-2 rounded-lg bg-[#4697D2] text-white text-sm font-medium hover:bg-[#4697D2]/90 transition-all flex items-center gap-2 mx-auto"
                  >
                    <Search className="w-4 h-4" />
                    {t('searchCompanies') || 'კომპანიების ძიება'}
                  </button>
                </div>
              ) : pilot?.company && (
                <CompanyCard
                  company={pilot.company}
                  isActive
                  onLeave={() => setConfirmDialog({
                    open: true,
                    title: t('leaveCompanyTitle') || 'კომპანიიდან გასვლა',
                    message: t('leaveCompanyMessage') || 'დარწმუნებული ხართ რომ გსურთ კომპანიიდან გასვლა?',
                    variant: 'danger',
                    onConfirm: leaveCurrentCompany
                  })}
                  actionLoading={actionLoading === 'leave'}
                  t={t}
                />
              )}
            </div>
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              {/* Company Invites Section */}
              {companyInvites.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-[#4697D2] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {t('companyInvites') || 'კომპანიების მოწვევები'} ({companyInvites.length})
                  </h3>
                  {companyInvites.map(request => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      onAccept={() => acceptCompanyInvite(request.id, request.company_id)}
                      onReject={() => setConfirmDialog({
                        open: true,
                        title: t('rejectInviteTitle') || 'მოწვევის უარყოფა',
                        message: t('rejectInviteMessage') || 'დარწმუნებული ხართ რომ გსურთ მოწვევის უარყოფა?',
                        variant: 'danger',
                        onConfirm: () => rejectCompanyInvite(request.id)
                      })}
                      actionLoading={actionLoading === request.id}
                      t={t}
                    />
                  ))}
                </div>
              )}
              
              {/* My Requests Section */}
              {myPendingRequests.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-[#1a1a1a]/60 dark:text-white/60">
                    {t('myRequests') || 'ჩემი მოთხოვნები'} ({myPendingRequests.length})
                  </h3>
                  {myPendingRequests.map(request => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      onCancel={() => setConfirmDialog({
                        open: true,
                        title: t('cancelRequestTitle') || 'მოთხოვნის გაუქმება',
                        message: t('cancelRequestMessage') || 'დარწმუნებული ხართ რომ გსურთ მოთხოვნის გაუქმება?',
                        variant: 'danger',
                        onConfirm: () => cancelRequest(request.id)
                      })}
                      actionLoading={actionLoading === request.id}
                      t={t}
                    />
                  ))}
                </div>
              )}
              
              {/* Empty State */}
              {pendingRequests.length === 0 && (
                <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl p-12 text-center">
                  <Clock className="w-16 h-16 mx-auto mb-4 text-[#4697D2]/30 dark:text-white/30" />
                  <h3 className="text-lg font-semibold text-[#1a1a1a] dark:text-white mb-2">
                    {t('noRequests') || 'მომლოდინე მოთხოვნები არ არის'}
                  </h3>
                  <p className="text-sm text-[#1a1a1a]/60 dark:text-white/60">
                    {t('noRequestsHint') || 'როცა კომპანიას მოთხოვნას გაუგზავნით ან მოგიწვევენ, აქ გამოჩნდება'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={confirmDialog.open}
          title={confirmDialog.title}
          message={confirmDialog.message}
          variant={confirmDialog.variant}
          onConfirm={confirmDialog.onConfirm}
          onClose={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}

// Company Card Component
interface CompanyCardProps {
  company: Company;
  isActive?: boolean;
  onJoin?: () => void;
  onLeave?: () => void;
  actionLoading: boolean;
  t: (key: string) => string;
}

function CompanyCard({ 
  company, 
  isActive, 
  onJoin, 
  onLeave, 
  actionLoading, 
  t 
}: CompanyCardProps) {
  return (
    <div className="rounded-xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 p-4">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#4697D2] to-[#4697D2]/60 flex items-center justify-center text-white text-lg font-bold overflow-hidden flex-shrink-0">
          {company.logo_url ? (
            <img src={company.logo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <Building2 className="w-7 h-7" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-[#1a1a1a] dark:text-white">
              {company.name_ka || company.name_en}
            </h3>
            {company.status === 'verified' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-600 dark:text-green-400">
                <Check className="w-3 h-3" />
              </span>
            )}
            {isActive && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-600 dark:text-green-400">
                {t('active') || 'აქტიური'}
              </span>
            )}
          </div>
          
          {(company.description_ka || company.description_en) && (
            <p className="mt-2 text-sm text-[#1a1a1a]/60 dark:text-white/60 line-clamp-2">
              {company.description_ka || company.description_en}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2 text-xs text-[#1a1a1a]/50 dark:text-white/50">
            {company.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {company.phone}
              </span>
            )}
            {company.email && (
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {company.email}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {onJoin && (
            <button
              onClick={onJoin}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg bg-[#4697D2] text-white text-sm font-medium hover:bg-[#4697D2]/90 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {actionLoading ? <Spinner size="sm" /> : (t('sendRequest') || 'მოთხოვნა')}
            </button>
          )}

          {isActive && onLeave && (
            <button
              onClick={onLeave}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 text-sm font-medium hover:bg-red-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {actionLoading ? <Spinner size="sm" /> : (
                <>
                  <X className="w-4 h-4" />
                  {t('leave') || 'გასვლა'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Request Card Component
interface RequestCardProps {
  request: PilotCompanyRequest;
  onCancel?: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  actionLoading: boolean;
  t: (key: string) => string;
}

function RequestCard({ request, onCancel, onAccept, onReject, actionLoading, t }: RequestCardProps) {
  const isCompanyInvite = request.initiated_by === 'company_invite';
  
  const statusConfig = {
    pending: {
      label: isCompanyInvite 
        ? (t('inviteReceived') || 'მოწვევა მიღებულია')
        : (t('statusPending') || 'მომლოდინე'),
      color: isCompanyInvite 
        ? 'text-blue-600 dark:text-blue-400'
        : 'text-amber-600 dark:text-amber-400',
      bg: isCompanyInvite ? 'bg-blue-500/20' : 'bg-amber-500/20'
    },
    approved: {
      label: t('statusApproved') || 'დამტკიცებული',
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-500/20'
    },
    rejected: {
      label: t('statusRejected') || 'უარყოფილი',
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-500/20'
    }
  };

  const status = statusConfig[request.status];

  return (
    <div className={cn(
      "rounded-xl backdrop-blur-md border p-4",
      isCompanyInvite && request.status === 'pending'
        ? "bg-[rgba(70,151,210,0.25)] border-[#4697D2]/50 dark:bg-blue-900/30"
        : "bg-[rgba(70,151,210,0.15)] border-[#4697D2]/30 dark:bg-black/40 dark:border-white/10"
    )}>
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#4697D2] to-[#4697D2]/60 flex items-center justify-center text-white text-lg font-bold overflow-hidden flex-shrink-0">
          {request.company.logo_url ? (
            <img src={request.company.logo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <Building2 className="w-7 h-7" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-[#1a1a1a] dark:text-white">
              {request.company.name_ka || request.company.name_en}
            </h3>
            <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs', status.bg, status.color)}>
              <Clock className="w-3 h-3" />
              {status.label}
            </span>
          </div>
          
          <p className="mt-1 text-xs text-[#1a1a1a]/50 dark:text-white/50">
            {isCompanyInvite 
              ? (t('inviteDate') || 'მოწვევის თარიღი')
              : (t('requestSent') || 'გაგზავნილია')
            }: {new Date(request.created_at).toLocaleDateString('ka-GE')}
          </p>

          {request.message && (
            <p className="mt-2 text-sm text-[#1a1a1a]/60 dark:text-white/60 italic">
              &ldquo;{request.message}&rdquo;
            </p>
          )}

          {request.response_message && (
            <div className="mt-2 p-2 rounded-lg bg-[#1a1a1a]/5 dark:bg-white/5">
              <p className="text-xs text-[#1a1a1a]/50 dark:text-white/50 mb-1">
                {t('companyResponse') || 'კომპანიის პასუხი'}:
              </p>
              <p className="text-sm text-[#1a1a1a]/70 dark:text-white/70">
                {request.response_message}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {request.status === 'pending' && (
          <div className="flex flex-col gap-2">
            {isCompanyInvite ? (
              <>
                {/* Accept/Reject for company invites */}
                <button
                  onClick={onAccept}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? <Spinner size="sm" /> : (
                    <>
                      <Check className="w-4 h-4" />
                      {t('accept') || 'მიღება'}
                    </>
                  )}
                </button>
                <button
                  onClick={onReject}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 text-sm font-medium hover:bg-red-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  {t('reject') || 'უარყოფა'}
                </button>
              </>
            ) : (
              /* Cancel for pilot's own requests */
              <button
                onClick={onCancel}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 text-sm font-medium hover:bg-red-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {actionLoading ? <Spinner size="sm" /> : (
                  <>
                    <X className="w-4 h-4" />
                    {t('cancel') || 'გაუქმება'}
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
