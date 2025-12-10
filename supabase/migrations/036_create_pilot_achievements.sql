-- =====================================================
-- Migration 036: Create Pilot Achievements Table
-- =====================================================
-- Purpose: Store pilot achievements/accomplishments
-- Features:
--   - Multi-language titles and descriptions (6 languages)
--   - Date of achievement
--   - RLS policies for security
-- =====================================================

-- 1. Create pilot_achievements table
CREATE TABLE pilot_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pilot_id UUID NOT NULL REFERENCES pilots(id) ON DELETE CASCADE,
    
    -- Multi-language titles
    title_ka TEXT,
    title_en TEXT,
    title_ru TEXT,
    title_ar TEXT,
    title_de TEXT,
    title_tr TEXT,
    
    -- Multi-language descriptions
    description_ka TEXT,
    description_en TEXT,
    description_ru TEXT,
    description_ar TEXT,
    description_de TEXT,
    description_tr TEXT,
    
    -- Achievement date
    achievement_date DATE,
    
    -- Optional certificate/proof URL
    certificate_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Create indexes for better performance
CREATE INDEX idx_pilot_achievements_pilot_id ON pilot_achievements(pilot_id);
CREATE INDEX idx_pilot_achievements_date ON pilot_achievements(achievement_date DESC);

-- 3. Enable Row Level Security
ALTER TABLE pilot_achievements ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Public can view achievements of verified pilots
CREATE POLICY "Public can view achievements of verified pilots"
    ON pilot_achievements
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM pilots
            WHERE pilots.id = pilot_achievements.pilot_id
            AND pilots.status = 'verified'
        )
    );

-- Users can view their own pilot achievements
CREATE POLICY "Users can view own pilot achievements"
    ON pilot_achievements
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM pilots
            WHERE pilots.id = pilot_achievements.pilot_id
            AND pilots.user_id = auth.uid()
        )
    );

-- Users can create achievements for their own pilot profile
CREATE POLICY "Users can create own pilot achievements"
    ON pilot_achievements
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM pilots
            WHERE pilots.id = pilot_achievements.pilot_id
            AND pilots.user_id = auth.uid()
        )
    );

-- Users can update their own pilot achievements
CREATE POLICY "Users can update own pilot achievements"
    ON pilot_achievements
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM pilots
            WHERE pilots.id = pilot_achievements.pilot_id
            AND pilots.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM pilots
            WHERE pilots.id = pilot_achievements.pilot_id
            AND pilots.user_id = auth.uid()
        )
    );

-- Users can delete their own pilot achievements
CREATE POLICY "Users can delete own pilot achievements"
    ON pilot_achievements
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM pilots
            WHERE pilots.id = pilot_achievements.pilot_id
            AND pilots.user_id = auth.uid()
        )
    );

-- Super admin can view all achievements
CREATE POLICY "Super admin can view all pilot achievements"
    ON pilot_achievements
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- Super admin can update any achievement
CREATE POLICY "Super admin can update any pilot achievement"
    ON pilot_achievements
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- Super admin can delete any achievement
CREATE POLICY "Super admin can delete any pilot achievement"
    ON pilot_achievements
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- 5. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pilot_achievements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER pilot_achievements_updated_at_trigger
    BEFORE UPDATE ON pilot_achievements
    FOR EACH ROW
    EXECUTE FUNCTION update_pilot_achievements_updated_at();

-- 6. Comments for documentation
COMMENT ON TABLE pilot_achievements IS 'Stores pilot achievements/accomplishments with multi-language support';
COMMENT ON COLUMN pilot_achievements.achievement_date IS 'Date when the achievement was earned';
COMMENT ON COLUMN pilot_achievements.certificate_url IS 'Optional URL to certificate or proof of achievement';
