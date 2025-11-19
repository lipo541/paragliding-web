# რეიტინგისა და კომენტარების სისტემის განხორციელების გეგმა

## 📋 მიმოხილვა

ეს დოკუმენტი შეიცავს დეტალურ ინსტრუქციებს 5-ვარსკვლავიანი რეიტინგის სისტემისა და კომენტარების ფუნქციონალის დასამატებლად საქართველოს პარაპლანერიზმის ვებსაიტზე.

**რას ვამატებთ:**
- ⭐ 5-ვარსკვლავიანი რეიტინგი ქვეყნებზე, ლოკაციებზე და ფრენის ტიპებზე
- 💬 კომენტარების სისტემა მოდერაციით
- 🔐 Authentication-based permissions
- 📊 Realtime rating aggregations

---

## 🗂️ ფაზა 1: Database Schema შექმნა

### ნაბიჯი 1.1: Ratings Table (მიგრაცია 013)

**ფაილი:** `supabase/migrations/013_create_ratings_system.sql`

```sql
-- ============================================
-- RATINGS SYSTEM
-- ============================================

-- Create ENUM for ratable types
CREATE TYPE ratable_type AS ENUM ('country', 'location', 'flight_type');

-- Create ratings table
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ratable_type ratable_type NOT NULL,
  ratable_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- უნიკალური constraint: მომხმარებელს მხოლოდ ერთი rating თითოეულ ობიექტზე
  CONSTRAINT unique_user_rating UNIQUE (user_id, ratable_type, ratable_id)
);

-- Create indexes for performance
CREATE INDEX idx_ratings_user_id ON ratings(user_id);
CREATE INDEX idx_ratings_ratable ON ratings(ratable_type, ratable_id);
CREATE INDEX idx_ratings_created_at ON ratings(created_at DESC);

-- Enable Row Level Security
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ratings

-- ყველას შეუძლია ratings-ების ნახვა
CREATE POLICY "Anyone can view ratings"
  ON ratings FOR SELECT
  USING (true);

-- Authenticated users-ს შეუძლია rating-ის დამატება
CREATE POLICY "Authenticated users can insert ratings"
  ON ratings FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
  );

-- Users-ს შეუძლია მხოლოდ საკუთარი rating-ის განახლება
CREATE POLICY "Users can update own ratings"
  ON ratings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users-ს შეუძლია მხოლოდ საკუთარი rating-ის წაშლა
CREATE POLICY "Users can delete own ratings"
  ON ratings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Auto-update updated_at timestamp
CREATE TRIGGER update_ratings_updated_at
  BEFORE UPDATE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE ratings IS 'User ratings for countries, locations, and flight types';
COMMENT ON COLUMN ratings.ratable_type IS 'Type of entity being rated: country, location, or flight_type';
COMMENT ON COLUMN ratings.ratable_id IS 'UUID of the entity being rated';
COMMENT ON COLUMN ratings.rating IS 'Rating value from 1 to 5 stars';
```

### ნაბიჯი 1.2: Cached Ratings (პერფორმანსისთვის)

**იმავე მიგრაციაში დავამატოთ:**

```sql
-- ============================================
-- CACHED RATING COLUMNS
-- ============================================

-- Add cached rating columns to countries
ALTER TABLE countries
ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN ratings_count INTEGER DEFAULT 0;

-- Add cached rating columns to locations
ALTER TABLE locations
ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN ratings_count INTEGER DEFAULT 0;

-- Create indexes on average_rating for sorting
CREATE INDEX idx_countries_average_rating ON countries(average_rating DESC);
CREATE INDEX idx_locations_average_rating ON locations(average_rating DESC);

-- Comments
COMMENT ON COLUMN countries.average_rating IS 'Cached average rating (0-5) - updated by trigger';
COMMENT ON COLUMN countries.ratings_count IS 'Cached total number of ratings - updated by trigger';
COMMENT ON COLUMN locations.average_rating IS 'Cached average rating (0-5) - updated by trigger';
COMMENT ON COLUMN locations.ratings_count IS 'Cached total number of ratings - updated by trigger';
```

### ნაბიჯი 1.3: Triggers Rating-ის ავტომატური განახლებისთვის

