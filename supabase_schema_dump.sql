


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."commentable_type" AS ENUM (
    'country',
    'location',
    'flight_type'
);


ALTER TYPE "public"."commentable_type" OWNER TO "postgres";


CREATE TYPE "public"."company_status" AS ENUM (
    'pending',
    'verified',
    'blocked',
    'hidden'
);


ALTER TYPE "public"."company_status" OWNER TO "postgres";


CREATE TYPE "public"."difficulty_level" AS ENUM (
    'beginner',
    'intermediate',
    'advanced'
);


ALTER TYPE "public"."difficulty_level" OWNER TO "postgres";


CREATE TYPE "public"."pilot_company_request_status" AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE "public"."pilot_company_request_status" OWNER TO "postgres";


CREATE TYPE "public"."pilot_status" AS ENUM (
    'pending',
    'verified',
    'blocked',
    'hidden'
);


ALTER TYPE "public"."pilot_status" OWNER TO "postgres";


CREATE TYPE "public"."ratable_type" AS ENUM (
    'country',
    'location',
    'flight_type'
);


ALTER TYPE "public"."ratable_type" OWNER TO "postgres";


CREATE TYPE "public"."reaction_type" AS ENUM (
    'like',
    'dislike'
);


ALTER TYPE "public"."reaction_type" OWNER TO "postgres";


CREATE TYPE "public"."request_initiator" AS ENUM (
    'pilot_request',
    'company_invite'
);


