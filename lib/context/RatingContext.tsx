'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type RatableType = 'country' | 'location' | 'flight_type' | 'pilot';

interface RatingData {
  id: string;
  rating: number;
  created_at: string;
  updated_at: string;
}

interface RatingStats {
  averageRating: number;
  totalCount: number;
  userRating: number | null;
}

interface RatingContextType {
  // State
  isModalOpen: boolean;
  currentRatable: { type: RatableType; id: string; title?: string; subtitle?: string } | null;
  isSubmitting: boolean;
  error: string | null;
  
  // Actions
  openRatingModal: (type: RatableType, id: string, title?: string, subtitle?: string) => void;
  closeRatingModal: () => void;
  submitRating: (rating: number) => Promise<boolean>;
  deleteRating: () => Promise<boolean>;
  fetchUserRating: (type: RatableType, id: string) => Promise<number | null>;
  fetchRatingStats: (type: RatableType, id: string) => Promise<RatingStats>;
  
  // Utility
  isAuthenticated: boolean;
  checkAuth: () => Promise<boolean>;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

const RatingContext = createContext<RatingContextType | undefined>(undefined);

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

interface RatingProviderProps {
  children: ReactNode;
}

export function RatingProvider({ children }: RatingProviderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRatable, setCurrentRatable] = useState<{ type: RatableType; id: string; title?: string; subtitle?: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const supabase = createClient();

  // Check authentication
  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const authenticated = !!user;
      setIsAuthenticated(authenticated);
      return authenticated;
    } catch {
      setIsAuthenticated(false);
      return false;
    }
  }, [supabase.auth]);

  // Open rating modal
  const openRatingModal = useCallback((type: RatableType, id: string, title?: string, subtitle?: string) => {
    setCurrentRatable({ type, id, title, subtitle });
    setError(null);
    setIsModalOpen(true);
  }, []);

  // Close rating modal
  const closeRatingModal = useCallback(() => {
    setIsModalOpen(false);
    setError(null);
    // Delay clearing currentRatable for animation
    setTimeout(() => setCurrentRatable(null), 300);
  }, []);

  // Fetch user's rating for a specific item
  const fetchUserRating = useCallback(async (type: RatableType, id: string): Promise<number | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('ratings')
        .select('rating')
        .eq('user_id', user.id)
        .eq('ratable_type', type)
        .eq('ratable_id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user rating:', error);
        return null;
      }

      return data?.rating || null;
    } catch (err) {
      console.error('Error fetching user rating:', err);
      return null;
    }
  }, [supabase]);

  // Fetch rating statistics
  const fetchRatingStats = useCallback(async (type: RatableType, id: string): Promise<RatingStats> => {
    try {
      // Get all ratings for this item
      const { data: ratings, error: ratingsError } = await supabase
        .from('ratings')
        .select('rating')
        .eq('ratable_type', type)
        .eq('ratable_id', id);

      if (ratingsError) {
        console.error('Error fetching ratings:', ratingsError);
        return { averageRating: 0, totalCount: 0, userRating: null };
      }

      const totalCount = ratings?.length || 0;
      const averageRating = totalCount > 0
        ? ratings.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / totalCount
        : 0;

      // Get user's rating if authenticated
      const userRating = await fetchUserRating(type, id);

      return {
        averageRating: Number(averageRating.toFixed(1)),
        totalCount,
        userRating,
      };
    } catch (err) {
      console.error('Error fetching rating stats:', err);
      return { averageRating: 0, totalCount: 0, userRating: null };
    }
  }, [supabase, fetchUserRating]);

  // Submit rating
  const submitRating = useCallback(async (rating: number): Promise<boolean> => {
    if (!currentRatable) {
      setError('No item selected for rating');
      return false;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('გთხოვთ გაიაროთ ავტორიზაცია შეფასებისთვის');
        setIsSubmitting(false);
        return false;
      }

      const { type, id } = currentRatable;

      // Check if rating already exists
      const { data: existingRating } = await supabase
        .from('ratings')
        .select('id')
        .eq('user_id', user.id)
        .eq('ratable_type', type)
        .eq('ratable_id', id)
        .single();

      let result;

      if (existingRating) {
        // Update existing rating
        result = await supabase
          .from('ratings')
          .update({
            rating,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .eq('ratable_type', type)
          .eq('ratable_id', id);
      } else {
        // Insert new rating
        result = await supabase
          .from('ratings')
          .insert({
            user_id: user.id,
            ratable_type: type,
            ratable_id: id,
            rating,
          });
      }

      if (result.error) {
        console.error('Rating error:', result.error);
        setError('შეფასების შენახვა ვერ მოხერხდა');
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error submitting rating:', err);
      setError('შეფასების შენახვა ვერ მოხერხდა');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [currentRatable, supabase]);

  // Delete rating
  const deleteRating = useCallback(async (): Promise<boolean> => {
    if (!currentRatable) return false;

    setIsSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { type, id } = currentRatable;

      const { error } = await supabase
        .from('ratings')
        .delete()
        .eq('user_id', user.id)
        .eq('ratable_type', type)
        .eq('ratable_id', id);

      if (error) {
        console.error('Error deleting rating:', error);
        setError('შეფასების წაშლა ვერ მოხერხდა');
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error deleting rating:', err);
      setError('შეფასების წაშლა ვერ მოხერხდა');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [currentRatable, supabase]);

  const value: RatingContextType = {
    isModalOpen,
    currentRatable,
    isSubmitting,
    error,
    openRatingModal,
    closeRatingModal,
    submitRating,
    deleteRating,
    fetchUserRating,
    fetchRatingStats,
    isAuthenticated,
    checkAuth,
  };

  return (
    <RatingContext.Provider value={value}>
      {children}
    </RatingContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════

export function useRating() {
  const context = useContext(RatingContext);
  if (context === undefined) {
    throw new Error('useRating must be used within a RatingProvider');
  }
  return context;
}

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL RATING MODAL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function GlobalRatingModal() {
  const {
    isModalOpen,
    currentRatable,
    isSubmitting,
    error,
    closeRatingModal,
    submitRating,
    fetchUserRating,
  } = useRating();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);

  // Fetch existing rating when modal opens
  useState(() => {
    if (isModalOpen && currentRatable) {
      fetchUserRating(currentRatable.type, currentRatable.id).then((r) => {
        if (r) {
          setRating(r);
          setUserRating(r);
        }
      });
    }
  });

  const handleSubmit = async (selectedRating: number) => {
    const success = await submitRating(selectedRating);
    if (success) {
      setRating(selectedRating);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        closeRatingModal();
      }, 1500);
    }
  };

  if (!isModalOpen || !currentRatable) return null;

  const displayRating = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeRatingModal} />

      {/* Modal */}
      <div className="relative w-full max-w-md backdrop-blur-xl bg-white/95 dark:bg-black/95 rounded-2xl shadow-2xl border border-white/30 dark:border-white/10 overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-yellow-400/20 via-orange-400/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-yellow-500/20 via-amber-400/10 to-transparent rounded-full blur-3xl" />
        
        {/* Close Button */}
        <button
          onClick={closeRatingModal}
          className="absolute top-4 right-4 z-10 p-2 rounded-full backdrop-blur-md bg-white/30 dark:bg-black/20 hover:bg-white/40 dark:hover:bg-black/30 border border-white/30 dark:border-white/10 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="relative p-8 pb-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {currentRatable.title || 'შეაფასე'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              {currentRatable.subtitle || 'შენი აზრი მნიშვნელოვანია'}
            </p>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className="mb-6 p-4 rounded-xl bg-green-500/20 border border-green-500/30 text-center">
              <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">შეფასება შენახულია!</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-center">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Stars */}
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleSubmit(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                disabled={isSubmitting}
                className="group p-1 transition-transform hover:scale-110 disabled:opacity-50"
              >
                <svg
                  className={`w-10 h-10 transition-colors ${
                    star <= displayRating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'fill-gray-200 dark:fill-gray-700 text-gray-200 dark:text-gray-700'
                  }`}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
          </div>

          {/* Rating Text */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {displayRating > 0 ? `${displayRating} / 5` : 'აირჩიე შეფასება'}
          </p>
        </div>
      </div>
    </div>
  );
}