**იმავე მიგრაციაში:**

```sql
-- ============================================
-- FUNCTIONS AND TRIGGERS FOR AUTO-UPDATE
-- ============================================

-- Function to update cached ratings for countries
CREATE OR REPLACE FUNCTION update_country_rating_cache()
RETURNS TRIGGER AS $$
DECLARE
  country_uuid UUID;
  avg_rating DECIMAL(3,2);
  total_count INTEGER;
BEGIN
  -- Get country_id based on operation
  IF TG_OP = 'DELETE' THEN
    country_uuid := OLD.ratable_id;
  ELSE
    country_uuid := NEW.ratable_id;
  END IF;

  -- Only update if ratable_type is 'country'
  IF (TG_OP = 'DELETE' AND OLD.ratable_type = 'country') OR 
     (TG_OP IN ('INSERT', 'UPDATE') AND NEW.ratable_type = 'country') THEN
    
    -- Calculate new average and count
    SELECT 
      COALESCE(AVG(rating), 0)::DECIMAL(3,2),
      COUNT(*)::INTEGER
    INTO avg_rating, total_count
    FROM ratings
    WHERE ratable_type = 'country' AND ratable_id = country_uuid;
    
    -- Update countries table
    UPDATE countries
    SET 
      average_rating = avg_rating,
      ratings_count = total_count
    WHERE id = country_uuid;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update cached ratings for locations
CREATE OR REPLACE FUNCTION update_location_rating_cache()
RETURNS TRIGGER AS $$
DECLARE
  location_uuid UUID;
  avg_rating DECIMAL(3,2);
  total_count INTEGER;
BEGIN
  -- Get location_id based on operation
  IF TG_OP = 'DELETE' THEN
    location_uuid := OLD.ratable_id;
  ELSE
    location_uuid := NEW.ratable_id;
  END IF;

  -- Only update if ratable_type is 'location'
  IF (TG_OP = 'DELETE' AND OLD.ratable_type = 'location') OR 
     (TG_OP IN ('INSERT', 'UPDATE') AND NEW.ratable_type = 'location') THEN
    
    -- Calculate new average and count
    SELECT 
      COALESCE(AVG(rating), 0)::DECIMAL(3,2),
      COUNT(*)::INTEGER
    INTO avg_rating, total_count
    FROM ratings
    WHERE ratable_type = 'location' AND ratable_id = location_uuid;
    
    -- Update locations table
    UPDATE locations
    SET 
      average_rating = avg_rating,
      ratings_count = total_count
    WHERE id = location_uuid;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers for countries
CREATE TRIGGER trigger_update_country_rating_on_insert
  AFTER INSERT ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_country_rating_cache();

CREATE TRIGGER trigger_update_country_rating_on_update
  AFTER UPDATE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_country_rating_cache();

CREATE TRIGGER trigger_update_country_rating_on_delete
  AFTER DELETE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_country_rating_cache();

-- Triggers for locations
CREATE TRIGGER trigger_update_location_rating_on_insert
  AFTER INSERT ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_location_rating_cache();

CREATE TRIGGER trigger_update_location_rating_on_update
  AFTER UPDATE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_location_rating_cache();

CREATE TRIGGER trigger_update_location_rating_on_delete
  AFTER DELETE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_location_rating_cache();
```

---

## 🗂️ ფაზა 2: Comments System (მიგრაცია 014)

### ნაბიჯი 2.1: Comments Table

**ფაილი:** `supabase/migrations/014_create_comments_system.sql`