ALTER TYPE "public"."request_initiator" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'USER',
    'SUPER_ADMIN',
    'TANDEM_PILOT',
    'SOLO_PILOT',
    'COMPANY'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."approve_company"("company_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    company_user_id UUID;
BEGIN
    -- Get the user_id from the company
    SELECT user_id INTO company_user_id
    FROM companies
    WHERE id = company_id;
    
    IF company_user_id IS NULL THEN
        RAISE EXCEPTION 'Company not found';
    END IF;
    
    -- Update company status
    UPDATE companies
    SET status = 'verified', updated_at = NOW()
    WHERE id = company_id;
    
    -- Update user role to COMPANY
    UPDATE profiles
    SET role = 'COMPANY', updated_at = NOW()
    WHERE id = company_user_id;
END;
$$;


ALTER FUNCTION "public"."approve_company"("company_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."approve_company"("company_id" "uuid") IS 'Approves a company and updates user role to COMPANY. Should only be called by SUPER_ADMIN';



CREATE OR REPLACE FUNCTION "public"."approve_pilot"("pilot_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    pilot_user_id UUID;
BEGIN
    -- Get the user_id from the pilot
    SELECT user_id INTO pilot_user_id
    FROM pilots
    WHERE id = pilot_id;
    
    IF pilot_user_id IS NULL THEN
        RAISE EXCEPTION 'Pilot not found';
    END IF;
    
    -- Update pilot status
    UPDATE pilots
    SET status = 'verified', updated_at = NOW()
    WHERE id = pilot_id;
    
    -- Update user role to TANDEM_PILOT
    UPDATE profiles
    SET role = 'TANDEM_PILOT', updated_at = NOW()
    WHERE id = pilot_user_id;
END;
$$;


ALTER FUNCTION "public"."approve_pilot"("pilot_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."approve_pilot"("pilot_id" "uuid") IS 'Approves a pilot and updates user role to TANDEM_PILOT. Should only be called by SUPER_ADMIN';



CREATE OR REPLACE FUNCTION "public"."approve_pilot_request"("request_id" "uuid", "response" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    req_pilot_id UUID;
    req_company_id UUID;
BEGIN
    SELECT pilot_id, company_id INTO req_pilot_id, req_company_id
    FROM pilot_company_requests
    WHERE id = request_id AND status = 'pending';
    
    IF req_pilot_id IS NULL THEN
        RAISE EXCEPTION 'Request not found or already processed';
    END IF;
    
    UPDATE pilot_company_requests
    SET 
        status = 'approved',
        response_message = response,
        responded_at = NOW(),
        updated_at = NOW()
    WHERE id = request_id;
    
    UPDATE pilots
    SET company_id = req_company_id, updated_at = NOW()
    WHERE id = req_pilot_id;
    
    UPDATE pilot_company_requests
    SET 
        status = 'rejected',
        response_message = 'პილოტმა სხვა კომპანიაში დაიწყო მუშაობა',
        responded_at = NOW(),
        updated_at = NOW()
    WHERE pilot_id = req_pilot_id
    AND id != request_id
    AND status = 'pending';
END;
$$;


ALTER FUNCTION "public"."approve_pilot_request"("request_id" "uuid", "response" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."approve_pilot_request"("request_id" "uuid", "response" "text") IS 'Approves a pilot request and updates pilot company_id. Rejects other pending requests from same pilot.';



CREATE OR REPLACE FUNCTION "public"."create_message_recipients"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- If recipient_type is 'ALL_USERS', insert all users
    IF NEW.recipient_type = 'ALL_USERS' THEN
        INSERT INTO public.message_recipients (message_id, user_id)
        SELECT NEW.id, id FROM auth.users
        WHERE id IN (SELECT id FROM public.profiles);
        
    -- If recipient_type is 'ROLE', insert all users with that role
    ELSIF NEW.recipient_type = 'ROLE' AND NEW.recipient_role IS NOT NULL THEN
        INSERT INTO public.message_recipients (message_id, user_id)
        SELECT NEW.id, id FROM public.profiles
        WHERE role = NEW.recipient_role::user_role;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_message_recipients"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unread_message_count"("user_uuid" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.message_recipients
        WHERE user_id = user_uuid AND is_read = FALSE
    );
END;
$$;


ALTER FUNCTION "public"."get_unread_message_count"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_promo_usage"("promo_code_text" "text", "people_count" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.promo_codes
  SET usage_count = usage_count + people_count
  WHERE code = promo_code_text
  AND is_active = true;
END;
$$;


ALTER FUNCTION "public"."increment_promo_usage"("promo_code_text" "text", "people_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."pilot_leave_company"("p_pilot_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE pilots
    SET company_id = NULL, updated_at = NOW()
    WHERE id = p_pilot_id
    AND user_id = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pilot not found or not authorized';
    END IF;
END;
$$;


ALTER FUNCTION "public"."pilot_leave_company"("p_pilot_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."pilot_leave_company"("p_pilot_id" "uuid") IS 'Allows a pilot to leave their current company';



CREATE OR REPLACE FUNCTION "public"."reject_pilot_request"("request_id" "uuid", "response" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE pilot_company_requests
    SET 
        status = 'rejected',
        response_message = response,
        responded_at = NOW(),
        updated_at = NOW()
    WHERE id = request_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found or already processed';
    END IF;
END;
$$;


ALTER FUNCTION "public"."reject_pilot_request"("request_id" "uuid", "response" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."reject_pilot_request"("request_id" "uuid", "response" "text") IS 'Rejects a pilot request with optional response message';



CREATE OR REPLACE FUNCTION "public"."update_bookings_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_bookings_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_cached_comments_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    target_table TEXT;
    total_count INTEGER;
BEGIN
    -- Only count approved comments
    IF TG_OP = 'DELETE' THEN
        target_table := OLD.commentable_type::TEXT;
        
        -- Calculate new count after deletion
        SELECT COUNT(*)
        INTO total_count
        FROM comments
        WHERE commentable_type = OLD.commentable_type 
        AND commentable_id = OLD.commentable_id
        AND is_approved = true;
        
        -- Update the appropriate table (bypasses RLS due to SECURITY DEFINER)
        IF target_table = 'country' THEN
            UPDATE countries 
            SET comments_count = total_count
            WHERE id = OLD.commentable_id;
        ELSIF target_table = 'location' THEN
            UPDATE locations 
            SET comments_count = total_count
            WHERE id = OLD.commentable_id;
        END IF;
        
        RETURN OLD;
    ELSE
        -- INSERT or UPDATE
        target_table := NEW.commentable_type::TEXT;
        
        -- Calculate new count
        SELECT COUNT(*)
        INTO total_count
        FROM comments
        WHERE commentable_type = NEW.commentable_type 
        AND commentable_id = NEW.commentable_id
        AND is_approved = true;
        
        -- Update the appropriate table (bypasses RLS due to SECURITY DEFINER)
        IF target_table = 'country' THEN
            UPDATE countries 
            SET comments_count = total_count
            WHERE id = NEW.commentable_id;
        ELSIF target_table = 'location' THEN
            UPDATE locations 
            SET comments_count = total_count
            WHERE id = NEW.commentable_id;
        END IF;
        
        RETURN NEW;
    END IF;
END;
$$;


ALTER FUNCTION "public"."update_cached_comments_count"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_cached_comments_count"() IS 'Trigger function to update cached comment counts. Uses SECURITY DEFINER to bypass RLS when updating countries/locations tables.';



CREATE OR REPLACE FUNCTION "public"."update_cached_ratings"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    target_table TEXT;
    avg_rating DECIMAL(3,2);
    total_count INTEGER;
BEGIN
    -- Determine which operation and which record to update
    IF TG_OP = 'DELETE' THEN
        target_table := OLD.ratable_type::TEXT;
        
        -- Calculate new aggregates after deletion
        SELECT 
            COALESCE(AVG(rating), 0)::DECIMAL(3,2),
            COUNT(*)
        INTO avg_rating, total_count
        FROM ratings
        WHERE ratable_type = OLD.ratable_type 
        AND ratable_id = OLD.ratable_id;
        
        -- Update the appropriate table (bypasses RLS due to SECURITY DEFINER)
        -- Cast TEXT ratable_id to UUID for countries/locations
        IF target_table = 'country' THEN
            UPDATE countries 
            SET cached_rating = avg_rating,
                cached_rating_count = total_count
            WHERE id = OLD.ratable_id::UUID;
        ELSIF target_table = 'location' THEN
            UPDATE locations 
            SET cached_rating = avg_rating,
                cached_rating_count = total_count
            WHERE id = OLD.ratable_id::UUID;
        END IF;
        
        RETURN OLD;
    ELSE
        -- INSERT or UPDATE
        target_table := NEW.ratable_type::TEXT;
        
        -- Calculate new aggregates
        SELECT 
            COALESCE(AVG(rating), 0)::DECIMAL(3,2),
            COUNT(*)
        INTO avg_rating, total_count
        FROM ratings
        WHERE ratable_type = NEW.ratable_type 
        AND ratable_id = NEW.ratable_id;
        
        -- Update the appropriate table (bypasses RLS due to SECURITY DEFINER)
        -- Cast TEXT ratable_id to UUID for countries/locations
        IF target_table = 'country' THEN
            UPDATE countries 
            SET cached_rating = avg_rating,
                cached_rating_count = total_count
            WHERE id = NEW.ratable_id::UUID;
        ELSIF target_table = 'location' THEN
            UPDATE locations 
            SET cached_rating = avg_rating,
                cached_rating_count = total_count
            WHERE id = NEW.ratable_id::UUID;
        END IF;
        
        RETURN NEW;
    END IF;
END;
$$;


ALTER FUNCTION "public"."update_cached_ratings"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_cached_ratings"() IS 'Trigger function to update cached rating aggregates. Uses SECURITY DEFINER to bypass RLS when updating countries/locations tables.';



CREATE OR REPLACE FUNCTION "public"."update_comment_reaction_counts"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    likes_total INTEGER;
    dislikes_total INTEGER;
BEGIN
    -- Determine which comment to update
    IF TG_OP = 'DELETE' THEN
        -- Calculate new counts after deletion
        SELECT 
            COUNT(*) FILTER (WHERE reaction_type = 'like'),
            COUNT(*) FILTER (WHERE reaction_type = 'dislike')
        INTO likes_total, dislikes_total
        FROM comment_reactions
        WHERE comment_id = OLD.comment_id;
        
        -- Update comment (bypasses RLS due to SECURITY DEFINER)
        UPDATE comments 
        SET likes_count = likes_total,
            dislikes_count = dislikes_total
        WHERE id = OLD.comment_id;
        
        RETURN OLD;
    ELSE
        -- INSERT or UPDATE
        SELECT 
            COUNT(*) FILTER (WHERE reaction_type = 'like'),
            COUNT(*) FILTER (WHERE reaction_type = 'dislike')
        INTO likes_total, dislikes_total
        FROM comment_reactions
        WHERE comment_id = NEW.comment_id;
        
        -- Update comment (bypasses RLS due to SECURITY DEFINER)
        UPDATE comments 
        SET likes_count = likes_total,
            dislikes_count = dislikes_total
        WHERE id = NEW.comment_id;
        
        RETURN NEW;
    END IF;
END;
$$;


ALTER FUNCTION "public"."update_comment_reaction_counts"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_comment_reaction_counts"() IS 'Trigger function to update comment reaction counts. Uses SECURITY DEFINER to bypass RLS when updating comments table.';



CREATE OR REPLACE FUNCTION "public"."update_companies_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_companies_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_pilot_achievements_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_pilot_achievements_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_pilot_company_requests_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    NEW.updated_at = NOW();
    -- Set responded_at when status changes from pending
    IF OLD.status = 'pending' AND NEW.status != 'pending' THEN
        NEW.responded_at = NOW();
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_pilot_company_requests_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_pilots_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_pilots_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_promo_codes_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_promo_codes_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_promo_code"("promo_code_text" "text", "people_count" integer, "location_id_param" "uuid") RETURNS TABLE("is_valid" boolean, "promo_code_id" "uuid", "discount_percentage" integer, "error_message" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  promo_record RECORD;
BEGIN
  -- Check if promo code exists and is active
  SELECT * INTO promo_record 
  FROM public.promo_codes 
  WHERE code = promo_code_text AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, 0, 'Invalid or inactive promo code';
    RETURN;
  END IF;
  
  -- Check valid_from date
  IF promo_record.valid_from IS NOT NULL AND NOW() < promo_record.valid_from THEN
    RETURN QUERY SELECT false, NULL::UUID, 0, 'Promo code not yet valid';
    RETURN;
  END IF;
  
  -- Check valid_until date
  IF promo_record.valid_until IS NOT NULL AND NOW() > promo_record.valid_until THEN
    RETURN QUERY SELECT false, NULL::UUID, 0, 'Promo code has expired';
    RETURN;
  END IF;
  
  -- Check usage_limit (considering people_count)
  IF promo_record.usage_limit IS NOT NULL 
     AND (promo_record.usage_count + people_count) > promo_record.usage_limit THEN
    RETURN QUERY SELECT false, NULL::UUID, 0, 'Promo code usage limit exceeded';
    RETURN;
  END IF;
  
  -- Check location restriction (if any locations are specified for this promo code)
  IF EXISTS (
    SELECT 1 FROM public.promo_code_locations pcl
    WHERE pcl.promo_code_id = promo_record.id
  ) THEN
    -- Locations are specified, check if current location is allowed
    IF NOT EXISTS (
      SELECT 1 FROM public.promo_code_locations pcl
      WHERE pcl.promo_code_id = promo_record.id 
      AND pcl.location_id = location_id_param
    ) THEN
      RETURN QUERY SELECT false, NULL::UUID, 0, 'Promo code not valid for this location';
      RETURN;
    END IF;
  END IF;
  
  -- All validations passed
  RETURN QUERY SELECT 
    true, 
    promo_record.id, 
    promo_record.discount_percentage, 
    NULL::TEXT;
END;
$$;


ALTER FUNCTION "public"."validate_promo_code"("promo_code_text" "text", "people_count" integer, "location_id_param" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "full_name" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "country_id" "uuid",
    "country_name" "text" NOT NULL,
    "location_id" "uuid",
    "location_name" "text" NOT NULL,
    "flight_type_id" "text" NOT NULL,
    "flight_type_name" "text" NOT NULL,
    "selected_date" "date" NOT NULL,
    "number_of_people" integer DEFAULT 1 NOT NULL,
    "contact_method" "text",
    "promo_code" "text",
    "promo_discount" integer DEFAULT 0,
    "special_requests" "text",
    "base_price" numeric(10,2) NOT NULL,
    "total_price" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'GEL'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "bookings_contact_method_check" CHECK (("contact_method" = ANY (ARRAY['whatsapp'::"text", 'telegram'::"text", 'viber'::"text"]))),
    CONSTRAINT "bookings_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'cancelled'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comment_reactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "comment_id" "uuid" NOT NULL,
    "reaction_type" "public"."reaction_type" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."comment_reactions" OWNER TO "postgres";


COMMENT ON TABLE "public"."comment_reactions" IS 'Stores user reactions (like/dislike) to comments';



COMMENT ON COLUMN "public"."comment_reactions"."reaction_type" IS 'Type of reaction: like or dislike';



CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "commentable_type" "public"."commentable_type" NOT NULL,
    "commentable_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "parent_comment_id" "uuid",
    "is_approved" boolean DEFAULT false NOT NULL,
    "approved_at" timestamp with time zone,
    "approved_by" "uuid",
    "likes_count" integer DEFAULT 0 NOT NULL,
    "dislikes_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "comments_content_check" CHECK ((("length"("content") > 0) AND ("length"("content") <= 5000)))
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


COMMENT ON TABLE "public"."comments" IS 'Stores user comments for countries, locations, and flight types with threading and moderation support';



COMMENT ON COLUMN "public"."comments"."commentable_type" IS 'Type of entity being commented on: country, location, or flight_type';



COMMENT ON COLUMN "public"."comments"."commentable_id" IS 'UUID of the entity being commented on';



COMMENT ON COLUMN "public"."comments"."content" IS 'Comment text content (max 5000 characters)';



COMMENT ON COLUMN "public"."comments"."parent_comment_id" IS 'Reference to parent comment for threading/replies (NULL for top-level comments)';



COMMENT ON COLUMN "public"."comments"."is_approved" IS 'Moderation flag - comments must be approved to be publicly visible';



COMMENT ON COLUMN "public"."comments"."likes_count" IS 'Cached count of like reactions';



COMMENT ON COLUMN "public"."comments"."dislikes_count" IS 'Cached count of dislike reactions';



CREATE TABLE IF NOT EXISTS "public"."companies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name_ka" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "email" "text" NOT NULL,
    "founded_date" "date",
    "identification_code" "text" NOT NULL,
    "description_ka" "text",
    "description_en" "text",
    "description_ru" "text",
    "description_ar" "text",
    "description_de" "text",
    "description_tr" "text",
    "logo_url" "text",
    "status" "public"."company_status" DEFAULT 'pending'::"public"."company_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name_en" "text",
    "name_ru" "text",
    "name_ar" "text",
    "name_de" "text",
    "name_tr" "text",
    "slug_ka" "text",
    "slug_en" "text",
    "slug_ru" "text",
    "slug_ar" "text",
    "slug_de" "text",
    "slug_tr" "text",
    "seo_title_ka" "text",
    "seo_title_en" "text",
    "seo_title_ru" "text",
    "seo_title_ar" "text",
    "seo_title_de" "text",
    "seo_title_tr" "text",
    "seo_description_ka" "text",
    "seo_description_en" "text",
    "seo_description_ru" "text",
    "seo_description_ar" "text",
    "seo_description_de" "text",
    "seo_description_tr" "text",
    "og_title_ka" "text",
    "og_title_en" "text",
    "og_title_ru" "text",
    "og_title_ar" "text",
    "og_title_de" "text",
    "og_title_tr" "text",
    "og_description_ka" "text",
    "og_description_en" "text",
    "og_description_ru" "text",
    "og_description_ar" "text",
    "og_description_de" "text",
    "og_description_tr" "text",
    "og_image" "text"
);


ALTER TABLE "public"."companies" OWNER TO "postgres";


COMMENT ON TABLE "public"."companies" IS 'Stores company registration information with multi-language support';



COMMENT ON COLUMN "public"."companies"."name_ka" IS 'Company name in Georgian';



COMMENT ON COLUMN "public"."companies"."identification_code" IS 'Company tax/registration identification code';



COMMENT ON COLUMN "public"."companies"."status" IS 'pending: awaiting admin approval, verified: approved, blocked: suspended, hidden: not visible publicly';



COMMENT ON COLUMN "public"."companies"."name_en" IS 'Company name in English';



COMMENT ON COLUMN "public"."companies"."name_ru" IS 'Company name in Russian';



COMMENT ON COLUMN "public"."companies"."name_ar" IS 'Company name in Arabic';



COMMENT ON COLUMN "public"."companies"."name_de" IS 'Company name in German';



COMMENT ON COLUMN "public"."companies"."name_tr" IS 'Company name in Turkish';



COMMENT ON COLUMN "public"."companies"."slug_ka" IS 'URL slug in Georgian for SEO-friendly URLs';



COMMENT ON COLUMN "public"."companies"."slug_en" IS 'URL slug in English for SEO-friendly URLs';



COMMENT ON COLUMN "public"."companies"."slug_ru" IS 'URL slug in Russian for SEO-friendly URLs';



COMMENT ON COLUMN "public"."companies"."slug_ar" IS 'URL slug in Arabic for SEO-friendly URLs';



COMMENT ON COLUMN "public"."companies"."slug_de" IS 'URL slug in German for SEO-friendly URLs';



COMMENT ON COLUMN "public"."companies"."slug_tr" IS 'URL slug in Turkish for SEO-friendly URLs';



COMMENT ON COLUMN "public"."companies"."seo_title_ka" IS 'Meta title in Georgian for search engines';



COMMENT ON COLUMN "public"."companies"."seo_title_en" IS 'Meta title in English for search engines';



COMMENT ON COLUMN "public"."companies"."seo_title_ru" IS 'Meta title in Russian for search engines';



COMMENT ON COLUMN "public"."companies"."seo_title_ar" IS 'Meta title in Arabic for search engines';



COMMENT ON COLUMN "public"."companies"."seo_title_de" IS 'Meta title in German for search engines';



COMMENT ON COLUMN "public"."companies"."seo_title_tr" IS 'Meta title in Turkish for search engines';



COMMENT ON COLUMN "public"."companies"."seo_description_ka" IS 'Meta description in Georgian for search engines';



COMMENT ON COLUMN "public"."companies"."seo_description_en" IS 'Meta description in English for search engines';



COMMENT ON COLUMN "public"."companies"."seo_description_ru" IS 'Meta description in Russian for search engines';



COMMENT ON COLUMN "public"."companies"."seo_description_ar" IS 'Meta description in Arabic for search engines';



COMMENT ON COLUMN "public"."companies"."seo_description_de" IS 'Meta description in German for search engines';



COMMENT ON COLUMN "public"."companies"."seo_description_tr" IS 'Meta description in Turkish for search engines';



COMMENT ON COLUMN "public"."companies"."og_title_ka" IS 'Open Graph title in Georgian for social media sharing';



COMMENT ON COLUMN "public"."companies"."og_title_en" IS 'Open Graph title in English for social media sharing';



COMMENT ON COLUMN "public"."companies"."og_title_ru" IS 'Open Graph title in Russian for social media sharing';



COMMENT ON COLUMN "public"."companies"."og_title_ar" IS 'Open Graph title in Arabic for social media sharing';



COMMENT ON COLUMN "public"."companies"."og_title_de" IS 'Open Graph title in German for social media sharing';



COMMENT ON COLUMN "public"."companies"."og_title_tr" IS 'Open Graph title in Turkish for social media sharing';



COMMENT ON COLUMN "public"."companies"."og_description_ka" IS 'Open Graph description in Georgian for social media sharing';



COMMENT ON COLUMN "public"."companies"."og_description_en" IS 'Open Graph description in English for social media sharing';



COMMENT ON COLUMN "public"."companies"."og_description_ru" IS 'Open Graph description in Russian for social media sharing';



COMMENT ON COLUMN "public"."companies"."og_description_ar" IS 'Open Graph description in Arabic for social media sharing';



COMMENT ON COLUMN "public"."companies"."og_description_de" IS 'Open Graph description in German for social media sharing';



COMMENT ON COLUMN "public"."companies"."og_description_tr" IS 'Open Graph description in Turkish for social media sharing';



COMMENT ON COLUMN "public"."companies"."og_image" IS 'Shared Open Graph image URL for social media sharing';



CREATE TABLE IF NOT EXISTS "public"."countries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "name_ka" "text" NOT NULL,
    "slug_ka" "text" NOT NULL,
    "seo_title_ka" "text",
    "seo_description_ka" "text",
    "name_en" "text" NOT NULL,
    "slug_en" "text" NOT NULL,
    "seo_title_en" "text",
    "seo_description_en" "text",
    "name_ru" "text" NOT NULL,
    "slug_ru" "text" NOT NULL,
    "seo_title_ru" "text",
    "seo_description_ru" "text",
    "name_ar" "text",
    "slug_ar" "text",
    "seo_title_ar" "text",
    "seo_description_ar" "text",
    "name_de" "text",
    "slug_de" "text",
    "seo_title_de" "text",
    "seo_description_de" "text",
    "name_tr" "text",
    "slug_tr" "text",
    "seo_title_tr" "text",
    "seo_description_tr" "text",
    "og_image_url" "text",
    "og_title_ka" "text",
    "og_description_ka" "text",
    "og_title_en" "text",
    "og_description_en" "text",
    "og_title_ru" "text",
    "og_description_ru" "text",
    "og_title_ar" "text",
    "og_description_ar" "text",
    "og_title_de" "text",
    "og_description_de" "text",
    "og_title_tr" "text",
    "og_description_tr" "text",
    "content" "jsonb",
    "is_active" boolean DEFAULT true,
    "average_rating" numeric(3,2) DEFAULT 0.00,
    "ratings_count" integer DEFAULT 0,
    "comments_count" integer DEFAULT 0,
    "cached_rating" numeric(3,2) DEFAULT 0,
    "cached_rating_count" integer DEFAULT 0
);


ALTER TABLE "public"."countries" OWNER TO "postgres";


COMMENT ON TABLE "public"."countries" IS 'ქვეყნების ცხრილი - მთავარი კატეგორიები';



COMMENT ON COLUMN "public"."countries"."og_image_url" IS 'Open Graph სურათის URL (1200x630px რეკომენდებული)';



COMMENT ON COLUMN "public"."countries"."content" IS 'Rich content including images, descriptions, and history in multiple languages';



COMMENT ON COLUMN "public"."countries"."is_active" IS 'Whether the country page is active/published';



CREATE TABLE IF NOT EXISTS "public"."location_pages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "country_id" "uuid" NOT NULL,
    "location_id" "uuid" NOT NULL,
    "is_active" boolean DEFAULT true,
    "content" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."location_pages" OWNER TO "postgres";


COMMENT ON COLUMN "public"."location_pages"."content" IS 'Multilingual content with shared_videos, shared_flight_types (with prices), shared_images + ka/en/ru/ar/de/tr languages. Flight types reference shared_flight_types via shared_id for pricing.';



CREATE TABLE IF NOT EXISTS "public"."locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "country_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "name_ka" "text" NOT NULL,
    "slug_ka" "text" NOT NULL,
    "seo_title_ka" "text",
    "seo_description_ka" "text",
    "name_en" "text" NOT NULL,
    "slug_en" "text" NOT NULL,
    "seo_title_en" "text",
    "seo_description_en" "text",
    "name_ru" "text" NOT NULL,
    "slug_ru" "text" NOT NULL,
    "seo_title_ru" "text",
    "seo_description_ru" "text",
    "name_ar" "text",
    "slug_ar" "text",
    "seo_title_ar" "text",
    "seo_description_ar" "text",
    "name_de" "text",
    "slug_de" "text",
    "seo_title_de" "text",
    "seo_description_de" "text",
    "name_tr" "text",
    "slug_tr" "text",
    "seo_title_tr" "text",
    "seo_description_tr" "text",
    "og_image_url" "text",
    "og_title_ka" "text",
    "og_description_ka" "text",
    "og_title_en" "text",
    "og_description_en" "text",
    "og_title_ru" "text",
    "og_description_ru" "text",
    "og_title_ar" "text",
    "og_description_ar" "text",
    "og_title_de" "text",
    "og_description_de" "text",
    "og_title_tr" "text",
    "og_description_tr" "text",
    "map_iframe_url" "text",
    "average_rating" numeric(3,2) DEFAULT 0.00,
    "ratings_count" integer DEFAULT 0,
    "comments_count" integer DEFAULT 0,
    "cached_rating" numeric(3,2) DEFAULT 0,
    "cached_rating_count" integer DEFAULT 0,
    "altitude" integer,
    "best_season_start" integer,
    "best_season_end" integer,
    "difficulty_level" "public"."difficulty_level",
    CONSTRAINT "locations_best_season_end_check" CHECK ((("best_season_end" >= 1) AND ("best_season_end" <= 12))),
    CONSTRAINT "locations_best_season_start_check" CHECK ((("best_season_start" >= 1) AND ("best_season_start" <= 12)))
);


ALTER TABLE "public"."locations" OWNER TO "postgres";


COMMENT ON TABLE "public"."locations" IS 'ლოკაციების ცხრილი - ქვეყნების subcategories';



COMMENT ON COLUMN "public"."locations"."country_id" IS 'ლოკაციის მშობელი ქვეყანა';



COMMENT ON COLUMN "public"."locations"."og_image_url" IS 'Open Graph სურათის URL (1200x630px რეკომენდებული)';



COMMENT ON COLUMN "public"."locations"."map_iframe_url" IS 'Google Maps embed iframe URL for displaying location on map';



COMMENT ON COLUMN "public"."locations"."altitude" IS 'Altitude of the takeoff location in meters';



COMMENT ON COLUMN "public"."locations"."best_season_start" IS 'Best season start month (1-12)';



COMMENT ON COLUMN "public"."locations"."best_season_end" IS 'Best season end month (1-12)';



COMMENT ON COLUMN "public"."locations"."difficulty_level" IS 'Difficulty level: beginner, intermediate, or advanced';



CREATE TABLE IF NOT EXISTS "public"."message_recipients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."message_recipients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "recipient_type" "text" NOT NULL,
    "recipient_role" "text",
    "subject_ka" "text" NOT NULL,
    "subject_en" "text",
    "subject_ru" "text",
    "subject_ar" "text",
    "subject_de" "text",
    "subject_tr" "text",
    "content_ka" "text" NOT NULL,
    "content_en" "text",
    "content_ru" "text",
    "content_ar" "text",
    "content_de" "text",
    "content_tr" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "messages_recipient_role_check" CHECK (("recipient_role" = ANY (ARRAY['USER'::"text", 'SUPER_ADMIN'::"text"]))),
    CONSTRAINT "messages_recipient_type_check" CHECK (("recipient_type" = ANY (ARRAY['USER'::"text", 'ALL_USERS'::"text", 'ROLE'::"text"])))
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pilot_achievements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pilot_id" "uuid" NOT NULL,
    "title_ka" "text",
    "title_en" "text",
    "title_ru" "text",
    "title_ar" "text",
    "title_de" "text",
    "title_tr" "text",
    "description_ka" "text",
    "description_en" "text",
    "description_ru" "text",
    "description_ar" "text",
    "description_de" "text",
    "description_tr" "text",
    "achievement_date" "date",
    "certificate_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."pilot_achievements" OWNER TO "postgres";


COMMENT ON TABLE "public"."pilot_achievements" IS 'Stores pilot achievements/accomplishments with multi-language support';



COMMENT ON COLUMN "public"."pilot_achievements"."achievement_date" IS 'Date when the achievement was earned';



COMMENT ON COLUMN "public"."pilot_achievements"."certificate_url" IS 'Optional URL to certificate or proof of achievement';



CREATE TABLE IF NOT EXISTS "public"."pilot_company_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pilot_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "status" "public"."pilot_company_request_status" DEFAULT 'pending'::"public"."pilot_company_request_status" NOT NULL,
    "message" "text",
    "response_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "responded_at" timestamp with time zone,
    "initiated_by" "public"."request_initiator" DEFAULT 'pilot_request'::"public"."request_initiator" NOT NULL
);


ALTER TABLE "public"."pilot_company_requests" OWNER TO "postgres";


COMMENT ON TABLE "public"."pilot_company_requests" IS 'Stores pilot requests to join companies';



COMMENT ON COLUMN "public"."pilot_company_requests"."status" IS 'pending: awaiting company response, approved: pilot joined company, rejected: request declined';



COMMENT ON COLUMN "public"."pilot_company_requests"."message" IS 'Optional message from pilot to company';



COMMENT ON COLUMN "public"."pilot_company_requests"."response_message" IS 'Optional response message from company';



COMMENT ON COLUMN "public"."pilot_company_requests"."initiated_by" IS 'Who initiated the request: pilot_request (pilot asked to join) or company_invite (company invited pilot)';



CREATE TABLE IF NOT EXISTS "public"."pilots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "first_name_ka" "text",
    "first_name_ru" "text",
    "first_name_de" "text",
    "first_name_tr" "text",
    "first_name_ar" "text",
    "last_name_ka" "text",
    "last_name_ru" "text",
    "last_name_de" "text",
    "last_name_tr" "text",
    "last_name_ar" "text",
    "birth_date" "date",
    "gender" "text",
    "phone" "text" NOT NULL,
    "email" "text" NOT NULL,
    "avatar_url" "text",
    "commercial_start_date" "date",
    "total_flights" integer,
    "tandem_flights" integer,
    "bio_ka" "text",
    "bio_en" "text",
    "bio_ru" "text",
    "bio_ar" "text",
    "bio_de" "text",
    "bio_tr" "text",
    "wing_brand" "text",
    "wing_model" "text",
    "wing_certificate_url" "text",
    "pilot_harness_brand" "text",
    "pilot_harness_model" "text",
    "pilot_harness_certificate_url" "text",
    "passenger_harness_brand" "text",
    "passenger_harness_model" "text",
    "passenger_harness_certificate_url" "text",
    "reserve_brand" "text",
    "reserve_model" "text",
    "reserve_certificate_url" "text",
    "verification_documents" "text"[] DEFAULT '{}'::"text"[],
    "company_id" "uuid",
    "slug" "text",
    "slug_ka" "text",
    "slug_en" "text",
    "slug_ru" "text",
    "slug_ar" "text",
    "slug_de" "text",
    "slug_tr" "text",
    "seo_title_ka" "text",
    "seo_title_en" "text",
    "seo_title_ru" "text",
    "seo_title_ar" "text",
    "seo_title_de" "text",
    "seo_title_tr" "text",
    "seo_description_ka" "text",
    "seo_description_en" "text",
    "seo_description_ru" "text",
    "seo_description_ar" "text",
    "seo_description_de" "text",
    "seo_description_tr" "text",
    "og_title_ka" "text",
    "og_title_en" "text",
    "og_title_ru" "text",
    "og_title_ar" "text",
    "og_title_de" "text",
    "og_title_tr" "text",
    "og_description_ka" "text",
    "og_description_en" "text",
    "og_description_ru" "text",
    "og_description_ar" "text",
    "og_description_de" "text",
    "og_description_tr" "text",
    "status" "public"."pilot_status" DEFAULT 'pending'::"public"."pilot_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "pilots_gender_check" CHECK (("gender" = ANY (ARRAY['male'::"text", 'female'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."pilots" OWNER TO "postgres";


COMMENT ON TABLE "public"."pilots" IS 'Stores tandem pilot registration information with equipment details and multi-language support';



COMMENT ON COLUMN "public"."pilots"."commercial_start_date" IS 'Date when pilot started commercial tandem flying - used to calculate experience';



COMMENT ON COLUMN "public"."pilots"."company_id" IS 'Optional company association - pilot can be independent or work for a company';



COMMENT ON COLUMN "public"."pilots"."status" IS 'pending: awaiting admin approval, verified: approved, blocked: suspended, hidden: not visible publicly';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "role" "public"."user_role" DEFAULT 'USER'::"public"."user_role" NOT NULL,
    "avatar_url" "text",
    "phone" "text",
    "bio" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."promo_code_locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "promo_code_id" "uuid" NOT NULL,
    "location_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."promo_code_locations" OWNER TO "postgres";


COMMENT ON TABLE "public"."promo_code_locations" IS 'Junction table linking promo codes to specific locations. If empty, promo code applies to all locations.';



CREATE TABLE IF NOT EXISTS "public"."promo_code_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "booking_id" "uuid",
    "promo_code_id" "uuid",
    "people_count" integer NOT NULL,
    "discount_amount" numeric(10,2) NOT NULL,
    "used_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "promo_code_usage_people_count_check" CHECK (("people_count" > 0))
);


ALTER TABLE "public"."promo_code_usage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."promo_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "discount_percentage" integer NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "usage_limit" integer,
    "usage_count" integer DEFAULT 0 NOT NULL,
    "valid_from" timestamp with time zone,
    "valid_until" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "image_path" "text",
    "description_ka" "text",
    "description_en" "text",
    "description_ru" "text",
    "description_ar" "text",
    "description_de" "text",
    "description_tr" "text",
    "is_published" boolean DEFAULT false NOT NULL,
    CONSTRAINT "promo_codes_code_check" CHECK (("code" ~ '^[A-Z0-9]+$'::"text")),
    CONSTRAINT "promo_codes_discount_percentage_check" CHECK ((("discount_percentage" > 0) AND ("discount_percentage" <= 100))),
    CONSTRAINT "promo_codes_valid_dates_check" CHECK ((("valid_until" IS NULL) OR ("valid_from" IS NULL) OR ("valid_until" > "valid_from")))
);


ALTER TABLE "public"."promo_codes" OWNER TO "postgres";


COMMENT ON COLUMN "public"."promo_codes"."image_path" IS 'Path to image in Promo bucket (e.g., promo-code-id/image.jpg)';



COMMENT ON COLUMN "public"."promo_codes"."description_ka" IS 'Georgian description of the promotion';



COMMENT ON COLUMN "public"."promo_codes"."description_en" IS 'English description of the promotion';



COMMENT ON COLUMN "public"."promo_codes"."description_ru" IS 'Russian description of the promotion';



COMMENT ON COLUMN "public"."promo_codes"."is_published" IS 'Whether the promo code is visible on public promotions page. Active codes can be used even if not published (for personal offers).';



CREATE TABLE IF NOT EXISTS "public"."ratings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "ratable_type" "public"."ratable_type" NOT NULL,
    "ratable_id" "text" NOT NULL,
    "rating" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ratings_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."ratings" OWNER TO "postgres";


COMMENT ON TABLE "public"."ratings" IS 'Stores user ratings (1-5 stars) for countries, locations, and flight types';



COMMENT ON COLUMN "public"."ratings"."ratable_type" IS 'Type of entity being rated: country, location, or flight_type';



COMMENT ON COLUMN "public"."ratings"."ratable_id" IS 'ID of the rated entity. UUID for countries/locations, string ID for flight_types';



COMMENT ON COLUMN "public"."ratings"."rating" IS 'Rating value from 1 to 5 stars';



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comment_reactions"
    ADD CONSTRAINT "comment_reactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_identification_code_unique" UNIQUE ("identification_code");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_user_id_unique" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."countries"
    ADD CONSTRAINT "countries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."countries"
    ADD CONSTRAINT "countries_slug_ar_key" UNIQUE ("slug_ar");



ALTER TABLE ONLY "public"."countries"
    ADD CONSTRAINT "countries_slug_de_key" UNIQUE ("slug_de");



ALTER TABLE ONLY "public"."countries"
    ADD CONSTRAINT "countries_slug_en_key" UNIQUE ("slug_en");



ALTER TABLE ONLY "public"."countries"
    ADD CONSTRAINT "countries_slug_ka_key" UNIQUE ("slug_ka");



ALTER TABLE ONLY "public"."countries"
    ADD CONSTRAINT "countries_slug_ru_key" UNIQUE ("slug_ru");



ALTER TABLE ONLY "public"."countries"
    ADD CONSTRAINT "countries_slug_tr_key" UNIQUE ("slug_tr");



ALTER TABLE ONLY "public"."location_pages"
    ADD CONSTRAINT "location_pages_location_id_key" UNIQUE ("location_id");



ALTER TABLE ONLY "public"."location_pages"
    ADD CONSTRAINT "location_pages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message_recipients"
    ADD CONSTRAINT "message_recipients_message_id_user_id_key" UNIQUE ("message_id", "user_id");



ALTER TABLE ONLY "public"."message_recipients"
    ADD CONSTRAINT "message_recipients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pilot_achievements"
    ADD CONSTRAINT "pilot_achievements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pilot_company_requests"
    ADD CONSTRAINT "pilot_company_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pilots"
    ADD CONSTRAINT "pilots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pilots"
    ADD CONSTRAINT "pilots_user_id_unique" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."promo_code_locations"
    ADD CONSTRAINT "promo_code_locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."promo_code_locations"
    ADD CONSTRAINT "promo_code_locations_promo_code_id_location_id_key" UNIQUE ("promo_code_id", "location_id");



ALTER TABLE ONLY "public"."promo_code_usage"
    ADD CONSTRAINT "promo_code_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."promo_codes"
    ADD CONSTRAINT "promo_codes_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."promo_codes"
    ADD CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ratings"
    ADD CONSTRAINT "ratings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pilot_company_requests"
    ADD CONSTRAINT "unique_active_request" UNIQUE ("pilot_id", "company_id");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "unique_location_slug_en_per_country" UNIQUE ("country_id", "slug_en");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "unique_location_slug_ka_per_country" UNIQUE ("country_id", "slug_ka");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "unique_location_slug_ru_per_country" UNIQUE ("country_id", "slug_ru");



ALTER TABLE ONLY "public"."comment_reactions"
    ADD CONSTRAINT "unique_user_comment_reaction" UNIQUE ("user_id", "comment_id");



COMMENT ON CONSTRAINT "unique_user_comment_reaction" ON "public"."comment_reactions" IS 'Ensures each user can react to each comment only once';



ALTER TABLE ONLY "public"."ratings"
    ADD CONSTRAINT "unique_user_rating" UNIQUE ("user_id", "ratable_type", "ratable_id");



COMMENT ON CONSTRAINT "unique_user_rating" ON "public"."ratings" IS 'Ensures each user can rate each item only once';



CREATE INDEX "idx_bookings_created_at" ON "public"."bookings" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_bookings_location_id" ON "public"."bookings" USING "btree" ("location_id");



CREATE INDEX "idx_bookings_selected_date" ON "public"."bookings" USING "btree" ("selected_date");



CREATE INDEX "idx_bookings_status" ON "public"."bookings" USING "btree" ("status");



CREATE INDEX "idx_bookings_user_id" ON "public"."bookings" USING "btree" ("user_id");



CREATE INDEX "idx_comment_reactions_comment" ON "public"."comment_reactions" USING "btree" ("comment_id");



CREATE INDEX "idx_comment_reactions_user" ON "public"."comment_reactions" USING "btree" ("user_id");



CREATE INDEX "idx_comments_approved" ON "public"."comments" USING "btree" ("is_approved");



CREATE INDEX "idx_comments_commentable" ON "public"."comments" USING "btree" ("commentable_type", "commentable_id");



CREATE INDEX "idx_comments_created_at" ON "public"."comments" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_comments_parent" ON "public"."comments" USING "btree" ("parent_comment_id");



CREATE INDEX "idx_comments_user" ON "public"."comments" USING "btree" ("user_id");



CREATE INDEX "idx_companies_created_at" ON "public"."companies" USING "btree" ("created_at" DESC);



CREATE UNIQUE INDEX "idx_companies_slug_ar" ON "public"."companies" USING "btree" ("slug_ar") WHERE ("slug_ar" IS NOT NULL);



CREATE UNIQUE INDEX "idx_companies_slug_de" ON "public"."companies" USING "btree" ("slug_de") WHERE ("slug_de" IS NOT NULL);



CREATE UNIQUE INDEX "idx_companies_slug_en" ON "public"."companies" USING "btree" ("slug_en") WHERE ("slug_en" IS NOT NULL);



CREATE UNIQUE INDEX "idx_companies_slug_ka" ON "public"."companies" USING "btree" ("slug_ka") WHERE ("slug_ka" IS NOT NULL);



CREATE UNIQUE INDEX "idx_companies_slug_ru" ON "public"."companies" USING "btree" ("slug_ru") WHERE ("slug_ru" IS NOT NULL);



CREATE UNIQUE INDEX "idx_companies_slug_tr" ON "public"."companies" USING "btree" ("slug_tr") WHERE ("slug_tr" IS NOT NULL);



CREATE INDEX "idx_companies_status" ON "public"."companies" USING "btree" ("status");



CREATE INDEX "idx_companies_user_id" ON "public"."companies" USING "btree" ("user_id");



CREATE INDEX "idx_countries_comments_count" ON "public"."countries" USING "btree" ("comments_count" DESC);



CREATE INDEX "idx_countries_created_at" ON "public"."countries" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_countries_rating" ON "public"."countries" USING "btree" ("average_rating" DESC);



CREATE INDEX "idx_countries_slug_ar" ON "public"."countries" USING "btree" ("slug_ar");



CREATE INDEX "idx_countries_slug_de" ON "public"."countries" USING "btree" ("slug_de");



CREATE INDEX "idx_countries_slug_en" ON "public"."countries" USING "btree" ("slug_en");



CREATE INDEX "idx_countries_slug_ka" ON "public"."countries" USING "btree" ("slug_ka");



CREATE INDEX "idx_countries_slug_ru" ON "public"."countries" USING "btree" ("slug_ru");



CREATE INDEX "idx_countries_slug_tr" ON "public"."countries" USING "btree" ("slug_tr");



CREATE INDEX "idx_location_pages_content" ON "public"."location_pages" USING "gin" ("content");



CREATE INDEX "idx_location_pages_country_id" ON "public"."location_pages" USING "btree" ("country_id");



CREATE INDEX "idx_location_pages_is_active" ON "public"."location_pages" USING "btree" ("is_active");



CREATE INDEX "idx_location_pages_location_id" ON "public"."location_pages" USING "btree" ("location_id");



CREATE INDEX "idx_locations_comments_count" ON "public"."locations" USING "btree" ("comments_count" DESC);



CREATE INDEX "idx_locations_country_id" ON "public"."locations" USING "btree" ("country_id");



CREATE INDEX "idx_locations_created_at" ON "public"."locations" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_locations_difficulty" ON "public"."locations" USING "btree" ("difficulty_level");



CREATE INDEX "idx_locations_rating" ON "public"."locations" USING "btree" ("average_rating" DESC);



CREATE INDEX "idx_locations_slug_en" ON "public"."locations" USING "btree" ("slug_en");



CREATE INDEX "idx_locations_slug_ka" ON "public"."locations" USING "btree" ("slug_ka");



CREATE INDEX "idx_locations_slug_ru" ON "public"."locations" USING "btree" ("slug_ru");



CREATE INDEX "idx_message_recipients_message" ON "public"."message_recipients" USING "btree" ("message_id");



CREATE INDEX "idx_message_recipients_unread" ON "public"."message_recipients" USING "btree" ("user_id", "is_read") WHERE ("is_read" = false);



CREATE INDEX "idx_message_recipients_user" ON "public"."message_recipients" USING "btree" ("user_id");



CREATE INDEX "idx_messages_created_at" ON "public"."messages" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_messages_sender" ON "public"."messages" USING "btree" ("sender_id");



CREATE INDEX "idx_pilot_achievements_date" ON "public"."pilot_achievements" USING "btree" ("achievement_date" DESC);



CREATE INDEX "idx_pilot_achievements_pilot_id" ON "public"."pilot_achievements" USING "btree" ("pilot_id");



CREATE INDEX "idx_pilot_company_requests_company_id" ON "public"."pilot_company_requests" USING "btree" ("company_id");



CREATE INDEX "idx_pilot_company_requests_created_at" ON "public"."pilot_company_requests" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_pilot_company_requests_initiated_by" ON "public"."pilot_company_requests" USING "btree" ("initiated_by");



CREATE INDEX "idx_pilot_company_requests_pilot_id" ON "public"."pilot_company_requests" USING "btree" ("pilot_id");



CREATE INDEX "idx_pilot_company_requests_status" ON "public"."pilot_company_requests" USING "btree" ("status");



CREATE INDEX "idx_pilots_company_id" ON "public"."pilots" USING "btree" ("company_id");



CREATE INDEX "idx_pilots_created_at" ON "public"."pilots" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_pilots_slug" ON "public"."pilots" USING "btree" ("slug");



CREATE INDEX "idx_pilots_slug_en" ON "public"."pilots" USING "btree" ("slug_en");



CREATE INDEX "idx_pilots_slug_ka" ON "public"."pilots" USING "btree" ("slug_ka");



CREATE INDEX "idx_pilots_status" ON "public"."pilots" USING "btree" ("status");



CREATE INDEX "idx_pilots_user_id" ON "public"."pilots" USING "btree" ("user_id");



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_profiles_role" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "idx_promo_code_locations_location_id" ON "public"."promo_code_locations" USING "btree" ("location_id");



CREATE INDEX "idx_promo_code_locations_promo_code_id" ON "public"."promo_code_locations" USING "btree" ("promo_code_id");



CREATE INDEX "idx_promo_codes_active" ON "public"."promo_codes" USING "btree" ("is_active");



CREATE INDEX "idx_promo_codes_code" ON "public"."promo_codes" USING "btree" ("code");



CREATE INDEX "idx_promo_codes_published" ON "public"."promo_codes" USING "btree" ("is_published");



CREATE INDEX "idx_promo_usage_booking_id" ON "public"."promo_code_usage" USING "btree" ("booking_id");



CREATE INDEX "idx_promo_usage_promo_code_id" ON "public"."promo_code_usage" USING "btree" ("promo_code_id");



CREATE INDEX "idx_promo_usage_used_at" ON "public"."promo_code_usage" USING "btree" ("used_at" DESC);



CREATE INDEX "idx_promo_usage_user_id" ON "public"."promo_code_usage" USING "btree" ("user_id");



CREATE INDEX "idx_ratings_created_at" ON "public"."ratings" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_ratings_ratable" ON "public"."ratings" USING "btree" ("ratable_type", "ratable_id");



CREATE INDEX "idx_ratings_user" ON "public"."ratings" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "after_message_insert" AFTER INSERT ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."create_message_recipients"();



CREATE OR REPLACE TRIGGER "companies_updated_at_trigger" BEFORE UPDATE ON "public"."companies" FOR EACH ROW EXECUTE FUNCTION "public"."update_companies_updated_at"();



CREATE OR REPLACE TRIGGER "pilot_achievements_updated_at_trigger" BEFORE UPDATE ON "public"."pilot_achievements" FOR EACH ROW EXECUTE FUNCTION "public"."update_pilot_achievements_updated_at"();



CREATE OR REPLACE TRIGGER "pilot_company_requests_updated_at_trigger" BEFORE UPDATE ON "public"."pilot_company_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_pilot_company_requests_updated_at"();



CREATE OR REPLACE TRIGGER "pilots_updated_at_trigger" BEFORE UPDATE ON "public"."pilots" FOR EACH ROW EXECUTE FUNCTION "public"."update_pilots_updated_at"();



CREATE OR REPLACE TRIGGER "set_bookings_updated_at" BEFORE UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."update_bookings_updated_at"();



CREATE OR REPLACE TRIGGER "set_comments_updated_at" BEFORE UPDATE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_ratings_updated_at" BEFORE UPDATE ON "public"."ratings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_update_comments_count_after_delete" AFTER DELETE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_cached_comments_count"();



CREATE OR REPLACE TRIGGER "trigger_update_comments_count_after_insert" AFTER INSERT ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_cached_comments_count"();



CREATE OR REPLACE TRIGGER "trigger_update_comments_count_after_update" AFTER UPDATE ON "public"."comments" FOR EACH ROW WHEN (("old"."is_approved" IS DISTINCT FROM "new"."is_approved")) EXECUTE FUNCTION "public"."update_cached_comments_count"();



CREATE OR REPLACE TRIGGER "trigger_update_ratings_after_delete" AFTER DELETE ON "public"."ratings" FOR EACH ROW EXECUTE FUNCTION "public"."update_cached_ratings"();



CREATE OR REPLACE TRIGGER "trigger_update_ratings_after_insert" AFTER INSERT ON "public"."ratings" FOR EACH ROW EXECUTE FUNCTION "public"."update_cached_ratings"();



CREATE OR REPLACE TRIGGER "trigger_update_ratings_after_update" AFTER UPDATE ON "public"."ratings" FOR EACH ROW EXECUTE FUNCTION "public"."update_cached_ratings"();



CREATE OR REPLACE TRIGGER "trigger_update_reaction_counts_after_delete" AFTER DELETE ON "public"."comment_reactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_comment_reaction_counts"();



CREATE OR REPLACE TRIGGER "trigger_update_reaction_counts_after_insert" AFTER INSERT ON "public"."comment_reactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_comment_reaction_counts"();



CREATE OR REPLACE TRIGGER "trigger_update_reaction_counts_after_update" AFTER UPDATE ON "public"."comment_reactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_comment_reaction_counts"();



CREATE OR REPLACE TRIGGER "update_countries_updated_at" BEFORE UPDATE ON "public"."countries" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_locations_updated_at" BEFORE UPDATE ON "public"."locations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_messages_updated_at" BEFORE UPDATE ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_promo_codes_updated_at" BEFORE UPDATE ON "public"."promo_codes" FOR EACH ROW EXECUTE FUNCTION "public"."update_promo_codes_updated_at"();



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."comment_reactions"
    ADD CONSTRAINT "comment_reactions_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment_reactions"
    ADD CONSTRAINT "comment_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."location_pages"
    ADD CONSTRAINT "location_pages_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."location_pages"
    ADD CONSTRAINT "location_pages_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_recipients"
    ADD CONSTRAINT "message_recipients_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_recipients"
    ADD CONSTRAINT "message_recipients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pilot_company_requests"
    ADD CONSTRAINT "pilot_company_requests_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pilots"
    ADD CONSTRAINT "pilots_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pilots"
    ADD CONSTRAINT "pilots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."promo_code_locations"
    ADD CONSTRAINT "promo_code_locations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."promo_code_locations"
    ADD CONSTRAINT "promo_code_locations_promo_code_id_fkey" FOREIGN KEY ("promo_code_id") REFERENCES "public"."promo_codes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."promo_code_usage"
    ADD CONSTRAINT "promo_code_usage_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."promo_code_usage"
    ADD CONSTRAINT "promo_code_usage_promo_code_id_fkey" FOREIGN KEY ("promo_code_id") REFERENCES "public"."promo_codes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."promo_code_usage"
    ADD CONSTRAINT "promo_code_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."promo_codes"
    ADD CONSTRAINT "promo_codes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ratings"
    ADD CONSTRAINT "ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Anonymous users can insert promo usage" ON "public"."promo_code_usage" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Anyone can view active promo codes" ON "public"."promo_codes" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view approved comments" ON "public"."comments" FOR SELECT USING ((("is_approved" = true) OR ("auth"."uid"() = "user_id")));



CREATE POLICY "Anyone can view comment reactions" ON "public"."comment_reactions" FOR SELECT USING (true);



CREATE POLICY "Anyone can view locations" ON "public"."locations" FOR SELECT USING (true);



CREATE POLICY "Anyone can view ratings" ON "public"."ratings" FOR SELECT USING (true);



CREATE POLICY "Authenticated users can insert comments" ON "public"."comments" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Authenticated users can insert ratings" ON "public"."ratings" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Authenticated users can insert reactions" ON "public"."comment_reactions" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Companies can create invites" ON "public"."pilot_company_requests" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "pilot_company_requests"."company_id") AND ("companies"."user_id" = "auth"."uid"())))));



COMMENT ON POLICY "Companies can create invites" ON "public"."pilot_company_requests" IS 'Allows companies to send invitations to pilots';



CREATE POLICY "Companies can respond to requests" ON "public"."pilot_company_requests" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "pilot_company_requests"."company_id") AND ("companies"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "pilot_company_requests"."company_id") AND ("companies"."user_id" = "auth"."uid"())))));



