'use client';

import React, { useState } from 'react';
import { useSuperAdminBooking, BookingWithRelations } from '@/lib/context/SuperAdminBookingContext';
import { User, Building2, X, Users, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReassignDialogProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingWithRelations;
}

export function ReassignDialog({ isOpen, onClose, booking }: ReassignDialogProps) {
  const { reassignBooking, pilots, companies, isActionLoading } = useSuperAdminBooking();
  
  const [assignType, setAssignType] = useState<'pilot' | 'company'>('pilot');
  const [selectedPilotId, setSelectedPilotId] = useState<string>(booking.pilot_id || '');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(booking.company_id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data: any = {
      booking_id: booking.id,
      reason: reason || 'ადმინის მიერ გადანაწილება'
    };

    if (assignType === 'pilot') {
      if (!selectedPilotId) {
        toast.error('აირჩიეთ პილოტი');
        return;
      }
      data.new_pilot_id = selectedPilotId;
    } else {
      if (!selectedCompanyId) {
        toast.error('აირჩიეთ კომპანია');
        return;
      }
      data.new_company_id = selectedCompanyId;
    }

    const success = await reassignBooking(data);

    if (success) {
      toast.success('წარმატებით გადანაწილდა');
      onClose();
    } else {
      toast.error('გადანაწილება ვერ მოხერხდა');
    }
  };

  // Filter pilots based on search
  const filteredPilots = pilots.filter(p => {
    const name = `${p.first_name_ka || ''} ${p.last_name_ka || ''}`.toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  // Filter companies based on search
  const filteredCompanies = companies.filter(c => {
    const name = (c.name_ka || c.name_en || '').toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[60]"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white dark:bg-zinc-900 rounded-xl shadow-xl z-[60] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-zinc-900 dark:text-white">გადანაწილება</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Current Assignment */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <div className="text-xs text-zinc-500 mb-1">მიმდინარე მინიჭება</div>
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-zinc-700 dark:text-zinc-300">
                  პილოტი: {booking.pilot 
                    ? `${booking.pilot.first_name_ka || ''} ${booking.pilot.last_name_ka || ''}`.trim() 
                    : <span className="text-amber-600">დაუნიშნავი</span>}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-zinc-700 dark:text-zinc-300">
                  კომპანია: {booking.company?.name_ka || booking.company?.name_en || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Type Toggle */}
          <div className="flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-1">
            <button
              type="button"
              onClick={() => setAssignType('pilot')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                assignType === 'pilot'
                  ? 'bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <User className="w-4 h-4" />
              პილოტი
            </button>
            <button
              type="button"
              onClick={() => setAssignType('company')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                assignType === 'company'
                  ? 'bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <Building2 className="w-4 h-4" />
              კომპანია
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={assignType === 'pilot' ? 'ძებნა პილოტის სახელით...' : 'ძებნა კომპანიის სახელით...'}
              className="w-full pl-10 pr-4 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Selection List */}
          <div className="max-h-48 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-lg">
            {assignType === 'pilot' ? (
              filteredPilots.length === 0 ? (
                <div className="p-4 text-center text-sm text-zinc-500">
                  პილოტები ვერ მოიძებნა
                </div>
              ) : (
                filteredPilots.map(pilot => (
                  <label
                    key={pilot.id}
                    className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0 ${
                      selectedPilotId === pilot.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="pilot"
                      value={pilot.id}
                      checked={selectedPilotId === pilot.id}
                      onChange={(e) => setSelectedPilotId(e.target.value)}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex items-center gap-2">
                      {pilot.avatar_url ? (
                        <img
                          src={pilot.avatar_url}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                          <User className="w-4 h-4 text-indigo-600" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-zinc-900 dark:text-white">
                          {pilot.first_name_ka || ''} {pilot.last_name_ka || ''}
                        </div>
                        {pilot.phone && (
                          <div className="text-xs text-zinc-500">{pilot.phone}</div>
                        )}
                      </div>
                    </div>
                  </label>
                ))
              )
            ) : (
              filteredCompanies.length === 0 ? (
                <div className="p-4 text-center text-sm text-zinc-500">
                  კომპანიები ვერ მოიძებნა
                </div>
              ) : (
                filteredCompanies.map(company => (
                  <label
                    key={company.id}
                    className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0 ${
                      selectedCompanyId === company.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="company"
                      value={company.id}
                      checked={selectedCompanyId === company.id}
                      onChange={(e) => setSelectedCompanyId(e.target.value)}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex items-center gap-2">
                      {company.logo_url ? (
                        <img
                          src={company.logo_url}
                          alt=""
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-indigo-600" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-zinc-900 dark:text-white">
                          {company.name_ka || company.name_en}
                        </div>
                        {company.phone && (
                          <div className="text-xs text-zinc-500">{company.phone}</div>
                        )}
                      </div>
                    </div>
                  </label>
                ))
              )
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              მიზეზი (არასავალდებულო)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="მაგ: პილოტის დაკავებულობა..."
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              გაუქმება
            </button>
            <button
              type="submit"
              disabled={isActionLoading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isActionLoading ? 'იტვირთება...' : 'შენახვა'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default ReassignDialog;