```sql
-- ============================================
-- COMMENTS SYSTEM
-- ============================================

-- Create ENUM for commentable types (reuse if needed)
CREATE TYPE commentable_type AS ENUM ('country', 'location', 'flight_type');

-- Create comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  commentable_type commentable_type NOT NULL,
  commentable_id UUID NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) >= 10 AND char_length(content) <= 2000),
  is_approved BOOLEAN DEFAULT false NOT NULL,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_commentable ON comments(commentable_type, commentable_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);
CREATE INDEX idx_comments_approved ON comments(is_approved);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- Enable Row Level Security
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comments

-- ყველას შეუძლია approved კომენტარების ნახვა
CREATE POLICY "Anyone can view approved comments"
  ON comments FOR SELECT
  USING (is_approved = true);

-- Users-ს შეუძლია საკუთარი კომენტარების ნახვა (approved და unapproved)
CREATE POLICY "Users can view own comments"
  ON comments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- SUPER_ADMIN-ს შეუძლია ყველა კომენტარის ნახვა
CREATE POLICY "Super admins can view all comments"
  ON comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- Authenticated users-ს შეუძლია კომენტარის დამატება
CREATE POLICY "Authenticated users can insert comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    is_approved = false -- ახალი კომენტარი ავტომატურად unapproved
  );

-- Users-ს შეუძლია მხოლოდ საკუთარი კომენტარის განახლება (content only, not is_approved)
CREATE POLICY "Users can update own comment content"
  ON comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    is_approved = OLD.is_approved -- არ შეიძლება is_approved-ის შეცვლა
  );

-- SUPER_ADMIN-ს შეუძლია ნებისმიერი კომენტარის განახლება
CREATE POLICY "Super admins can update any comment"
  ON comments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- Users-ს შეუძლია მხოლოდ საკუთარი კომენტარის წაშლა
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- SUPER_ADMIN-ს შეუძლია ნებისმიერი კომენტარის წაშლა
CREATE POLICY "Super admins can delete any comment"
  ON comments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- Auto-update updated_at timestamp
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE comments IS 'User comments for countries, locations, and flight types with moderation';
COMMENT ON COLUMN comments.commentable_type IS 'Type of entity being commented on';
COMMENT ON COLUMN comments.commentable_id IS 'UUID of the entity being commented on';
COMMENT ON COLUMN comments.content IS 'Comment text content (10-2000 characters)';
COMMENT ON COLUMN comments.is_approved IS 'Whether comment has been approved by moderator';
COMMENT ON COLUMN comments.parent_comment_id IS 'Parent comment ID for threaded replies (nullable)';
```

### ნაბიჯი 2.2: Comment Counter Cache (Optional)

```sql
-- ============================================
-- CACHED COMMENT COUNTS
-- ============================================

-- Add cached comment counts
ALTER TABLE countries
ADD COLUMN comments_count INTEGER DEFAULT 0;

ALTER TABLE locations
ADD COLUMN comments_count INTEGER DEFAULT 0;

-- Function to update comment counts
CREATE OR REPLACE FUNCTION update_comment_count_cache()
RETURNS TRIGGER AS $$
DECLARE
  entity_uuid UUID;
  entity_type TEXT;
  new_count INTEGER;
BEGIN
  -- Get entity info based on operation
  IF TG_OP = 'DELETE' THEN
    entity_uuid := OLD.commentable_id;
    entity_type := OLD.commentable_type::TEXT;
  ELSE
    entity_uuid := NEW.commentable_id;
    entity_type := NEW.commentable_type::TEXT;
  END IF;

  -- Count only approved comments
  SELECT COUNT(*)::INTEGER INTO new_count
  FROM comments
  WHERE commentable_id = entity_uuid 
    AND commentable_type = entity_type::commentable_type
    AND is_approved = true;

  -- Update appropriate table
  IF entity_type = 'country' THEN
    UPDATE countries SET comments_count = new_count WHERE id = entity_uuid;
  ELSIF entity_type = 'location' THEN
    UPDATE locations SET comments_count = new_count WHERE id = entity_uuid;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER trigger_update_comment_count_on_insert
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_count_cache();

CREATE TRIGGER trigger_update_comment_count_on_update
  AFTER UPDATE ON comments
  FOR EACH ROW
  WHEN (OLD.is_approved IS DISTINCT FROM NEW.is_approved)
  EXECUTE FUNCTION update_comment_count_cache();

CREATE TRIGGER trigger_update_comment_count_on_delete
  AFTER DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_count_cache();
```

---

## 🗂️ ფაზა 3: Flight Types Table (მიგრაცია 015 - Optional)

**შენიშვნა:** ეს საჭიროა თუ გვინდა flight_types-ზეც რეიტინგი/კომენტარები