CREATE POLICY "Companies can view their requests" ON "public"."pilot_company_requests" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."id" = "pilot_company_requests"."company_id") AND ("companies"."user_id" = "auth"."uid"())))));



CREATE POLICY "Enable delete for super admins" ON "public"."bookings" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"public"."user_role")))));



CREATE POLICY "Enable insert for all users" ON "public"."bookings" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Enable select for own bookings" ON "public"."bookings" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable select for super admins" ON "public"."bookings" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"public"."user_role")))));



CREATE POLICY "Enable update for super admins" ON "public"."bookings" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"public"."user_role")))));



CREATE POLICY "Only SUPER_ADMIN can delete locations" ON "public"."locations" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"public"."user_role")))));



CREATE POLICY "Only SUPER_ADMIN can insert locations" ON "public"."locations" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"public"."user_role")))));



CREATE POLICY "Only SUPER_ADMIN can update locations" ON "public"."locations" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"public"."user_role")))));



CREATE POLICY "Pilots can create requests" ON "public"."pilot_company_requests" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."pilots"
  WHERE (("pilots"."id" = "pilot_company_requests"."pilot_id") AND ("pilots"."user_id" = "auth"."uid"())))));



CREATE POLICY "Pilots can delete pending requests" ON "public"."pilot_company_requests" FOR DELETE USING ((("status" = 'pending'::"public"."pilot_company_request_status") AND (EXISTS ( SELECT 1
   FROM "public"."pilots"
  WHERE (("pilots"."id" = "pilot_company_requests"."pilot_id") AND ("pilots"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Pilots can respond to company invites" ON "public"."pilot_company_requests" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."pilots"
  WHERE (("pilots"."id" = "pilot_company_requests"."pilot_id") AND ("pilots"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."pilots"
  WHERE (("pilots"."id" = "pilot_company_requests"."pilot_id") AND ("pilots"."user_id" = "auth"."uid"())))));



CREATE POLICY "Pilots can view own requests" ON "public"."pilot_company_requests" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."pilots"
  WHERE (("pilots"."id" = "pilot_company_requests"."pilot_id") AND ("pilots"."user_id" = "auth"."uid"())))));



CREATE POLICY "Public can read countries" ON "public"."countries" FOR SELECT USING (true);



CREATE POLICY "Public can view promo code locations" ON "public"."promo_code_locations" FOR SELECT USING (true);



CREATE POLICY "Public can view verified companies" ON "public"."companies" FOR SELECT USING (("status" = 'verified'::"public"."company_status"));



CREATE POLICY "Public can view verified pilots" ON "public"."pilots" FOR SELECT USING (("status" = 'verified'::"public"."pilot_status"));



CREATE POLICY "Public location_pages are viewable by everyone" ON "public"."location_pages" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Public profiles are viewable by everyone" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "SUPER_ADMIN can delete countries" ON "public"."countries" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"public"."user_role")))));



CREATE POLICY "SUPER_ADMIN can delete location_pages" ON "public"."location_pages" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"public"."user_role")))));



