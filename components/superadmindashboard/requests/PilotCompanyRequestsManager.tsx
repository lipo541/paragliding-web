'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Building2,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  MessageSquare,
  UserPlus,
  UserMinus,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Send,
  X,
} from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import Image from 'next/image';

type RequestStatus = 'pending' | 'approved' | 'rejected';
type RequestType = 'pilot_request' | 'company_invite';

interface PilotCompanyRequest {
  id: string;
  pilot_id: string;
  company_id: string;
  status: RequestStatus;
  message: string | null;
  response_message: string | null;
  created_at: string;
  updated_at: string;
  responded_at: string | null;
  request_type: RequestType;
  pilot: {
    id: string;
    first_name_ka: string | null;
    last_name_ka: string | null;
    first_name_en: string | null;
    last_name_en: string | null;
    avatar_url: string | null;
    phone: string;
    email: string;
    company_id: string | null;
  };
  company: {
    id: string;
    name_ka: string | null;
    name_en: string | null;
    logo_url: string | null;
  };
}

interface Company {
  id: string;
  name_ka: string | null;
  name_en: string | null;
  logo_url: string | null;
}

interface Pilot {
  id: string;
  first_name_ka: string | null;
  last_name_ka: string | null;
  avatar_url: string | null;
  company_id: string | null;
  company?: Company | null;
}