### ნაბიჯი 3.1: Flight Types Table შექმნა

**ფაილი:** `supabase/migrations/015_create_flight_types_table.sql`

```sql
-- ============================================
-- FLIGHT TYPES TABLE
-- ============================================

-- Create flight_types table
CREATE TABLE flight_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  shared_flight_type_id UUID, -- reference to shared pricing
  
  -- Localized names
  name_ka TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  name_ar TEXT,
  name_de TEXT,
  name_tr TEXT,
  
  -- Localized descriptions
  description_ka TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_ru TEXT NOT NULL,
  description_ar TEXT,
  description_de TEXT,
  description_tr TEXT,
  
  -- Features (JSONB array)
  features_ka TEXT[] NOT NULL DEFAULT '{}',
  features_en TEXT[] NOT NULL DEFAULT '{}',
  features_ru TEXT[] NOT NULL DEFAULT '{}',
  features_ar TEXT[] DEFAULT '{}',
  features_de TEXT[] DEFAULT '{}',
  features_tr TEXT[] DEFAULT '{}',
  
  -- Duration
  duration_ka TEXT,
  duration_en TEXT,
  duration_ru TEXT,
  
  -- Cached ratings
  average_rating DECIMAL(3,2) DEFAULT 0,
  ratings_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  
  -- Metadata
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_flight_types_location_id ON flight_types(location_id);
CREATE INDEX idx_flight_types_shared_id ON flight_types(shared_flight_type_id);
CREATE INDEX idx_flight_types_display_order ON flight_types(display_order);
CREATE INDEX idx_flight_types_average_rating ON flight_types(average_rating DESC);

-- Enable RLS
ALTER TABLE flight_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active flight types"
  ON flight_types FOR SELECT
  USING (is_active = true);

CREATE POLICY "Super admins can manage flight types"
  ON flight_types FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- Auto-update trigger
CREATE TRIGGER update_flight_types_updated_at
  BEFORE UPDATE ON flight_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE flight_types IS 'Flight types extracted from location_pages JSONB into relational table';
```

### ნაბიჯი 3.2: Migration Script - JSONB-დან Table-ში

```sql
-- ============================================
-- MIGRATE FLIGHT TYPES FROM JSONB
-- ============================================

-- Function to migrate flight types from location_pages.content to flight_types table
CREATE OR REPLACE FUNCTION migrate_flight_types_from_jsonb()
RETURNS void AS $$
DECLARE
  page_record RECORD;
  flight_type JSONB;
  shared_ft JSONB;
  shared_id UUID;
BEGIN
  -- Loop through all location_pages
  FOR page_record IN 
    SELECT id, location_id, content 
    FROM location_pages 
    WHERE is_active = true
  LOOP
    -- Get shared_flight_types
    IF page_record.content ? 'shared_flight_types' THEN
      -- Loop through each shared flight type to assign IDs
      FOR shared_ft IN SELECT * FROM jsonb_array_elements(page_record.content->'shared_flight_types')
      LOOP
        shared_id := (shared_ft->>'id')::UUID;
        
        -- Insert into flight_types for each language
        INSERT INTO flight_types (
          id,
          location_id,
          shared_flight_type_id,
          name_ka,
          name_en,
          name_ru,
          description_ka,
          description_en,
          description_ru,
          features_ka,
          features_en,
          features_ru
        )
        SELECT
          shared_id,
          page_record.location_id,
          shared_id,
          (page_record.content->'ka'->'flight_types'->idx->>'name'),
          (page_record.content->'en'->'flight_types'->idx->>'name'),
          (page_record.content->'ru'->'flight_types'->idx->>'name'),
          (page_record.content->'ka'->'flight_types'->idx->>'description'),
          (page_record.content->'en'->'flight_types'->idx->>'description'),
          (page_record.content->'ru'->'flight_types'->idx->>'description'),
          ARRAY(SELECT jsonb_array_elements_text(page_record.content->'ka'->'flight_types'->idx->'features')),
          ARRAY(SELECT jsonb_array_elements_text(page_record.content->'en'->'flight_types'->idx->'features')),
          ARRAY(SELECT jsonb_array_elements_text(page_record.content->'ru'->'flight_types'->idx->'features'))
        FROM generate_series(0, jsonb_array_length(page_record.content->'shared_flight_types') - 1) AS idx
        ON CONFLICT (id) DO NOTHING;
      END LOOP;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute migration (comment out after first run)
-- SELECT migrate_flight_types_from_jsonb();
```