CREATE POLICY "SUPER_ADMIN can insert countries" ON "public"."countries" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"public"."user_role")))));



CREATE POLICY "SUPER_ADMIN can insert location_pages" ON "public"."location_pages" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"public"."user_role")))));



CREATE POLICY "SUPER_ADMIN can update countries" ON "public"."countries" FOR UPDATE TO "authenticated" USING (true) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"public"."user_role")))));



CREATE POLICY "SUPER_ADMIN can update location_pages" ON "public"."location_pages" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"public"."user_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"public"."user_role")))));



CREATE POLICY "SUPER_ADMIN can view all location_pages" ON "public"."location_pages" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"public"."user_role")))));



CREATE POLICY "Super Admins can create message recipients" ON "public"."message_recipients" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"public"."user_role")))));



CREATE POLICY "Super Admins can create messages" ON "public"."messages" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"public"."user_role")))));



CREATE POLICY "Super Admins can delete their messages" ON "public"."messages" FOR DELETE USING (((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"public"."user_role")))) AND ("sender_id" = "auth"."uid"())));



CREATE POLICY "Super Admins can update their messages" ON "public"."messages" FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"public"."user_role")))) AND ("sender_id" = "auth"."uid"())));



CREATE POLICY "Super Admins can view all message recipients" ON "public"."message_recipients" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"public"."user_role")))));



