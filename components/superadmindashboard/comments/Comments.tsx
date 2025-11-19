'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow, format } from 'date-fns';
import { ka } from 'date-fns/locale';
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
  XCircle,
  ExternalLink,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Trash2,
  Clock,
  MapPin,
  User,
  Calendar,
  RefreshCw,
} from 'lucide-react';

interface Comment {
  id: string;
  user_id: string;
  content: string;
  parent_comment_id: string | null;
  commentable_type: 'country' | 'location' | 'flight_type';
  commentable_id: string;
  likes_count: number;
  dislikes_count: number;
  created_at: string;
  updated_at: string;
  is_approved: boolean;
  approved_at: string | null;
  approved_by: string | null;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  };
  countries?: {
    id: string;
    name_ka: string;
    slug_ka: string;
  };
  locations?: {
    id: string;
    title_ka: string;
    country_id: string;
    slug: string;
  };
  parent_info?: {
    content: string;
    author: string;
  } | null;
  country_slug?: string;
}

type FilterType = 'all' | 'unapproved' | 'approved' | 'replies';
type SortType = 'newest' | 'oldest' | 'most_liked' | 'most_disliked';

export default function Comments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('unapproved');
  const [sortBy, setSortBy] = useState<SortType>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [selectedType, setSelectedType] = useState<'all' | 'country' | 'location'>('all');
  const supabase = createClient();

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    setLoading(true);
    try {
      // Fetch all comments
      const { data: commentsData, error } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Query error:', error);
        throw error;
      }

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(commentsData.map((c: any) => c.user_id))];

      // Fetch all profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map((p: any) => [p.id, p]) || []);

      // Get unique commentable IDs
      const countryIds = commentsData
        .filter((c: any) => c.commentable_type === 'country')
        .map((c: any) => c.commentable_id);

      const locationIds = commentsData
        .filter((c: any) => c.commentable_type === 'location')
        .map((c: any) => c.commentable_id);

      // Fetch countries with slugs
      let countriesMap = new Map();
      if (countryIds.length > 0) {
        const { data: countriesData } = await supabase
          .from('countries')
          .select('id, name_ka, slug_ka')
          .in('id', countryIds);
        countriesMap = new Map(countriesData?.map((c: any) => [c.id, c]) || []);
      }

      // Fetch location names and slugs from locations table
      let locationsMap = new Map();
      if (locationIds.length > 0) {
        // Get all needed data from locations table directly
        const { data: locationsData, error: locationsError } = await supabase
          .from('locations')
          .select('id, name_ka, slug_ka, country_id')
          .in('id', locationIds);
        
        console.log('Locations data from DB:', locationsData, 'Error:', locationsError);
        
        locationsMap = new Map(
          locationsData?.map((loc: any) => [
            loc.id,
            {
              id: loc.id,
              title_ka: loc.name_ka,
              country_id: loc.country_id,
              slug: loc.slug_ka,
            },
          ]) || []
        );
      }

      // Get country slugs for locations
      const locationCountryIds = [...new Set(
        Array.from(locationsMap.values()).map((l: any) => l.country_id)
      )];
      
      console.log('Location country IDs:', locationCountryIds);

      let locationCountriesMap = new Map();
      if (locationCountryIds.length > 0) {
        const { data: locationCountriesData, error: locationCountriesError } = await supabase
          .from('countries')
          .select('id, slug_ka')
          .in('id', locationCountryIds);
        console.log('Location countries data from DB:', locationCountriesData, 'Error:', locationCountriesError);
        locationCountriesMap = new Map(
          locationCountriesData?.map((c: any) => [c.id, c.slug_ka]) || []
        );
      }
      
      console.log('Final locationCountriesMap:', locationCountriesMap);

      // Build parent comment lookup
      const commentsMap = new Map(commentsData.map((c: any) => [c.id, c]));

      // Enrich comments
      const enrichedComments = commentsData.map((comment: any) => {
        const profile = profilesMap.get(comment.user_id);

        let relatedData: any = {};
        let countrySlug = '';

        if (comment.commentable_type === 'country') {
          const country = countriesMap.get(comment.commentable_id);
          if (country) {
            relatedData.countries = country;
            countrySlug = country.slug_ka;
          }
        } else if (comment.commentable_type === 'location') {
          const location = locationsMap.get(comment.commentable_id);
          if (location) {
            relatedData.locations = location;
            countrySlug = locationCountriesMap.get(location.country_id) || '';
          }
        }

        // Parent comment info
        let parentInfo = null;
        if (comment.parent_comment_id) {
          const parentComment = commentsMap.get(comment.parent_comment_id);
          if (parentComment) {
            const parentProfile = profilesMap.get(parentComment.user_id);
            parentInfo = {
              content: parentComment.content.substring(0, 100),
              author: parentProfile?.full_name || 'მომხმარებელი',
            };
          }
        }

        const enrichedComment = {
          ...comment,
          profiles: profile || { full_name: null, avatar_url: null },
          ...relatedData,
          parent_info: parentInfo,
          country_slug: countrySlug,
        };
        
        // Debug log for locations
        if (comment.commentable_type === 'location') {
          const countryId = enrichedComment.locations?.country_id;
          console.log('Location comment enriched:', {
            commentable_id: comment.commentable_id,
            has_locations: !!enrichedComment.locations,
            locations: enrichedComment.locations,
            country_slug: enrichedComment.country_slug,
            location_country_id: countryId,
            locationCountriesMap_has_it: locationCountriesMap.has(countryId),
            locationCountriesMap_get: locationCountriesMap.get(countryId),
            locationCountriesMap_size: locationCountriesMap.size,
            locationCountriesMap_keys: Array.from(locationCountriesMap.keys()),
          });
        }
        
        return enrichedComment;
      });

      setComments(enrichedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (commentId: string) => {
    setProcessingIds((prev) => new Set(prev).add(commentId));
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('comments')
        .update({
          is_approved: true,
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        })
        .eq('id', commentId);

      if (error) throw error;
      await fetchComments();
    } catch (error) {
      console.error('Error approving comment:', error);
      alert('დადასტურება ვერ მოხერხდა');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('დარწმუნებული ხართ რომ გსურთ კომენტარის წაშლა? ეს მოქმედება შეუქცევადია.'))
      return;

    setProcessingIds((prev) => new Set(prev).add(commentId));
    try {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);

      if (error) throw error;
      await fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('წაშლა ვერ მოხერხდა');
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    }
  };

  const handleBulkApprove = async () => {
    const unapprovedComments = filteredAndSortedComments.filter((c) => !c.is_approved);
    if (unapprovedComments.length === 0) return;

    if (
      !confirm(
        `დარწმუნებული ხართ რომ გსურთ ${unapprovedComments.length} კომენტარის დადასტურება?`
      )
    )
      return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('comments')
        .update({
          is_approved: true,
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        })
        .in(
          'id',
          unapprovedComments.map((c) => c.id)
        );

      if (error) throw error;
      await fetchComments();
    } catch (error) {
      console.error('Error bulk approving:', error);
      alert('ჯგუფური დადასტურება ვერ მოხერხდა');
    }
  };

  const getCommentableLink = (comment: Comment): string => {
    if (comment.commentable_type === 'country' && comment.countries?.slug_ka) {
      const url = `/ka/locations/${comment.countries.slug_ka}`;
      console.log('Country link:', url, comment.countries);
      return url;
    } else if (comment.commentable_type === 'location' && comment.locations?.slug && comment.country_slug) {
      const url = `/ka/locations/${comment.country_slug}/${comment.locations.slug}`;
      console.log('Location link:', url, comment);
      return url;
    }
    console.warn('Could not generate link for comment:', comment);
    return '#';
  };

  const getCommentableName = (comment: Comment): string => {
    if (comment.commentable_type === 'country' && comment.countries) {
      return comment.countries.name_ka;
    } else if (comment.commentable_type === 'location' && comment.locations) {
      return comment.locations.title_ka;
    }
    return 'N/A';
  };

  const toggleExpand = (commentId: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  // Filtering and Sorting Logic
  const filteredAndSortedComments = useMemo(() => {
    let filtered = [...comments];

    // Filter by approval status
    if (filter === 'unapproved') {
      filtered = filtered.filter((c) => !c.is_approved);
    } else if (filter === 'approved') {
      filtered = filtered.filter((c) => c.is_approved);
    } else if (filter === 'replies') {
      filtered = filtered.filter((c) => c.parent_comment_id !== null);
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter((c) => c.commentable_type === selectedType);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.content.toLowerCase().includes(query) ||
          c.profiles.full_name?.toLowerCase().includes(query) ||
          getCommentableName(c).toLowerCase().includes(query)
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'most_liked':
          return b.likes_count - a.likes_count;
        case 'most_disliked':
          return b.dislikes_count - a.dislikes_count;
        default:
          return 0;
      }
    });

    return filtered;
  }, [comments, filter, selectedType, searchQuery, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: comments.length,
      unapproved: comments.filter((c) => !c.is_approved).length,
      approved: comments.filter((c) => c.is_approved).length,
      replies: comments.filter((c) => c.parent_comment_id !== null).length,
      countries: comments.filter((c) => c.commentable_type === 'country').length,
      locations: comments.filter((c) => c.commentable_type === 'location').length,
    };
  }, [comments]);

  return (
    <div className="h-full flex flex-col">
      {/* Header with Stats */}
      <div className="p-6 border-b border-foreground/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">კომენტარების მართვა</h2>
            <p className="text-sm text-foreground/60 mt-1">
              სრული კონტროლი ყველა კომენტარზე
            </p>
          </div>
          <button
            onClick={fetchComments}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-foreground/5 hover:bg-foreground/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            განახლება
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
              სულ
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.total}
            </div>
          </div>
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">
              დაუდასტურებელი
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.unapproved}
            </div>
          </div>
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">
              დადასტურებული
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.approved}
            </div>
          </div>
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <div className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">
              პასუხები
            </div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.replies}
            </div>
          </div>
          <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <div className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-1">
              ქვეყნები
            </div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {stats.countries}
            </div>
          </div>
          <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-lg">
            <div className="text-xs text-teal-600 dark:text-teal-400 font-medium mb-1">
              ლოკაციები
            </div>
            <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
              {stats.locations}
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="p-4 border-b border-foreground/10 bg-foreground/[0.02]">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <input
              type="text"
              placeholder="ძებნა კომენტარში, ავტორში, ლოკაციაში..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-foreground/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30"
            />
          </div>

          {/* Filter by Status */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                filter === 'all'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-background border border-foreground/10 hover:bg-foreground/5'
              }`}
            >
              ყველა
            </button>
            <button
              onClick={() => setFilter('unapproved')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                filter === 'unapproved'
                  ? 'bg-red-500 text-white shadow-md'
                  : 'bg-background border border-foreground/10 hover:bg-foreground/5'
              }`}
            >
              დაუდასტურებელი {stats.unapproved > 0 && `(${stats.unapproved})`}
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                filter === 'approved'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-background border border-foreground/10 hover:bg-foreground/5'
              }`}
            >
              დადასტურებული
            </button>
            <button
              onClick={() => setFilter('replies')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                filter === 'replies'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'bg-background border border-foreground/10 hover:bg-foreground/5'
              }`}
            >
              პასუხები
            </button>
          </div>

          {/* Filter by Type */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                selectedType === 'all'
                  ? 'bg-foreground text-background'
                  : 'bg-background border border-foreground/10 hover:bg-foreground/5'
              }`}
            >
              ყველა ტიპი
            </button>
            <button
              onClick={() => setSelectedType('country')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                selectedType === 'country'
                  ? 'bg-foreground text-background'
                  : 'bg-background border border-foreground/10 hover:bg-foreground/5'
              }`}
            >
              ქვეყნები
            </button>
            <button
              onClick={() => setSelectedType('location')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                selectedType === 'location'
                  ? 'bg-foreground text-background'
                  : 'bg-background border border-foreground/10 hover:bg-foreground/5'
              }`}
            >
              ლოკაციები
            </button>
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortType)}
            className="px-3 py-2 bg-background border border-foreground/10 rounded-lg text-xs font-medium hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="newest">უახლესი</option>
            <option value="oldest">უძველესი</option>
            <option value="most_liked">ყველაზე მოწონებული</option>
            <option value="most_disliked">ყველაზე არ მოწონებული</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {stats.unapproved > 0 && filter === 'unapproved' && (
          <div className="mt-3 flex items-center justify-between p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              {filteredAndSortedComments.length} დაუდასტურებელი კომენტარი
            </span>
            <button
              onClick={handleBulkApprove}
              className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded transition-colors"
            >
              ყველას დადასტურება
            </button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-10 h-10 border-4 border-foreground/20 border-t-foreground rounded-full animate-spin mb-4"></div>
            <p className="text-foreground/60">იტვირთება...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredAndSortedComments.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-foreground/30" />
            <p className="text-lg font-medium text-foreground/60 mb-2">
              კომენტარები არ მოიძებნა
            </p>
            <p className="text-sm text-foreground/40">
              {searchQuery
                ? 'სცადეთ სხვა საძიებო ფრაზა'
                : 'კომენტარები გამოჩნდება როგორც კი მომხმარებლები დაწერენ'}
            </p>
          </div>
        </div>
      )}

      {/* Comments Table */}
      {!loading && filteredAndSortedComments.length > 0 && (
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-foreground/5 border-b border-foreground/10 z-10">
              <tr>
                <th className="px-3 py-3 text-left text-[10px] font-semibold text-foreground/70 uppercase w-8">
                  #
                </th>
                <th className="px-3 py-3 text-left text-[10px] font-semibold text-foreground/70 uppercase w-20">
                  სტატუსი
                </th>
                <th className="px-3 py-3 text-left text-[10px] font-semibold text-foreground/70 uppercase min-w-[140px]">
                  ავტორი
                </th>
                <th className="px-3 py-3 text-left text-[10px] font-semibold text-foreground/70 uppercase flex-1 min-w-[300px]">
                  კომენტარი
                </th>
                <th className="px-3 py-3 text-left text-[10px] font-semibold text-foreground/70 uppercase min-w-[180px]">
                  ლოკაცია / გვერდი
                </th>
                <th className="px-3 py-3 text-left text-[10px] font-semibold text-foreground/70 uppercase w-24">
                  რეაქციები
                </th>
                <th className="px-3 py-3 text-left text-[10px] font-semibold text-foreground/70 uppercase w-32">
                  თარიღი
                </th>
                <th className="px-3 py-3 text-right text-[10px] font-semibold text-foreground/70 uppercase w-36">
                  მოქმედებები
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5">
              {filteredAndSortedComments.map((comment, index) => {
                const isProcessing = processingIds.has(comment.id);
                const commentLink = getCommentableLink(comment);
                const expanded = expandedComments.has(comment.id);
                const isEdited = comment.updated_at !== comment.created_at;

                return (
                  <tr
                    key={comment.id}
                    className={`hover:bg-foreground/[0.02] transition-colors ${
                      !comment.is_approved ? 'bg-red-500/[0.015]' : ''
                    }`}
                  >
                    {/* Index */}
                    <td className="px-3 py-3 text-xs text-foreground/40 font-mono">
                      {index + 1}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            comment.is_approved
                              ? 'bg-green-500'
                              : 'bg-red-500 animate-pulse'
                          }`}
                        />
                        <span
                          className={`text-[10px] font-medium ${
                            comment.is_approved
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {comment.is_approved ? 'OK' : 'ლოდინში'}
                        </span>
                      </div>
                    </td>

                    {/* Author */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {comment.profiles.full_name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">
                            {comment.profiles.full_name || 'მომხმარებელი'}
                          </p>
                          <p className="text-[10px] text-foreground/40">
                            ID: {comment.user_id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Content */}
                    <td className="px-3 py-3">
                      <div className="max-w-2xl">
                        {/* Reply Badge */}
                        {comment.parent_info && (
                          <div className="mb-1.5 inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded text-[10px] font-medium">
                            <MessageSquare className="w-3 h-3" />
                            პასუხი → {comment.parent_info.author}
                          </div>
                        )}

                        {/* Comment Text */}
                        <p
                          className={`text-sm text-foreground/90 leading-snug ${
                            !expanded && comment.content.length > 150
                              ? 'line-clamp-2'
                              : ''
                          }`}
                        >
                          {comment.content}
                        </p>

                        {/* Edited Indicator */}
                        {isEdited && (
                          <span className="text-[10px] text-foreground/30 italic mt-1 inline-block">
                            (რედაქტირებული)
                          </span>
                        )}

                        {/* Expand/Collapse */}
                        {comment.content.length > 150 && (
                          <button
                            onClick={() => toggleExpand(comment.id)}
                            className="flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-600 mt-1 font-medium"
                          >
                            {expanded ? (
                              <>
                                <ChevronUp className="w-3 h-3" /> შეკრება
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3" /> გაშლა
                              </>
                            )}
                          </button>
                        )}

                        {/* Parent Comment (Expanded) */}
                        {expanded && comment.parent_info && (
                          <div className="mt-2 p-2 bg-blue-500/5 border-l-2 border-blue-500/30 rounded text-xs text-foreground/60 italic">
                            <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mb-1">
                              მშობელი კომენტარი:
                            </div>
                            "{comment.parent_info.content}..."
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-3 py-3">
                      <div className="space-y-1">
                        <button
                          onClick={() => window.open(commentLink, '_blank', 'noopener,noreferrer')}
                          className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-600 transition-colors group font-medium cursor-pointer"
                        >
                          <MapPin className="w-3 h-3" />
                          <span className="max-w-[150px] truncate">
                            {getCommentableName(comment)}
                          </span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                        <div className="flex items-center gap-1 text-[10px] text-foreground/40">
                          <span className="px-1.5 py-0.5 bg-foreground/5 rounded">
                            {comment.commentable_type === 'country'
                              ? 'ქვეყანა'
                              : 'ლოკაცია'}
                          </span>
                        </div>
                        {/* Full URL */}
                        <div className="text-[9px] text-foreground/30 font-mono truncate max-w-[150px]">
                          {commentLink}
                        </div>
                      </div>
                    </td>

                    {/* Reactions */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-green-600">
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span className="text-xs font-semibold">
                            {comment.likes_count}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-red-500">
                          <ThumbsDown className="w-3.5 h-3.5" />
                          <span className="text-xs font-semibold">
                            {comment.dislikes_count}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-3 py-3">
                      <div className="space-y-0.5">
                        <div
                          className="text-xs text-foreground/70 whitespace-nowrap"
                          title={format(
                            new Date(comment.created_at),
                            'PPpp',
                            { locale: ka }
                          )}
                        >
                          {formatDistanceToNow(new Date(comment.created_at), {
                            addSuffix: true,
                            locale: ka,
                          })}
                        </div>
                        <div className="text-[10px] text-foreground/40">
                          {format(new Date(comment.created_at), 'dd MMM yyyy', {
                            locale: ka,
                          })}
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5 justify-end">
                        {!comment.is_approved && (
                          <button
                            onClick={() => handleApprove(comment.id)}
                            disabled={isProcessing}
                            className="p-1.5 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white rounded transition-all disabled:cursor-not-allowed"
                            title="დადასტურება"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(comment.id)}
                          disabled={isProcessing}
                          className="p-1.5 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white rounded transition-all disabled:cursor-not-allowed"
                          title="წაშლა"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Results Count */}
      {!loading && filteredAndSortedComments.length > 0 && (
        <div className="p-3 border-t border-foreground/10 bg-foreground/[0.02] text-center">
          <span className="text-xs text-foreground/60">
            ნაჩვენებია {filteredAndSortedComments.length} კომენტარი {stats.total}-დან
          </span>
        </div>
      )}
    </div>
  );
}