---

## 🎨 ფაზა 4: Frontend Components

### ნაბიჯი 4.1: Rating Display Component

**ფაილი:** `components/shared/RatingDisplay.tsx`

```typescript
'use client';

import { Star } from 'lucide-react';

interface RatingDisplayProps {
  rating: number; // 0-5
  ratingsCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

export default function RatingDisplay({
  rating,
  ratingsCount = 0,
  size = 'md',
  showCount = true
}: RatingDisplayProps) {
  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizes[size]} ${
              star <= Math.round(rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-foreground/20'
            }`}
          />
        ))}
      </div>
      {showCount && (
        <span className={`${textSizes[size]} text-foreground/60`}>
          {rating.toFixed(1)} ({ratingsCount})
        </span>
      )}
    </div>
  );
}
```

### ნაბიჯი 4.2: Rating Input Component

**ფაილი:** `components/shared/RatingInput.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface RatingInputProps {
  ratableType: 'country' | 'location' | 'flight_type';
  ratableId: string;
  currentUserRating?: number;
  onRatingChange?: (newRating: number) => void;
}

export default function RatingInput({
  ratableType,
  ratableId,
  currentUserRating = 0,
  onRatingChange
}: RatingInputProps) {
  const [rating, setRating] = useState(currentUserRating);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();

  const handleRatingClick = async (selectedRating: number) => {
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('გთხოვთ გაიაროთ ავტორიზაცია რეიტინგის მისაცემად');
        return;
      }

      // Upsert rating
      const { error } = await supabase
        .from('ratings')
        .upsert({
          user_id: user.id,
          ratable_type: ratableType,
          ratable_id: ratableId,
          rating: selectedRating
        }, {
          onConflict: 'user_id,ratable_type,ratable_id'
        });

      if (error) throw error;

      setRating(selectedRating);
      onRatingChange?.(selectedRating);
    } catch (error) {
      console.error('Rating error:', error);
      alert('რეიტინგის მიცემა ვერ მოხერხდა');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-foreground/60">შეაფასეთ:</p>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            disabled={isSubmitting}
            onClick={() => handleRatingClick(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="transition-transform hover:scale-110 disabled:opacity-50"
          >
            <Star
              className={`w-6 h-6 ${
                star <= (hoveredRating || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-foreground/30'
              }`}
            />
          </button>
        ))}
      </div>
      {rating > 0 && (
        <p className="text-xs text-foreground/60">
          თქვენი რეიტინგი: {rating} ვარსკვლავი
        </p>
      )}
    </div>
  );
}
```

### ნაბიჯი 4.3: Comments List Component

**ფაილი:** `components/shared/CommentsList.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessageCircle, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ka } from 'date-fns/locale';

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url?: string;
  };
}

interface CommentsListProps {
  commentableType: 'country' | 'location' | 'flight_type';
  commentableId: string;
}

