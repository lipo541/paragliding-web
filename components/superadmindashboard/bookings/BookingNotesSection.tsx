'use client';

import React, { useState } from 'react';
import { useSuperAdminBooking } from '@/lib/context/SuperAdminBookingContext';
import { StickyNote, Pin, Trash2, Send, Plus, AlertCircle, User, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface BookingNotesSectionProps {
  bookingId: string;
}

export function BookingNotesSection({ bookingId }: BookingNotesSectionProps) {
  const { bookingNotes, addBookingNote, deleteBookingNote, toggleNotePin } = useSuperAdminBooking();
  
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'info' | 'warning' | 'action'>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newNote.trim()) {
      toast.error('შეიყვანეთ შენიშვნა');
      return;
    }

    setIsSubmitting(true);
    
    const success = await addBookingNote({
      booking_id: bookingId,
      note: newNote.trim(),
      note_type: noteType
    });

    if (success) {
      toast.success('შენიშვნა დაემატა');
      setNewNote('');
      setShowAddNote(false);
    } else {
      toast.error('შენიშვნის დამატება ვერ მოხერხდა');
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm('წავშალოთ შენიშვნა?')) return;
    
    const success = await deleteBookingNote(noteId);
    if (success) {
      toast.success('შენიშვნა წაიშალა');
    }
  };

  const handleTogglePin = async (noteId: string, currentPinned: boolean) => {
    await toggleNotePin(noteId, !currentPinned);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('ka-GE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNoteTypeStyles = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      case 'important':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <div className="space-y-3">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
          <StickyNote className="w-4 h-4" />
          შენიშვნები ({bookingNotes.length})
        </h3>
        <button
          onClick={() => setShowAddNote(!showAddNote)}
          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          დამატება
        </button>
      </div>

      {/* Add Note Form */}
      {showAddNote && (
        <form onSubmit={handleSubmit} className="p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg space-y-3">
          <div>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={2}
              placeholder="შეიყვანეთ შენიშვნა..."
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
          
          <div className="flex items-center justify-between">
            {/* Note Type */}
            <div className="flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5">
              {[
                { id: 'info', label: 'ინფო', icon: StickyNote },
                { id: 'warning', label: 'გაფრთხ.', icon: AlertCircle },
                { id: 'action', label: 'მოქმედება', icon: AlertCircle },
              ].map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setNoteType(type.id as any)}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                    noteType === type.id
                      ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* Submit */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddNote(false)}
                className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-800 transition-colors"
              >
                გაუქმება
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !newNote.trim()}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Send className="w-3 h-3" />
                დამატება
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Notes List */}
      {bookingNotes.length === 0 ? (
        <div className="text-center py-6 text-sm text-zinc-500">
          შენიშვნები არ არის
        </div>
      ) : (
        <div className="space-y-2">
          {bookingNotes.map(note => (
            <div
              key={note.id}
              className={`relative p-3 border rounded-lg ${getNoteTypeStyles(note.note_type || 'info')}`}
            >
              {/* Pinned Badge */}
              {note.is_pinned && (
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <Pin className="w-3 h-3 text-white" />
                </div>
              )}

              {/* Content */}
              <p className="text-sm text-zinc-800 dark:text-zinc-200 pr-16">
                {note.note}
              </p>

              {/* Meta */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-700/50">
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {note.author_name || 'Admin'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(note.created_at)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleTogglePin(note.id, note.is_pinned || false)}
                    className={`p-1 rounded hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 transition-colors ${
                      note.is_pinned ? 'text-blue-600' : 'text-zinc-400'
                    }`}
                    title={note.is_pinned ? 'ამოპინვა' : 'დაპინვა'}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="p-1 rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="წაშლა"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BookingNotesSection;