export default function PilotCompanyRequestsManager() {
  const supabase = createClient();
  const [requests, setRequests] = useState<PilotCompanyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('pending');
  const [typeFilter, setTypeFilter] = useState<RequestType | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  
  // Direct assignment modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignPilotId, setAssignPilotId] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [pilots, setPilots] = useState<Pilot[]>([]);
  
  // Remove from company modal
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removePilotId, setRemovePilotId] = useState<string | null>(null);
  const [removeReason, setRemoveReason] = useState('');
  const [removePilotInfo, setRemovePilotInfo] = useState<Pilot | null>(null);

  // Stats
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    pilotRequests: 0,
    companyInvites: 0,
  });

  useEffect(() => {
    fetchRequests();
    fetchCompanies();
    fetchPilots();
  }, [statusFilter, typeFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('pilot_company_requests')
        .select(`
          *,
          pilot:pilots (
            id,
            first_name_ka,
            last_name_ka,
            first_name_en,
            last_name_en,
            avatar_url,
            phone,
            email,
            company_id
          ),
          company:companies (
            id,
            name_ka,
            name_en,
            logo_url
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (typeFilter !== 'all') {
        query = query.eq('request_type', typeFilter);
      }

      const { data, error } = await query;

      console.log('Fetch result - data:', data, 'error:', error);

      if (error) throw error;
      setRequests((data as PilotCompanyRequest[]) || []);

      // Calculate stats
      const { data: allRequests, error: statsError } = await supabase
        .from('pilot_company_requests')
        .select('status, request_type');

      console.log('Stats result - data:', allRequests, 'error:', statsError);

      if (statsError) {
        console.error('Stats error:', statsError);
      }

      if (allRequests) {
        const typedRequests = allRequests as { status: RequestStatus; request_type: RequestType }[];
        setStats({
          pending: typedRequests.filter(r => r.status === 'pending').length,
          approved: typedRequests.filter(r => r.status === 'approved').length,
          rejected: typedRequests.filter(r => r.status === 'rejected').length,
          pilotRequests: typedRequests.filter(r => r.request_type === 'pilot_request').length,
          companyInvites: typedRequests.filter(r => r.request_type === 'company_invite').length,
        });
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      // Log the raw error for debugging
      console.error('Raw error:', JSON.stringify(error, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    const { data } = await supabase
      .from('companies')
      .select('id, name_ka, name_en, logo_url')
      .order('name_ka');
    setCompanies(data || []);
  };

  const fetchPilots = async () => {
    const { data } = await supabase
      .from('pilots')
      .select(`
        id,
        first_name_ka,
        last_name_ka,
        avatar_url,
        company_id,
        company:companies!pilots_company_id_fkey (
          id,
          name_ka,
          name_en,
          logo_url
        )
      `)
      .order('first_name_ka');
    setPilots((data as Pilot[]) || []);
  };

  const handleApprove = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const { error } = await supabase.rpc('admin_approve_pilot_request', {
        p_request_id: requestId,
        p_response: responseMessage || null,
      });

      if (error) throw error;
      
      setResponseMessage('');
      setExpandedId(null);
      fetchRequests();
      fetchPilots();
    } catch (error) {
      console.error('Error approving request:', error);
      alert('შეცდომა მოთხოვნის დამტკიცებისას');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const { error } = await supabase.rpc('admin_reject_pilot_request', {
        p_request_id: requestId,
        p_response: responseMessage || null,
      });

      if (error) throw error;
      
      setResponseMessage('');
      setExpandedId(null);
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('შეცდომა მოთხოვნის უარყოფისას');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDirectAssign = async () => {
    if (!assignPilotId || !selectedCompanyId) return;
    
    setActionLoading('assign');
    try {
      const { error } = await supabase.rpc('admin_assign_pilot_to_company', {
        p_pilot_id: assignPilotId,
        p_company_id: selectedCompanyId,
      });

      console.log('Assign result error:', error);
      if (error) {
        console.error('Assign error details:', JSON.stringify(error, null, 2));
        throw error;
      }
      
      setShowAssignModal(false);
      setAssignPilotId(null);
      setSelectedCompanyId('');
      fetchRequests();
      fetchPilots();
      alert('პილოტი წარმატებით მიეკუთვნა კომპანიას');
    } catch (error) {
      console.error('Error assigning pilot:', error);
      console.error('Error assigning pilot (raw):', JSON.stringify(error, null, 2));
      alert('შეცდომა პილოტის მიკუთვნებისას - ფუნქცია შესაძლოა არ არსებობს. გაუშვით SQL migration.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFromCompany = async () => {
    if (!removePilotId) return;
    
    setActionLoading('remove');
    try {
      const { error } = await supabase.rpc('admin_remove_pilot_from_company', {
        p_pilot_id: removePilotId,
        p_reason: removeReason || null,
      });

      if (error) throw error;
      
      setShowRemoveModal(false);
      setRemovePilotId(null);
      setRemoveReason('');
      setRemovePilotInfo(null);
      fetchRequests();
      fetchPilots();
    } catch (error) {
      console.error('Error removing pilot:', error);
      alert('შეცდომა პილოტის გათავისუფლებისას');
    } finally {
      setActionLoading(null);
    }
  };

  const openRemoveModal = (pilot: Pilot) => {
    setRemovePilotId(pilot.id);
    setRemovePilotInfo(pilot);
    setShowRemoveModal(true);
  };

  const filteredRequests = requests.filter(request => {
    if (!searchQuery) return true;
    const pilotName = `${request.pilot?.first_name_ka || ''} ${request.pilot?.last_name_ka || ''}`.toLowerCase();
    const companyName = (request.company?.name_ka || '').toLowerCase();
    return pilotName.includes(searchQuery.toLowerCase()) || companyName.includes(searchQuery.toLowerCase());
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ka-GE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: RequestStatus) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    const labels = {
      pending: 'მოლოდინში',
      approved: 'დამტკიცებული',
      rejected: 'უარყოფილი',
    };
    const icons = {
      pending: <Clock className="w-3 h-3 mr-1" />,
      approved: <CheckCircle className="w-3 h-3 mr-1" />,
      rejected: <XCircle className="w-3 h-3 mr-1" />,
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {icons[status]}
        {labels[status]}
      </span>
    );
  };

  const getTypeBadge = (type: RequestType) => {
    const isPilotRequest = type === 'pilot_request';
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        isPilotRequest 
          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' 
          : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      }`}>
        {isPilotRequest ? (
          <>
            <User className="w-3 h-3 mr-1" />
            პილოტის მოთხოვნა
          </>
        ) : (
          <>
            <Building2 className="w-3 h-3 mr-1" />
            კომპანიის მოწვევა
          </>
        )}
      </span>
    );
  };

  // Pilots with company (for removal list)
  const pilotsWithCompany = pilots.filter(p => p.company_id);
  // Pilots without company (for assignment)
  const pilotsWithoutCompany = pilots.filter(p => !p.company_id);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-400">მოლოდინში</span>
          </div>
          <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">{stats.pending}</p>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-800 dark:text-green-400">დამტკიცებული</span>
          </div>
          <p className="text-2xl font-bold text-green-900 dark:text-green-300">{stats.approved}</p>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium text-red-800 dark:text-red-400">უარყოფილი</span>
          </div>
          <p className="text-2xl font-bold text-red-900 dark:text-red-300">{stats.rejected}</p>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-400">პილოტის მოთხოვნა</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">{stats.pilotRequests}</p>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-800 dark:text-purple-400">კომპანიის მოწვევა</span>
          </div>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">{stats.companyInvites}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setShowAssignModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          პილოტის მიკუთვნება კომპანიას
        </button>
        
        {pilotsWithCompany.length > 0 && (
          <button
            onClick={() => setShowRemoveModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <UserMinus className="w-4 h-4" />
            პილოტის გათავისუფლება
          </button>
        )}
        
        <button
          onClick={() => fetchRequests()}
          className="flex items-center gap-2 px-4 py-2 bg-foreground/10 text-foreground rounded-lg hover:bg-foreground/20 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          განახლება
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-foreground/5 rounded-lg p-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
          <input
            type="text"
            placeholder="ძებნა პილოტის ან კომპანიის სახელით..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-foreground/20 bg-background focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as RequestStatus | 'all')}
            className="px-4 py-2 rounded-lg border border-foreground/20 bg-background focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">ყველა სტატუსი</option>
            <option value="pending">მოლოდინში</option>
            <option value="approved">დამტკიცებული</option>
            <option value="rejected">უარყოფილი</option>
          </select>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as RequestType | 'all')}
            className="px-4 py-2 rounded-lg border border-foreground/20 bg-background focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">ყველა ტიპი</option>
            <option value="pilot_request">პილოტის მოთხოვნა</option>
            <option value="company_invite">კომპანიის მოწვევა</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-12 bg-foreground/5 rounded-lg">
          <AlertCircle className="w-12 h-12 mx-auto text-foreground/30 mb-4" />
          <p className="text-foreground/60">მოთხოვნები არ მოიძებნა</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className="bg-background border border-foreground/10 rounded-lg overflow-hidden hover:border-foreground/20 transition-colors"
            >
              {/* Request Header */}
              <div 
                className="p-4 cursor-pointer"
                onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Direction Indicator */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Pilot */}
                      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-foreground/10">
                        {request.pilot?.avatar_url ? (
                          <Image
                            src={request.pilot.avatar_url}
                            alt="Pilot"
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 absolute inset-0 m-auto text-foreground/50" />
                        )}
                      </div>
                      
                      {/* Arrow */}
                      {request.request_type === 'pilot_request' ? (
                        <ArrowRight className="w-4 h-4 text-blue-500" />
                      ) : (
                        <ArrowLeft className="w-4 h-4 text-purple-500" />
                      )}
                      
                      {/* Company */}
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-foreground/10">
                        {request.company?.logo_url ? (
                          <Image
                            src={request.company.logo_url}
                            alt="Company"
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <Building2 className="w-6 h-6 absolute inset-0 m-auto text-foreground/50" />
                        )}
                      </div>
                    </div>
                    
                    {/* Names */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground truncate">
                          {request.pilot?.first_name_ka} {request.pilot?.last_name_ka}
                        </span>
                        <span className="text-foreground/50">→</span>
                        <span className="font-medium text-foreground truncate">
                          {request.company?.name_ka}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-foreground/60">
                        <Calendar className="w-3 h-3" />
                        {formatDate(request.created_at)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Status & Type */}
                  <div className="flex items-center gap-2 shrink-0">
                    {getTypeBadge(request.request_type)}
                    {getStatusBadge(request.status)}
                    {expandedId === request.id ? (
                      <ChevronUp className="w-5 h-5 text-foreground/50" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-foreground/50" />
                    )}
                  </div>
                </div>
              </div>
              
              {/* Expanded Content */}
              {expandedId === request.id && (
                <div className="border-t border-foreground/10 p-4 bg-foreground/5">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Pilot Info */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-foreground flex items-center gap-2">
                        <User className="w-4 h-4" />
                        პილოტი
                      </h4>
                      <div className="pl-6 space-y-1 text-sm">
                        <p><span className="text-foreground/60">სახელი:</span> {request.pilot?.first_name_ka} {request.pilot?.last_name_ka}</p>
                        <p><span className="text-foreground/60">ტელეფონი:</span> {request.pilot?.phone}</p>
                        <p><span className="text-foreground/60">იმეილი:</span> {request.pilot?.email}</p>
                        {request.pilot?.company_id && (
                          <p className="text-yellow-600 dark:text-yellow-400">
                            <AlertCircle className="w-3 h-3 inline mr-1" />
                            უკვე აქვს კომპანია მინიჭებული
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Company Info */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-foreground flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        კომპანია
                      </h4>
                      <div className="pl-6 space-y-1 text-sm">
                        <p><span className="text-foreground/60">სახელი:</span> {request.company?.name_ka}</p>
                        <p><span className="text-foreground/60">ID:</span> {request.company?.id}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Messages */}
                  {(request.message || request.response_message) && (
                    <div className="mt-4 space-y-2">
                      {request.message && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                          <p className="text-blue-800 dark:text-blue-400 font-medium mb-1 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            შეტყობინება:
                          </p>
                          <p className="text-blue-900 dark:text-blue-300">{request.message}</p>
                        </div>
                      )}
                      {request.response_message && (
                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm">
                          <p className="text-foreground/70 font-medium mb-1">პასუხი:</p>
                          <p className="text-foreground">{request.response_message}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Actions for pending requests */}
                  {request.status === 'pending' && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-foreground/70 mb-1">
                          პასუხის შეტყობინება (ოპციონალური)
                        </label>
                        <textarea
                          value={responseMessage}
                          onChange={(e) => setResponseMessage(e.target.value)}
                          placeholder="მიუთითეთ მიზეზი ან დატოვეთ კომენტარი..."
                          className="w-full px-3 py-2 rounded-lg border border-foreground/20 bg-background focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                          rows={2}
                        />
                      </div>
                      
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApprove(request.id)}
                          disabled={actionLoading === request.id}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === request.id ? (
                            <Spinner size="sm" />
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              დამტკიცება
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => handleReject(request.id)}
                          disabled={actionLoading === request.id}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === request.id ? (
                            <Spinner size="sm" />
                          ) : (
                            <>
                              <XCircle className="w-4 h-4" />
                              უარყოფა
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Response date for processed requests */}
                  {request.responded_at && (
                    <p className="mt-4 text-sm text-foreground/60">
                      დამუშავდა: {formatDate(request.responded_at)}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Direct Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="p-4 border-b border-foreground/10 flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-green-600" />
                პილოტის მიკუთვნება კომპანიას
              </h3>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setAssignPilotId(null);
                  setSelectedCompanyId('');
                }}
                className="p-1 hover:bg-foreground/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-2">
                  აირჩიეთ პილოტი
                </label>
                <select
                  value={assignPilotId || ''}
                  onChange={(e) => setAssignPilotId(e.target.value || null)}
                  className="w-full px-3 py-2 rounded-lg border border-foreground/20 bg-background focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">-- აირჩიეთ --</option>
                  <optgroup label="კომპანიის გარეშე">
                    {pilotsWithoutCompany.map(pilot => (
                      <option key={pilot.id} value={pilot.id}>
                        {pilot.first_name_ka} {pilot.last_name_ka}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="კომპანიით (გადაყვანა)">
                    {pilotsWithCompany.map(pilot => (
                      <option key={pilot.id} value={pilot.id}>
                        {pilot.first_name_ka} {pilot.last_name_ka} ({pilot.company?.name_ka})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-2">
                  აირჩიეთ კომპანია
                </label>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-foreground/20 bg-background focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">-- აირჩიეთ --</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name_ka}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setAssignPilotId(null);
                    setSelectedCompanyId('');
                  }}
                  className="flex-1 px-4 py-2 border border-foreground/20 rounded-lg hover:bg-foreground/5 transition-colors"
                >
                  გაუქმება
                </button>
                <button
                  onClick={handleDirectAssign}
                  disabled={!assignPilotId || !selectedCompanyId || actionLoading === 'assign'}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'assign' ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      მიკუთვნება
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove from Company Modal */}
      {showRemoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="p-4 border-b border-foreground/10 flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <UserMinus className="w-5 h-5 text-red-600" />
                პილოტის გათავისუფლება კომპანიიდან
              </h3>
              <button
                onClick={() => {
                  setShowRemoveModal(false);
                  setRemovePilotId(null);
                  setRemoveReason('');
                  setRemovePilotInfo(null);
                }}
                className="p-1 hover:bg-foreground/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-2">
                  აირჩიეთ პილოტი
                </label>
                <select
                  value={removePilotId || ''}
                  onChange={(e) => {
                    const pilotId = e.target.value || null;
                    setRemovePilotId(pilotId);
                    setRemovePilotInfo(pilotsWithCompany.find(p => p.id === pilotId) || null);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-foreground/20 bg-background focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">-- აირჩიეთ --</option>
                  {pilotsWithCompany.map(pilot => (
                    <option key={pilot.id} value={pilot.id}>
                      {pilot.first_name_ka} {pilot.last_name_ka} - {pilot.company?.name_ka}
                    </option>
                  ))}
                </select>
              </div>
              
              {removePilotInfo && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm">
                  <p className="text-red-800 dark:text-red-400">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    {removePilotInfo.first_name_ka} {removePilotInfo.last_name_ka} გათავისუფლდება კომპანიიდან: {removePilotInfo.company?.name_ka}
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-2">
                  მიზეზი (ოპციონალური)
                </label>
                <textarea
                  value={removeReason}
                  onChange={(e) => setRemoveReason(e.target.value)}
                  placeholder="მიუთითეთ გათავისუფლების მიზეზი..."
                  className="w-full px-3 py-2 rounded-lg border border-foreground/20 bg-background focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  rows={2}
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => {
                    setShowRemoveModal(false);
                    setRemovePilotId(null);
                    setRemoveReason('');
                    setRemovePilotInfo(null);
                  }}
                  className="flex-1 px-4 py-2 border border-foreground/20 rounded-lg hover:bg-foreground/5 transition-colors"
                >
                  გაუქმება
                </button>
                <button
                  onClick={handleRemoveFromCompany}
                  disabled={!removePilotId || actionLoading === 'remove'}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'remove' ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      <UserMinus className="w-4 h-4" />
                      გათავისუფლება
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