export default function CommentsList({
  commentableType,
  commentableId
}: CommentsListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    fetchComments();
  }, [commentableId]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          user_id,
          content,
          created_at,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('commentable_type', commentableType)
        .eq('commentable_id', commentableId)
        .eq('is_approved', true)
        .is('parent_comment_id', null) // Top-level comments only
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">იტვირთება...</div>;
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-foreground/60">
        <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-20" />
        <p>კომენტარები ჯერ არ არის</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="p-4 rounded-lg border border-foreground/10 bg-foreground/[0.02]"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center flex-shrink-0">
              {comment.profiles?.avatar_url ? (
                <img
                  src={comment.profiles.avatar_url}
                  alt={comment.profiles.full_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-foreground/40" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm">
                  {comment.profiles?.full_name || 'მომხმარებელი'}
                </span>
                <span className="text-xs text-foreground/50">
                  {formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                    locale: ka
                  })}
                </span>
              </div>
              <p className="text-sm text-foreground/80">{comment.content}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### ნაბიჯი 4.4: Comment Input Component

**ფაილი:** `components/shared/CommentInput.tsx`

```typescript
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Send } from 'lucide-react';

interface CommentInputProps {
  commentableType: 'country' | 'location' | 'flight_type';
  commentableId: string;
  onCommentSubmit?: () => void;
}

export default function CommentInput({
  commentableType,
  commentableId,
  onCommentSubmit
}: CommentInputProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (content.trim().length < 10) {
      setMessage('კომენტარი უნდა შეიცავდეს მინიმუმ 10 სიმბოლოს');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setMessage('გთხოვთ გაიაროთ ავტორიზაცია კომენტარის დასაწერად');
        return;
      }

      const { error } = await supabase
        .from('comments')
        .insert({
          user_id: user.id,
          commentable_type: commentableType,
          commentable_id: commentableId,
          content: content.trim()
        });

      if (error) throw error;

      setContent('');
      setMessage('კომენტარი წარმატებით გაიგზავნა. მოდერატორის დამტკიცების შემდეგ გამოჩნდება.');
      onCommentSubmit?.();
    } catch (error) {
      console.error('Comment submission error:', error);
      setMessage('კომენტარის გაგზავნა ვერ მოხერხდა');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="დაწერეთ კომენტარი..."
        rows={4}
        maxLength={2000}
        disabled={isSubmitting}
        className="w-full px-4 py-3 text-sm border border-foreground/20 rounded-lg focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 outline-none transition-all bg-background text-foreground resize-none"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-foreground/50">
          {content.length}/2000
        </span>
        <button
          type="submit"
          disabled={isSubmitting || content.trim().length < 10}
          className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          <Send className="w-4 h-4" />
          გაგზავნა
        </button>
      </div>
      {message && (
        <p className={`text-xs ${message.includes('წარმატებით') ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}
    </form>
  );
}
```

---

## 🔧 ფაზა 5: Integration - LocationPage-ში

### ნაბიჯი 5.1: LocationPage-ში რეიტინგისა და კომენტარების დამატება

**ფაილი განახლება:** `components/locationpage/LocationPage.tsx`

```typescript
// Import new components
import RatingDisplay from '@/components/shared/RatingDisplay';
import RatingInput from '@/components/shared/RatingInput';
import CommentsList from '@/components/shared/CommentsList';
import CommentInput from '@/components/shared/CommentInput';

// Inside component, after fetching location data:
const [userRating, setUserRating] = useState<number>(0);

// Fetch user's rating
useEffect(() => {
  const fetchUserRating = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !location) return;

    const { data } = await supabase
      .from('ratings')
      .select('rating')
      .eq('user_id', user.id)
      .eq('ratable_type', 'location')
      .eq('ratable_id', location.id)
      .single();

    if (data) setUserRating(data.rating);
  };

  fetchUserRating();
}, [location]);

// Add Rating & Comments section before footer:
<div className="max-w-[1280px] mx-auto px-4 py-12">
  {/* Rating Section */}
  <GlassCard className="p-6 mb-8">
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">საშუალო რეიტინგი</h3>
        <RatingDisplay 
          rating={location.average_rating || 0}
          ratingsCount={location.ratings_count || 0}
          size="lg"
        />
      </div>
      <div>
        <RatingInput
          ratableType="location"
          ratableId={location.id}
          currentUserRating={userRating}
          onRatingChange={(newRating) => {
            setUserRating(newRating);
            // Refetch location to update average
          }}
        />
      </div>
    </div>
  </GlassCard>

  {/* Comments Section */}
  <GlassCard className="p-6">
    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
      <MessageCircle className="w-5 h-5" />
      კომენტარები ({location.comments_count || 0})
    </h3>
    
    <div className="mb-6">
      <CommentInput
        commentableType="location"
        commentableId={location.id}
        onCommentSubmit={() => {
          // Refresh comments
        }}
      />
    </div>

    <CommentsList
      commentableType="location"
      commentableId={location.id}
    />
  </GlassCard>
