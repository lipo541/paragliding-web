-- Add SEO and multi-language fields to companies table
-- This migration adds name, slug, and SEO fields for all 6 languages

-- Step 1: Rename existing 'name' column to 'name_ka' and migrate data
ALTER TABLE public.companies RENAME COLUMN name TO name_ka;

-- Step 2: Add multi-language name columns
ALTER TABLE public.companies
  ADD COLUMN name_en TEXT,
  ADD COLUMN name_ru TEXT,
  ADD COLUMN name_ar TEXT,
  ADD COLUMN name_de TEXT,
  ADD COLUMN name_tr TEXT;

-- Step 3: Add slug columns for each language (for SEO-friendly URLs)
ALTER TABLE public.companies
  ADD COLUMN slug_ka TEXT,
  ADD COLUMN slug_en TEXT,
  ADD COLUMN slug_ru TEXT,
  ADD COLUMN slug_ar TEXT,
  ADD COLUMN slug_de TEXT,
  ADD COLUMN slug_tr TEXT;

-- Step 4: Add SEO title columns
ALTER TABLE public.companies
  ADD COLUMN seo_title_ka TEXT,
  ADD COLUMN seo_title_en TEXT,
  ADD COLUMN seo_title_ru TEXT,
  ADD COLUMN seo_title_ar TEXT,
  ADD COLUMN seo_title_de TEXT,
  ADD COLUMN seo_title_tr TEXT;

-- Step 5: Add SEO description columns
ALTER TABLE public.companies
  ADD COLUMN seo_description_ka TEXT,
  ADD COLUMN seo_description_en TEXT,
  ADD COLUMN seo_description_ru TEXT,
  ADD COLUMN seo_description_ar TEXT,
  ADD COLUMN seo_description_de TEXT,
  ADD COLUMN seo_description_tr TEXT;

-- Step 6: Add Open Graph title columns
ALTER TABLE public.companies
  ADD COLUMN og_title_ka TEXT,
  ADD COLUMN og_title_en TEXT,
  ADD COLUMN og_title_ru TEXT,
  ADD COLUMN og_title_ar TEXT,
  ADD COLUMN og_title_de TEXT,
  ADD COLUMN og_title_tr TEXT;

-- Step 7: Add Open Graph description columns
ALTER TABLE public.companies
  ADD COLUMN og_description_ka TEXT,
  ADD COLUMN og_description_en TEXT,
  ADD COLUMN og_description_ru TEXT,
  ADD COLUMN og_description_ar TEXT,
  ADD COLUMN og_description_de TEXT,
  ADD COLUMN og_description_tr TEXT;

-- Step 8: Add shared Open Graph image column
ALTER TABLE public.companies
  ADD COLUMN og_image TEXT;

-- Step 9: Create unique indexes for slugs (each language slug must be unique)
CREATE UNIQUE INDEX idx_companies_slug_ka ON public.companies (slug_ka) WHERE slug_ka IS NOT NULL;
CREATE UNIQUE INDEX idx_companies_slug_en ON public.companies (slug_en) WHERE slug_en IS NOT NULL;
CREATE UNIQUE INDEX idx_companies_slug_ru ON public.companies (slug_ru) WHERE slug_ru IS NOT NULL;
CREATE UNIQUE INDEX idx_companies_slug_ar ON public.companies (slug_ar) WHERE slug_ar IS NOT NULL;
CREATE UNIQUE INDEX idx_companies_slug_de ON public.companies (slug_de) WHERE slug_de IS NOT NULL;
CREATE UNIQUE INDEX idx_companies_slug_tr ON public.companies (slug_tr) WHERE slug_tr IS NOT NULL;

-- Step 10: Add comments for documentation
COMMENT ON COLUMN public.companies.name_ka IS 'Company name in Georgian';
COMMENT ON COLUMN public.companies.name_en IS 'Company name in English';
COMMENT ON COLUMN public.companies.name_ru IS 'Company name in Russian';
COMMENT ON COLUMN public.companies.name_ar IS 'Company name in Arabic';
COMMENT ON COLUMN public.companies.name_de IS 'Company name in German';
COMMENT ON COLUMN public.companies.name_tr IS 'Company name in Turkish';

COMMENT ON COLUMN public.companies.slug_ka IS 'URL slug in Georgian for SEO-friendly URLs';
COMMENT ON COLUMN public.companies.slug_en IS 'URL slug in English for SEO-friendly URLs';
COMMENT ON COLUMN public.companies.slug_ru IS 'URL slug in Russian for SEO-friendly URLs';
COMMENT ON COLUMN public.companies.slug_ar IS 'URL slug in Arabic for SEO-friendly URLs';
COMMENT ON COLUMN public.companies.slug_de IS 'URL slug in German for SEO-friendly URLs';
COMMENT ON COLUMN public.companies.slug_tr IS 'URL slug in Turkish for SEO-friendly URLs';

COMMENT ON COLUMN public.companies.seo_title_ka IS 'Meta title in Georgian for search engines';
COMMENT ON COLUMN public.companies.seo_title_en IS 'Meta title in English for search engines';
COMMENT ON COLUMN public.companies.seo_title_ru IS 'Meta title in Russian for search engines';
COMMENT ON COLUMN public.companies.seo_title_ar IS 'Meta title in Arabic for search engines';
COMMENT ON COLUMN public.companies.seo_title_de IS 'Meta title in German for search engines';
COMMENT ON COLUMN public.companies.seo_title_tr IS 'Meta title in Turkish for search engines';

COMMENT ON COLUMN public.companies.seo_description_ka IS 'Meta description in Georgian for search engines';
COMMENT ON COLUMN public.companies.seo_description_en IS 'Meta description in English for search engines';
COMMENT ON COLUMN public.companies.seo_description_ru IS 'Meta description in Russian for search engines';
COMMENT ON COLUMN public.companies.seo_description_ar IS 'Meta description in Arabic for search engines';
COMMENT ON COLUMN public.companies.seo_description_de IS 'Meta description in German for search engines';
COMMENT ON COLUMN public.companies.seo_description_tr IS 'Meta description in Turkish for search engines';

COMMENT ON COLUMN public.companies.og_title_ka IS 'Open Graph title in Georgian for social media sharing';
COMMENT ON COLUMN public.companies.og_title_en IS 'Open Graph title in English for social media sharing';
COMMENT ON COLUMN public.companies.og_title_ru IS 'Open Graph title in Russian for social media sharing';
COMMENT ON COLUMN public.companies.og_title_ar IS 'Open Graph title in Arabic for social media sharing';
COMMENT ON COLUMN public.companies.og_title_de IS 'Open Graph title in German for social media sharing';
COMMENT ON COLUMN public.companies.og_title_tr IS 'Open Graph title in Turkish for social media sharing';

COMMENT ON COLUMN public.companies.og_description_ka IS 'Open Graph description in Georgian for social media sharing';
COMMENT ON COLUMN public.companies.og_description_en IS 'Open Graph description in English for social media sharing';
COMMENT ON COLUMN public.companies.og_description_ru IS 'Open Graph description in Russian for social media sharing';
COMMENT ON COLUMN public.companies.og_description_ar IS 'Open Graph description in Arabic for social media sharing';
COMMENT ON COLUMN public.companies.og_description_de IS 'Open Graph description in German for social media sharing';
COMMENT ON COLUMN public.companies.og_description_tr IS 'Open Graph description in Turkish for social media sharing';

COMMENT ON COLUMN public.companies.og_image IS 'Shared Open Graph image URL for social media sharing';
