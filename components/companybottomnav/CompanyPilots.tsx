'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, Search, X, Check, Phone, Mail, ChevronDown, AlertCircle, Clock, Shield, Plane, Image as ImageIcon } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useTranslation } from '@/lib/i18n/hooks/useTranslation';
import cn from 'classnames';

// Interface matching actual pilots table structure
interface Pilot {
  id: string;
  user_id: string;
  first_name_ka: string;
  last_name_ka: string;
  first_name_en: string | null;
  last_name_en: string | null;
  phone: string;
  email: string;
  avatar_url: string | null;
  bio_ka: string | null;
  bio_en: string | null;
  experience_years: number | null;
  tandem_flights: number | null;
  total_flights: number | null;
  commercial_start_date: string | null;
  status: 'pending' | 'verified' | 'blocked' | 'hidden';
  created_at: string;
  // Equipment fields
  wing_brand: string | null;
  wing_model: string | null;
  wing_certificate_url: string | null;
  pilot_harness_brand: string | null;
  pilot_harness_model: string | null;
  pilot_harness_certificate_url: string | null;
  passenger_harness_brand: string | null;
  passenger_harness_model: string | null;
  passenger_harness_certificate_url: string | null;
  reserve_brand: string | null;
  reserve_model: string | null;
  reserve_certificate_url: string | null;
  verification_documents: string[] | null;
}

// Interface for pilot_company_requests table
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
  pilot: Pilot;
}

type TabType = 'active' | 'pending' | 'search';