</div>
```

---

## 🎯 ფაზა 6: Admin Moderation Dashboard

### ნაბიჯი 6.1: Moderation Component

**ფაილი:** `components/superadmindashboard/moderation/CommentModeration.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Check, X, Eye } from 'lucide-react';

export default function CommentModeration() {
  const [pendingComments, setPendingComments] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    fetchPendingComments();
  }, []);

  const fetchPendingComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select(`
        *,
        profiles (full_name, email)
      `)
      .eq('is_approved', false)
      .order('created_at', { ascending: false });

    setPendingComments(data || []);
  };

  const handleApprove = async (commentId: string) => {
    const { error } = await supabase
      .from('comments')
      .update({ is_approved: true })
      .eq('id', commentId);

    if (!error) {
      fetchPendingComments();
    }
  };

  const handleReject = async (commentId: string) => {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (!error) {
      fetchPendingComments();
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">მოდერაცია ({pendingComments.length})</h2>
      
      {pendingComments.length === 0 ? (
        <p className="text-foreground/60">ახალი კომენტარები არ არის</p>
      ) : (
        pendingComments.map((comment) => (
          <div key={comment.id} className="p-4 border rounded-lg">
            <div className="mb-2">
              <span className="font-semibold">{comment.profiles?.full_name}</span>
              <span className="text-xs text-foreground/60 ml-2">
                {comment.profiles?.email}
              </span>
            </div>
            <p className="mb-4">{comment.content}</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(comment.id)}
                className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                <Check className="w-4 h-4" />
                დამტკიცება
              </button>
              <button
                onClick={() => handleReject(comment.id)}
                className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                <X className="w-4 h-4" />
                უარყოფა
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
```

---

## 📋 ფაზა 7: Testing Checklist

### Database Tests:
- [ ] Rating insert works
- [ ] Rating update works (user can change their rating)
- [ ] Rating delete works
- [ ] Cannot rate same entity twice (UNIQUE constraint)
- [ ] Average rating calculates correctly via triggers
- [ ] Comment insert works
- [ ] Comment requires authentication
- [ ] Comment moderation works
- [ ] RLS policies work correctly

### Frontend Tests:
- [ ] Rating display shows correct stars
- [ ] Rating input works
- [ ] User cannot rate without login
- [ ] Comments list shows only approved comments
- [ ] Comment submission works
- [ ] Comment moderation dashboard works (admin only)
- [ ] Realtime updates work

### Integration Tests:
- [ ] Rating on LocationPage works
- [ ] Comments on LocationPage work
- [ ] Rating on CountryPage works
- [ ] Rating on FlightTypes works (if implemented)

---

## 🚀 Deployment Checklist

1. **Run migrations in order:**
   ```bash
   supabase migration up 013_create_ratings_system
   supabase migration up 014_create_comments_system
   supabase migration up 015_create_flight_types_table # optional
   ```

2. **Verify RLS policies:**
   - Test as authenticated user
   - Test as anonymous user
   - Test as SUPER_ADMIN

3. **Create indexes:**
   - All indexes from migrations are applied

4. **Test performance:**
   - Rating aggregations are fast (< 100ms)
   - Comments pagination works
   - No N+1 query issues

---

## 📚 დამატებითი შენიშვნები

### Performance Optimizations:
- Cached ratings in parent tables → triggers keep them updated
- Indexes on all foreign keys and common query patterns
- Pagination for comments (limit 20 per page)

### Security:
- RLS policies enforce authentication
- Users can only edit their own ratings/comments
- Admins can moderate all content
- Content length validation (10-2000 chars for comments)

### Future Enhancements:
- Like/Dislike on comments
- Reply threading (already supported via parent_comment_id)
- Report abuse functionality
- Email notifications for approved comments
- Rating breakdown visualization (how many 5-star, 4-star, etc.)

---

## ✅ დასრულება

ეს სისტემა უზრუნველყოფს:
- ✅ Scalable ratings system
- ✅ Moderated comments system
- ✅ Proper authentication & authorization
- ✅ Good performance with caching
- ✅ Clean separation of concerns
- ✅ Future-proof architecture

შემდეგი ნაბიჯი: დავიწყოთ migration-ების შექმნა და გატესტვა! 🎯
