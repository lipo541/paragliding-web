-- Migration: Add prices to existing flight types in location_pages
-- This script updates existing location_pages records that have flight_types but missing shared_flight_types with prices

-- ============================================
-- Step 1: Add shared_flight_types to locations that have flight_types
-- ============================================

-- Update location_pages that have flight_types in any language but no shared_flight_types
DO $$
DECLARE
  location_record RECORD;
  flight_type_record JSONB;
  shared_id TEXT;
  new_shared_flight_types JSONB;
  updated_content JSONB;
BEGIN
  -- Loop through all location_pages
  FOR location_record IN 
    SELECT id, content 
    FROM location_pages 
    WHERE is_active = true
  LOOP
    -- Initialize shared_flight_types array if it doesn't exist or is empty
    IF location_record.content->'shared_flight_types' IS NULL 
       OR jsonb_array_length(location_record.content->'shared_flight_types') = 0 THEN
      
      new_shared_flight_types := '[]'::jsonb;
      
      -- Check each language for flight_types
      FOR flight_type_record IN 
        SELECT jsonb_array_elements(
          COALESCE(location_record.content->'ka'->'flight_types', '[]'::jsonb)
        ) as ft
      LOOP
        -- Get or generate shared_id
        shared_id := flight_type_record->>'shared_id';
        
        IF shared_id IS NULL OR shared_id = '' THEN
          -- Generate a unique ID if missing
          shared_id := 'flight-' || substring(md5(random()::text) from 1 for 12);
        END IF;
        
        -- Add to shared_flight_types with default prices
        new_shared_flight_types := new_shared_flight_types || jsonb_build_object(
          'id', shared_id,
          'price_gel', COALESCE((flight_type_record->>'price_gel')::numeric, 150),
          'price_usd', COALESCE((flight_type_record->>'price_usd')::numeric, 50),
          'price_eur', COALESCE((flight_type_record->>'price_eur')::numeric, 45)
        );
        
        -- Update the flight_type in each language to have the shared_id
        -- We'll do this in a separate update
      END LOOP;
      
      -- If we found flight types, update the content
      IF jsonb_array_length(new_shared_flight_types) > 0 THEN
        updated_content := location_record.content || jsonb_build_object('shared_flight_types', new_shared_flight_types);
        
        UPDATE location_pages 
        SET content = updated_content,
            updated_at = NOW()
        WHERE id = location_record.id;
        
        RAISE NOTICE 'Updated location_page % with % shared flight types', 
          location_record.id, 
          jsonb_array_length(new_shared_flight_types);
      END IF;
    END IF;
  END LOOP;
END $$;

-- ============================================
-- Step 2: Ensure all flight_types have shared_id references
-- ============================================

DO $$
DECLARE
  location_record RECORD;
  lang TEXT;
  flight_types JSONB;
  updated_flight_types JSONB;
  flight_type JSONB;
  idx INTEGER;
  shared_types JSONB;
  shared_id TEXT;
  updated_content JSONB;
BEGIN
  -- Loop through all location_pages that have shared_flight_types
  FOR location_record IN 
    SELECT id, content 
    FROM location_pages 
    WHERE is_active = true 
      AND content->'shared_flight_types' IS NOT NULL
      AND jsonb_array_length(content->'shared_flight_types') > 0
  LOOP
    updated_content := location_record.content;
    shared_types := location_record.content->'shared_flight_types';
    
    -- Update each language
    FOREACH lang IN ARRAY ARRAY['ka', 'en', 'ru', 'ar', 'de', 'tr']
    LOOP
      IF location_record.content->lang->'flight_types' IS NOT NULL THEN
        flight_types := location_record.content->lang->'flight_types';
        updated_flight_types := '[]'::jsonb;
        
        -- Loop through each flight type in this language
        FOR idx IN 0..jsonb_array_length(flight_types)-1
        LOOP
          flight_type := flight_types->idx;
          
          -- Get shared_id from flight_type or match with shared_flight_types by index
          shared_id := flight_type->>'shared_id';
          
          IF shared_id IS NULL OR shared_id = '' THEN
            -- Try to get ID from shared_flight_types at the same index
            IF idx < jsonb_array_length(shared_types) THEN
              shared_id := shared_types->idx->>'id';
            END IF;
          END IF;
          
          -- Add shared_id to flight_type if it's not there
          IF shared_id IS NOT NULL AND shared_id != '' THEN
            flight_type := flight_type || jsonb_build_object('shared_id', shared_id);
          END IF;
          
          -- Remove price fields from language-specific flight_types (they should only be in shared)
          flight_type := flight_type - 'price_gel' - 'price_usd' - 'price_eur';
          
          updated_flight_types := updated_flight_types || jsonb_build_array(flight_type);
        END LOOP;
        
        -- Update the language content
        updated_content := jsonb_set(
          updated_content,
          ARRAY[lang, 'flight_types'],
          updated_flight_types
        );
      END IF;
    END LOOP;
    
    -- Save updated content
    UPDATE location_pages 
    SET content = updated_content,
        updated_at = NOW()
    WHERE id = location_record.id;
    
    RAISE NOTICE 'Updated shared_id references for location_page %', location_record.id;
  END LOOP;
END $$;

-- ============================================
-- Verification Query
-- ============================================

-- Check the results
DO $$
DECLARE
  total_locations INTEGER;
  locations_with_shared_types INTEGER;
  total_shared_types INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_locations FROM location_pages WHERE is_active = true;
  
  SELECT COUNT(*) INTO locations_with_shared_types 
  FROM location_pages 
  WHERE is_active = true 
    AND content->'shared_flight_types' IS NOT NULL
    AND jsonb_array_length(content->'shared_flight_types') > 0;
  
  SELECT SUM(jsonb_array_length(content->'shared_flight_types')) INTO total_shared_types
  FROM location_pages 
  WHERE is_active = true 
    AND content->'shared_flight_types' IS NOT NULL;
  
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Migration Summary:';
  RAISE NOTICE 'Total active locations: %', total_locations;
  RAISE NOTICE 'Locations with shared_flight_types: %', locations_with_shared_types;
  RAISE NOTICE 'Total shared flight types added: %', COALESCE(total_shared_types, 0);
  RAISE NOTICE '====================================';
END $$;

-- Add helpful comment
COMMENT ON COLUMN location_pages.content IS 'Multilingual content with shared_videos, shared_flight_types (with prices), shared_images + ka/en/ru/ar/de/tr languages. Flight types reference shared_flight_types via shared_id for pricing.';