CREATE POLICY "Super Admins can view their sent messages" ON "public"."messages" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"public"."user_role")))) AND ("sender_id" = "auth"."uid"())));



CREATE POLICY "Super admin can delete any company" ON "public"."companies" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"public"."user_role")))));



CREATE POLICY "Super admin can delete any pilot" ON "public"."pilots" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"public"."user_role")))));



CREATE POLICY "Super admin can delete any pilot achievement" ON "public"."pilot_achievements" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"public"."user_role")))));



CREATE POLICY "Super admin can delete any pilot company request" ON "public"."pilot_company_requests" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"public"."user_role")))));



CREATE POLICY "Super admin can manage promo code locations" ON "public"."promo_code_locations" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"public"."user_role")))));



CREATE POLICY "Super admin can update any company" ON "public"."companies" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"public"."user_role")))));



CREATE POLICY "Super admin can update any pilot" ON "public"."pilots" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"public"."user_role")))));



CREATE POLICY "Super admin can update any pilot achievement" ON "public"."pilot_achievements" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"public"."user_role")))));



CREATE POLICY "Super admin can update any pilot company request" ON "public"."pilot_company_requests" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"public"."user_role")))));



CREATE POLICY "Super admin can view all companies" ON "public"."companies" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"public"."user_role")))));