export default function CompanyPilots() {
  const { t } = useTranslation('companybottomnav');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [pilotRequests, setPilotRequests] = useState<PilotCompanyRequest[]>([]);
  const [allPilots, setAllPilots] = useState<Pilot[]>([]);  // All verified pilots
  const [searchResults, setSearchResults] = useState<Pilot[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'primary';
    onConfirm: () => void;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const supabase = createClient();

  // Fetch pilot requests for this company (fetch separately to avoid join issues)
  const fetchPilotRequests = useCallback(async (compId: string) => {
    // First fetch the requests
    const { data: requestsData, error: requestsError } = await supabase
      .from('pilot_company_requests')
      .select('*')
      .eq('company_id', compId)
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('Error fetching pilot requests:', requestsError.message || requestsError);
      return;
    }

    if (!requestsData || requestsData.length === 0) {
      setPilotRequests([]);
      return;
    }

    // Get pilot IDs from requests
    const pilotIds = requestsData.map((r: { pilot_id: string }) => r.pilot_id);

    // Fetch pilots data separately
    const { data: pilotsData, error: pilotsError } = await supabase
      .from('pilots')
      .select('*')
      .in('id', pilotIds);

    if (pilotsError) {
      console.error('Error fetching pilots for requests:', pilotsError.message || pilotsError);
    }

    // Merge requests with pilot data
    const pilotsMap = new Map((pilotsData || []).map((p: Pilot) => [p.id, p]));
    const requestsWithPilots = requestsData.map((req: { pilot_id: string }) => ({
      ...req,
      pilot: pilotsMap.get(req.pilot_id) || null
    })).filter((req: { pilot: Pilot | null }) => req.pilot !== null);

    console.log('Fetched pilot requests with pilots:', requestsWithPilots.length);
    setPilotRequests(requestsWithPilots as PilotCompanyRequest[]);
  }, [supabase]);

  // Fetch all verified pilots (for search/browse)
  const fetchAllPilots = useCallback(async (compId: string) => {
    // Get IDs of pilots who already have ACTIVE requests (pending or approved) with this company
    // Rejected requests should NOT exclude pilots - they can be invited again
    const { data: existingRequests, error: reqError } = await supabase
      .from('pilot_company_requests')
      .select('pilot_id')
      .eq('company_id', compId)
      .in('status', ['pending', 'approved']);
    
    if (reqError) {
      console.error('Error fetching existing requests:', reqError.message);
    }
    
    const existingPilotIds = (existingRequests || []).map((r: { pilot_id: string }) => r.pilot_id);

    // Build query for verified pilots
    const { data, error } = await supabase
      .from('pilots')
      .select('*')
      .eq('status', 'verified')
      .order('first_name_ka', { ascending: true });
    
    if (error) {
      console.error('Error fetching pilots:', error.message || error);
      setAllPilots([]);
      return;
    }

    // Filter out pilots who already have requests (client-side to avoid RLS issues)
    const filteredPilots = (data || []).filter(
      (pilot: Pilot) => !existingPilotIds.includes(pilot.id)
    );

    console.log('Fetched verified pilots:', filteredPilots.length);
    setAllPilots(filteredPilots as Pilot[]);
  }, [supabase]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Get company ID from companies table
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (company) {
        setCompanyId(company.id);
        await fetchPilotRequests(company.id);
        await fetchAllPilots(company.id);
      }

      setLoading(false);
    };

    fetchData();
  }, [supabase, fetchPilotRequests, fetchAllPilots]);

  const searchPilots = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    
    const existingPilotIds = pilotRequests.map(pr => pr.pilot_id);
    
    let queryBuilder = supabase
      .from('pilots')
      .select('*')
      .eq('status', 'verified')
      .or(`first_name_ka.ilike.%${query}%,last_name_ka.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(10);

    if (existingPilotIds.length > 0) {
      queryBuilder = queryBuilder.not('id', 'in', `(${existingPilotIds.join(',')})`);
    }

    const { data, error } = await queryBuilder;

    if (!error && data) {
      setSearchResults(data as Pilot[]);
    }
    
    setSearching(false);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.length >= 2) {
      searchPilots(value);
    } else {
      setSearchResults([]);
    }
  };

  // Invite pilot (create request from company side)
  const invitePilot = async (pilotId: string) => {
    if (!companyId) return;
    
    setActionLoading(pilotId);
    
    // First check if there's an existing rejected request - if so, update it
    const { data: existingRequest } = await supabase
      .from('pilot_company_requests')
      .select('id, status')
      .eq('company_id', companyId)
      .eq('pilot_id', pilotId)
      .single();
    
    let error;
    
    if (existingRequest && existingRequest.status === 'rejected') {
      // Update existing rejected request to pending (as company invite)
      const result = await supabase
        .from('pilot_company_requests')
        .update({
          status: 'pending',
          initiated_by: 'company_invite',
          message: 'Company invitation (re-invited)',
          response_message: null,
          responded_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRequest.id);
      error = result.error;
    } else {
      // Create new request (company invite - pilot must approve)
      const result = await supabase
        .from('pilot_company_requests')
        .insert({
          company_id: companyId,
          pilot_id: pilotId,
          status: 'pending',
          initiated_by: 'company_invite',
          message: 'Company invitation'
        });
      error = result.error;
    }

    if (!error) {
      await fetchPilotRequests(companyId);
      await fetchAllPilots(companyId);
      setSearchResults(prev => prev.filter(p => p.id !== pilotId));
    } else {
      console.error('Error inviting pilot:', error.message);
    }
    
    setActionLoading(null);
  };

  // Approve pilot request
  const approveRequest = async (requestId: string, pilotId: string) => {
    if (!companyId) return;
    
    setActionLoading(requestId);
    
    // Update request status
    const { error: requestError } = await supabase
      .from('pilot_company_requests')
      .update({ 
        status: 'approved',
        responded_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (!requestError) {
      // Also update pilot's company_id
      await supabase
        .from('pilots')
        .update({ company_id: companyId })
        .eq('id', pilotId);
        
      await fetchPilotRequests(companyId);
    }
    
    setActionLoading(null);
  };

  // Reject pilot request (update status to rejected)
  const rejectRequest = async (requestId: string) => {
    if (!companyId) return;
    
    setActionLoading(requestId);
    
    const { error } = await supabase
      .from('pilot_company_requests')
      .update({ 
        status: 'rejected',
        responded_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (!error) {
      await fetchPilotRequests(companyId);
    }
    
    setActionLoading(null);
    setConfirmDialog(null);
  };

  // Remove approved pilot from company
  const removePilot = async (requestId: string, pilotId: string) => {
    if (!companyId) return;
    
    setActionLoading(requestId);
    
    // Remove pilot from company
    const { error: pilotError } = await supabase
      .from('pilots')
      .update({ company_id: null })
      .eq('id', pilotId);

    if (!pilotError) {
      // Delete the request record
      await supabase
        .from('pilot_company_requests')
        .delete()
        .eq('id', requestId);
        
      await fetchPilotRequests(companyId);
      await fetchAllPilots(companyId);
    }
    
    setActionLoading(null);
    setConfirmDialog(null);
  };

  const approvedPilots = pilotRequests.filter(pr => pr.status === 'approved');
  // Only show pilot's requests (not company invites) - company invites are waiting for pilot to approve
  const pendingRequests = pilotRequests.filter(pr => 
    pr.status === 'pending' && pr.initiated_by === 'pilot_request'
  );
  // Company's sent invites (waiting for pilot to accept)
  const sentInvites = pilotRequests.filter(pr => 
    pr.status === 'pending' && pr.initiated_by === 'company_invite'
  );

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
            {t('pilotsTitle') || 'პილოტები'}
          </h1>
          <p className="text-sm text-[#1a1a1a]/50 dark:text-white/50">
            {t('pilotsSubtitle') || 'მართეთ თქვენი კომპანიის პილოტები'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 animate-fadeIn">
          <div className="rounded-xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1a1a1a] dark:text-white">{approvedPilots.length}</p>
                <p className="text-xs text-[#1a1a1a]/60 dark:text-white/60">{t('pilotsActive') || 'აქტიური პილოტები'}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1a1a1a] dark:text-white">{pendingRequests.length}</p>
                <p className="text-xs text-[#1a1a1a]/60 dark:text-white/60">{t('pilotsPending') || 'მომლოდინე'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 animate-fadeIn overflow-x-auto pb-2">
          {[
            { key: 'active', label: t('pilotsTabActive') || 'აქტიური', count: approvedPilots.length },
            { key: 'pending', label: t('pilotsTabPending') || 'მოთხოვნები', count: pendingRequests.length },
            { key: 'search', label: t('pilotsTabSearch') || 'ძებნა', icon: Search },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap',
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
                  placeholder={t('searchPilotPlaceholder') || 'მოძებნეთ პილოტი...'}
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
                  {searchResults.map(pilot => (
                    <PilotCard
                      key={pilot.id}
                      pilot={pilot}
                      onInvite={() => invitePilot(pilot.id)}
                      actionLoading={actionLoading === pilot.id}
                      t={t}
                    />
                  ))}
                </div>
              ) : searchQuery.length >= 2 ? (
                <div className="text-center py-8 text-[#1a1a1a]/60 dark:text-white/60">
                  {t('noPilotsFound') || 'პილოტი ვერ მოიძებნა'}
                </div>
              ) : allPilots.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-[#1a1a1a]/60 dark:text-white/60 mb-3">
                    {t('availablePilots') || 'ხელმისაწვდომი პილოტები'}
                  </p>
                  {allPilots.map(pilot => (
                    <PilotCard
                      key={pilot.id}
                      pilot={pilot}
                      onInvite={() => invitePilot(pilot.id)}
                      actionLoading={actionLoading === pilot.id}
                      t={t}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[#1a1a1a]/60 dark:text-white/60">
                  {t('noPilotsAvailable') || 'ამჟამად ხელმისაწვდომი პილოტები არ არის'}
                </div>
              )}
            </div>
          )}

          {/* Active Tab */}
          {activeTab === 'active' && (
            <div className="space-y-3">
              {approvedPilots.length === 0 ? (
                <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl p-12 text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 text-[#4697D2]/30 dark:text-white/30" />
                  <h3 className="text-lg font-semibold text-[#1a1a1a] dark:text-white mb-2">
                    {t('noActivePilots') || 'აქტიური პილოტები არ არის'}
                  </h3>
                  <p className="text-sm text-[#1a1a1a]/60 dark:text-white/60 mb-4">
                    {t('noActivePilotsHint') || 'მოიწვიეთ პილოტები თქვენს კომპანიაში'}
                  </p>
                  <button
                    onClick={() => setActiveTab('search')}
                    className="px-4 py-2 rounded-lg bg-[#4697D2] text-white text-sm font-medium hover:bg-[#4697D2]/90 transition-all flex items-center gap-2 mx-auto"
                  >
                    <Search className="w-4 h-4" />
                    {t('searchPilots') || 'პილოტების ძებნა'}
                  </button>
                </div>
              ) : (
                approvedPilots.map(request => (
                  <PilotRequestCard
                    key={request.id}
                    request={request}
                    onRemove={() => setConfirmDialog({
                      open: true,
                      title: t('removePilotTitle') || 'პილოტის წაშლა',
                      message: t('removePilotMessage') || 'დარწმუნებული ხართ რომ გსურთ პილოტის წაშლა?',
                      variant: 'danger',
                      onConfirm: () => removePilot(request.id, request.pilot_id)
                    })}
                    actionLoading={actionLoading === request.id}
                    t={t}
                  />
                ))
              )}
            </div>
          )}

          {/* Pending Tab */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              {/* Pilot Requests (waiting for company to approve) */}
              {pendingRequests.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-[#4697D2] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {t('pilotRequests') || 'პილოტების მოთხოვნები'} ({pendingRequests.length})
                  </h3>
                  {pendingRequests.map(request => (
                    <PilotRequestCard
                      key={request.id}
                      request={request}
                      isPending
                      onApprove={() => approveRequest(request.id, request.pilot_id)}
                      onRemove={() => setConfirmDialog({
                        open: true,
                        title: t('rejectRequestTitle') || 'მოთხოვნის უარყოფა',
                        message: t('rejectRequestMessage') || 'დარწმუნებული ხართ რომ გსურთ მოთხოვნის უარყოფა?',
                        variant: 'danger',
                        onConfirm: () => rejectRequest(request.id)
                      })}
                      actionLoading={actionLoading === request.id}
                      t={t}
                    />
                  ))}
                </div>
              )}
              
              {/* Sent Invites (waiting for pilot to accept) */}
              {sentInvites.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-[#1a1a1a]/60 dark:text-white/60 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {t('sentInvites') || 'გაგზავნილი მოწვევები'} ({sentInvites.length})
                  </h3>
                  {sentInvites.map(request => (
                    <PilotRequestCard
                      key={request.id}
                      request={request}
                      isSentInvite
                      onRemove={() => setConfirmDialog({
                        open: true,
                        title: t('cancelInviteTitle') || 'მოწვევის გაუქმება',
                        message: t('cancelInviteMessage') || 'დარწმუნებული ხართ რომ გსურთ მოწვევის გაუქმება?',
                        variant: 'danger',
                        onConfirm: () => rejectRequest(request.id)
                      })}
                      actionLoading={actionLoading === request.id}
                      t={t}
                    />
                  ))}
                </div>
              )}
              
              {/* Empty State */}
              {pendingRequests.length === 0 && sentInvites.length === 0 && (
                <div className="rounded-2xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 shadow-xl p-12 text-center">
                  <Clock className="w-16 h-16 mx-auto mb-4 text-[#4697D2]/30 dark:text-white/30" />
                  <h3 className="text-lg font-semibold text-[#1a1a1a] dark:text-white mb-2">
                    {t('noPendingRequests') || 'მომლოდინე მოთხოვნები არ არის'}
                  </h3>
                  <p className="text-sm text-[#1a1a1a]/60 dark:text-white/60">
                    {t('noPendingRequestsHint') || 'როცა პილოტი მოთხოვნას გამოგიგზავნით, აქ გამოჩნდება'}
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

// Pilot Card Component (for search results and available pilots)
function PilotCard({
  pilot,
  onInvite,
  actionLoading,
  t
}: {
  pilot: Pilot;
  onInvite: () => void;
  actionLoading: boolean;
  t: (key: string) => string;
}) {
  return (
    <div className="rounded-xl backdrop-blur-md bg-[rgba(70,151,210,0.15)] dark:bg-black/40 border border-[#4697D2]/30 dark:border-white/10 overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#4697D2] to-[#4697D2]/60 flex items-center justify-center text-white text-lg font-bold overflow-hidden flex-shrink-0">
            {pilot.avatar_url ? (
              <img src={pilot.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span>{pilot.first_name_ka?.[0]}{pilot.last_name_ka?.[0]}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-[#1a1a1a] dark:text-white">
              {pilot.first_name_ka} {pilot.last_name_ka}
            </h3>
            <p className="text-sm text-[#1a1a1a]/60 dark:text-white/60 truncate">
              {pilot.email}
            </p>
            {pilot.tandem_flights && pilot.tandem_flights > 0 && (
              <p className="text-xs text-[#4697D2]">
                {pilot.tandem_flights} {t('tandemFlights') || 'ტანდემ ფრენა'}
              </p>
            )}
          </div>
          <button
            onClick={onInvite}
            disabled={actionLoading}
            className="px-4 py-2 rounded-lg bg-[#4697D2] text-white text-sm font-medium hover:bg-[#4697D2]/90 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {actionLoading ? <Spinner size="sm" /> : (
              <>
                <Check className="w-4 h-4" />
                {t('invite') || 'მოწვევა'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Pilot Request Card Component (for active and pending pilots)
function PilotRequestCard({
  request,
  isPending,
  isSentInvite,
  onApprove,
  onRemove,
  actionLoading,
  t
}: {
  request: PilotCompanyRequest;
  isPending?: boolean;
  isSentInvite?: boolean;
  onApprove?: () => void;
  onRemove: () => void;
  actionLoading: boolean;
  t: (key: string) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showImages, setShowImages] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const pilot = request.pilot;

  // Collect all certificate images
  const certificateImages = [
    pilot.wing_certificate_url,
    pilot.pilot_harness_certificate_url,
    pilot.passenger_harness_certificate_url,
    pilot.reserve_certificate_url,
    ...(pilot.verification_documents || [])
  ].filter(Boolean) as string[];

  // Check if pilot has equipment info
  const hasEquipment = pilot.wing_brand || pilot.pilot_harness_brand || pilot.passenger_harness_brand || pilot.reserve_brand;

  return (
    <div className={cn(
      "rounded-xl backdrop-blur-md border overflow-hidden",
      isPending 
        ? "bg-amber-500/10 dark:bg-amber-500/5 border-amber-500/30"
        : "bg-green-500/10 dark:bg-green-500/5 border-green-500/30"
    )}>
      <div className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#4697D2] to-[#4697D2]/60 flex items-center justify-center text-white text-lg font-bold overflow-hidden flex-shrink-0">
            {pilot.avatar_url ? (
              <img src={pilot.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span>{pilot.first_name_ka?.[0]}{pilot.last_name_ka?.[0]}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-[#1a1a1a] dark:text-white">
                {pilot.first_name_ka} {pilot.last_name_ka}
              </h3>
              {isPending && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  {t('pendingStatus') || 'მომლოდინე'}
                </span>
              )}
              {isSentInvite && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-600 dark:text-blue-400">
                  {t('inviteSent') || 'მოწვევა გაგზავნილია'}
                </span>
              )}
            </div>
            {/* Stats row */}
            <div className="flex items-center gap-3 text-xs text-[#1a1a1a]/60 dark:text-white/60 mt-1">
              {pilot.tandem_flights && pilot.tandem_flights > 0 && (
                <span className="flex items-center gap-1">
                  <Plane className="w-3 h-3" />
                  {pilot.tandem_flights} ფრენა
                </span>
              )}
              {pilot.commercial_start_date && (
                <span>
                  {new Date().getFullYear() - new Date(pilot.commercial_start_date).getFullYear()} წლის გამოცდილება
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-lg hover:bg-[#1a1a1a]/5 dark:hover:bg-white/5 transition-colors"
          >
            <ChevronDown className={cn('w-5 h-5 text-[#1a1a1a]/60 dark:text-white/60 transition-transform', expanded && 'rotate-180')} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-[#4697D2]/20 dark:border-white/10 space-y-4">
          {/* Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm text-[#1a1a1a]/70 dark:text-white/70">
              <Phone className="w-4 h-4 text-[#4697D2]" />
              <a href={`tel:${pilot.phone}`} className="hover:text-[#4697D2]">{pilot.phone}</a>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#1a1a1a]/70 dark:text-white/70">
              <Mail className="w-4 h-4 text-[#4697D2]" />
              <a href={`mailto:${pilot.email}`} className="hover:text-[#4697D2] truncate">{pilot.email}</a>
            </div>
          </div>

          {/* Bio */}
          {pilot.bio_ka && (
            <p className="text-sm text-[#1a1a1a]/70 dark:text-white/70 bg-[#1a1a1a]/5 dark:bg-white/5 p-3 rounded-lg">
              {pilot.bio_ka}
            </p>
          )}

          {/* Equipment Section */}
          {hasEquipment && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-[#1a1a1a] dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#4697D2]" />
                {t('equipment') || 'აღჭურვილობა'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Wing */}
                {pilot.wing_brand && (
                  <div className="bg-[#1a1a1a]/5 dark:bg-white/5 p-3 rounded-lg">
                    <p className="text-xs text-[#1a1a1a]/50 dark:text-white/50 mb-1">{t('wing') || 'ფრთა'}</p>
                    <p className="text-sm font-medium text-[#1a1a1a] dark:text-white">
                      {pilot.wing_brand} {pilot.wing_model}
                    </p>
                  </div>
                )}
                {/* Pilot Harness */}
                {pilot.pilot_harness_brand && (
                  <div className="bg-[#1a1a1a]/5 dark:bg-white/5 p-3 rounded-lg">
                    <p className="text-xs text-[#1a1a1a]/50 dark:text-white/50 mb-1">{t('pilotHarness') || 'პილოტის სავარძელი'}</p>
                    <p className="text-sm font-medium text-[#1a1a1a] dark:text-white">
                      {pilot.pilot_harness_brand} {pilot.pilot_harness_model}
                    </p>
                  </div>
                )}
                {/* Passenger Harness */}
                {pilot.passenger_harness_brand && (
                  <div className="bg-[#1a1a1a]/5 dark:bg-white/5 p-3 rounded-lg">
                    <p className="text-xs text-[#1a1a1a]/50 dark:text-white/50 mb-1">{t('passengerHarness') || 'მგზავრის სავარძელი'}</p>
                    <p className="text-sm font-medium text-[#1a1a1a] dark:text-white">
                      {pilot.passenger_harness_brand} {pilot.passenger_harness_model}
                    </p>
                  </div>
                )}
                {/* Reserve */}
                {pilot.reserve_brand && (
                  <div className="bg-[#1a1a1a]/5 dark:bg-white/5 p-3 rounded-lg">
                    <p className="text-xs text-[#1a1a1a]/50 dark:text-white/50 mb-1">{t('reserve') || 'რეზერვი'}</p>
                    <p className="text-sm font-medium text-[#1a1a1a] dark:text-white">
                      {pilot.reserve_brand} {pilot.reserve_model}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Certificates/Documents Section */}
          {certificateImages.length > 0 && (
            <div className="space-y-3">
              <button
                onClick={() => setShowImages(!showImages)}
                className="text-sm font-semibold text-[#1a1a1a] dark:text-white flex items-center gap-2 hover:text-[#4697D2] transition-colors"
              >
                <ImageIcon className="w-4 h-4 text-[#4697D2]" />
                {t('viewDocuments') || 'დოკუმენტების ნახვა'} ({certificateImages.length})
                <ChevronDown className={cn('w-4 h-4 transition-transform', showImages && 'rotate-180')} />
              </button>
              
              {showImages && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {certificateImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className="aspect-square rounded-lg overflow-hidden border border-[#4697D2]/20 hover:border-[#4697D2] transition-colors"
                    >
                      <img src={img} alt={`Document ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Request Message */}
          {request.message && (
            <div className="bg-[#4697D2]/10 p-3 rounded-lg">
              <p className="text-xs text-[#4697D2] mb-1">{t('pilotMessage') || 'პილოტის შეტყობინება'}:</p>
              <p className="text-sm text-[#1a1a1a] dark:text-white italic">
                &quot;{request.message}&quot;
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-2">
            {isPending && onApprove && (
              <button
                onClick={onApprove}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {actionLoading ? <Spinner size="sm" /> : <Check className="w-4 h-4" />}
                {t('approve') || 'დამტკიცება'}
              </button>
            )}
            <button
              onClick={onRemove}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 text-sm font-medium hover:bg-red-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              {isSentInvite 
                ? (t('cancelInvite') || 'გაუქმება')
                : isPending 
                  ? (t('reject') || 'უარყოფა') 
                  : (t('remove') || 'წაშლა')
              }
            </button>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X className="w-8 h-8" />
            </button>
            <img 
              src={selectedImage} 
              alt="Document" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