CREATE POLICY "Super admin can view all pilot achievements" ON "public"."pilot_achievements" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"public"."user_role")))));



CREATE POLICY "Super admin can view all pilot company requests" ON "public"."pilot_company_requests" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"public"."user_role")))));



CREATE POLICY "Super admin can view all pilots" ON "public"."pilots" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"public"."user_role")))));



CREATE POLICY "Super admins can delete any profile" ON "public"."profiles" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "profiles_1"
  WHERE (("profiles_1"."id" = "auth"."uid"()) AND ("profiles_1"."role" = 'SUPER_ADMIN'::"public"."user_role")))));



CREATE POLICY "Super admins can manage promo codes" ON "public"."promo_codes" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"public"."user_role")))));



CREATE POLICY "Super admins can update any profile" ON "public"."profiles" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "profiles_1"
  WHERE (("profiles_1"."id" = "auth"."uid"()) AND ("profiles_1"."role" = 'SUPER_ADMIN'::"public"."user_role")))));



CREATE POLICY "Super admins have full access to comments" ON "public"."comments" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"public"."user_role")))));



CREATE POLICY "SuperAdmin can delete promo usage" ON "public"."promo_code_usage" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"public"."user_role")))));



CREATE POLICY "SuperAdmin can view all promo usage" ON "public"."promo_code_usage" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"public"."user_role")))));



CREATE POLICY "Users can create own company" ON "public"."companies" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create own pilot profile" ON "public"."pilots" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own comments" ON "public"."comments" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own ratings" ON "public"."ratings" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own reactions" ON "public"."comment_reactions" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert their promo usage" ON "public"."promo_code_usage" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own comments" ON "public"."comments" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own company" ON "public"."companies" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own pilot profile" ON "public"."pilots" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own ratings" ON "public"."ratings" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own reactions" ON "public"."comment_reactions" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their message read status" ON "public"."message_recipients" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own company" ON "public"."companies" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own pilot profile" ON "public"."pilots" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own messages" ON "public"."message_recipients" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their promo usage" ON "public"."promo_code_usage" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their received messages" ON "public"."messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."message_recipients"
  WHERE (("message_recipients"."message_id" = "messages"."id") AND ("message_recipients"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comment_reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."countries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."location_pages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."locations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_recipients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pilot_achievements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pilot_company_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pilots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."promo_code_locations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."promo_code_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."promo_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ratings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ratings_delete_policy" ON "public"."ratings" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "ratings_insert_policy" ON "public"."ratings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "ratings_select_policy" ON "public"."ratings" FOR SELECT USING (true);



CREATE POLICY "ratings_update_policy" ON "public"."ratings" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."approve_company"("company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."approve_company"("company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_company"("company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."approve_pilot"("pilot_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."approve_pilot"("pilot_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_pilot"("pilot_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."approve_pilot_request"("request_id" "uuid", "response" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."approve_pilot_request"("request_id" "uuid", "response" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_pilot_request"("request_id" "uuid", "response" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_message_recipients"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_message_recipients"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_message_recipients"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unread_message_count"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_message_count"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_message_count"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_promo_usage"("promo_code_text" "text", "people_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_promo_usage"("promo_code_text" "text", "people_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_promo_usage"("promo_code_text" "text", "people_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."pilot_leave_company"("p_pilot_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."pilot_leave_company"("p_pilot_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pilot_leave_company"("p_pilot_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."reject_pilot_request"("request_id" "uuid", "response" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."reject_pilot_request"("request_id" "uuid", "response" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reject_pilot_request"("request_id" "uuid", "response" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_bookings_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_bookings_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_bookings_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_cached_comments_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_cached_comments_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_cached_comments_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_cached_ratings"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_cached_ratings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_cached_ratings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_comment_reaction_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_comment_reaction_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_comment_reaction_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_companies_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_companies_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_companies_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_pilot_achievements_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_pilot_achievements_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_pilot_achievements_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_pilot_company_requests_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_pilot_company_requests_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_pilot_company_requests_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_pilots_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_pilots_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_pilots_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_promo_codes_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_promo_codes_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_promo_codes_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_promo_code"("promo_code_text" "text", "people_count" integer, "location_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_promo_code"("promo_code_text" "text", "people_count" integer, "location_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_promo_code"("promo_code_text" "text", "people_count" integer, "location_id_param" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON TABLE "public"."comment_reactions" TO "anon";
GRANT ALL ON TABLE "public"."comment_reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."comment_reactions" TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT ALL ON TABLE "public"."companies" TO "anon";
GRANT ALL ON TABLE "public"."companies" TO "authenticated";
GRANT ALL ON TABLE "public"."companies" TO "service_role";



GRANT ALL ON TABLE "public"."countries" TO "anon";
GRANT ALL ON TABLE "public"."countries" TO "authenticated";
GRANT ALL ON TABLE "public"."countries" TO "service_role";



GRANT ALL ON TABLE "public"."location_pages" TO "anon";
GRANT ALL ON TABLE "public"."location_pages" TO "authenticated";
GRANT ALL ON TABLE "public"."location_pages" TO "service_role";



GRANT ALL ON TABLE "public"."locations" TO "anon";
GRANT ALL ON TABLE "public"."locations" TO "authenticated";
GRANT ALL ON TABLE "public"."locations" TO "service_role";



GRANT ALL ON TABLE "public"."message_recipients" TO "anon";
GRANT ALL ON TABLE "public"."message_recipients" TO "authenticated";
GRANT ALL ON TABLE "public"."message_recipients" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."pilot_achievements" TO "anon";
GRANT ALL ON TABLE "public"."pilot_achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."pilot_achievements" TO "service_role";



GRANT ALL ON TABLE "public"."pilot_company_requests" TO "anon";
GRANT ALL ON TABLE "public"."pilot_company_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."pilot_company_requests" TO "service_role";



GRANT ALL ON TABLE "public"."pilots" TO "anon";
GRANT ALL ON TABLE "public"."pilots" TO "authenticated";
GRANT ALL ON TABLE "public"."pilots" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."promo_code_locations" TO "anon";
GRANT ALL ON TABLE "public"."promo_code_locations" TO "authenticated";
GRANT ALL ON TABLE "public"."promo_code_locations" TO "service_role";



GRANT ALL ON TABLE "public"."promo_code_usage" TO "anon";
GRANT ALL ON TABLE "public"."promo_code_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."promo_code_usage" TO "service_role";



GRANT ALL ON TABLE "public"."promo_codes" TO "anon";
GRANT ALL ON TABLE "public"."promo_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."promo_codes" TO "service_role";



GRANT ALL ON TABLE "public"."ratings" TO "anon";
GRANT ALL ON TABLE "public"."ratings" TO "authenticated";
GRANT ALL ON TABLE "public"."ratings" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







