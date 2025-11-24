-- Fix patient profile creation and RLS permissions
-- This migration ensures the create_patient_profile function exists and has proper permissions

-- Create or replace the function with proper error handling
CREATE OR REPLACE FUNCTION create_patient_profile(
    p_user_id uuid,
    p_first_name text,
    p_last_name text DEFAULT '',
    p_date_of_birth date DEFAULT NULL,
    p_gender text DEFAULT NULL,
    p_phone_number text DEFAULT NULL,
    p_emergency_contact_name text DEFAULT NULL,
    p_emergency_contact_phone text DEFAULT NULL,
    p_medical_conditions text[] DEFAULT NULL,
    p_allergies text[] DEFAULT NULL,
    p_preferred_language text DEFAULT 'es',
    p_timezone text DEFAULT 'Europe/Madrid',
    p_profile_completed boolean DEFAULT false
)
RETURNS uuid AS $$
DECLARE
    v_patient_id uuid;
    v_exists boolean;
BEGIN
    -- Check if patient profile already exists
    SELECT EXISTS(SELECT 1 FROM patients WHERE user_id = p_user_id) INTO v_exists;
    
    IF v_exists THEN
        SELECT id INTO v_patient_id FROM patients WHERE user_id = p_user_id;
        RETURN v_patient_id;
    END IF;

    -- Create new patient profile
    INSERT INTO patients (
        user_id,
        first_name,
        last_name,
        date_of_birth,
        gender,
        phone_number,
        emergency_contact_name,
        emergency_contact_phone,
        medical_conditions,
        allergies,
        preferred_language,
        timezone,
        profile_completed,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_first_name,
        p_last_name,
        p_date_of_birth,
        p_gender,
        p_phone_number,
        p_emergency_contact_name,
        p_emergency_contact_phone,
        p_medical_conditions,
        p_allergies,
        p_preferred_language,
        p_timezone,
        p_profile_completed,
        now(),
        now()
    ) RETURNING id INTO v_patient_id;
    
    -- Create initial user stats
    INSERT INTO user_stats (
        user_id,
        total_medications,
        active_medications,
        total_intakes,
        successful_intakes,
        missed_intakes,
        adherence_rate,
        current_streak,
        longest_streak,
        total_points,
        last_activity_at,
        updated_at
    ) VALUES (
        p_user_id,
        0, 0, 0, 0, 0, 0.00, 0, 0, 0, now(), now()
    );
    
    -- Award welcome badge if it exists
    INSERT INTO user_badges (user_id, badge_id, earned_at, points_at_earning)
    SELECT p_user_id, id, now(), 0 
    FROM badges 
    WHERE name = 'welcome'
    ON CONFLICT DO NOTHING;
    
    RETURN v_patient_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in create_patient_profile: %', SQLERRM;
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_patient_profile TO authenticated;

-- Ensure RLS is enabled on patients table
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies for patients table
DROP POLICY IF EXISTS "Users can view own patient profile" ON patients;
DROP POLICY IF EXISTS "Users can update own patient profile" ON patients;
DROP POLICY IF EXISTS "Users can insert own patient profile" ON patients;

CREATE POLICY "Users can view own patient profile" ON patients
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own patient profile" ON patients
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own patient profile" ON patients
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ensure RLS is enabled on user_stats table
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_stats table
DROP POLICY IF EXISTS "Users can view own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can update own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can insert own stats" ON user_stats;

CREATE POLICY "Users can view own stats" ON user_stats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own stats" ON user_stats
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats" ON user_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ensure RLS is enabled on user_badges table
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_badges table
DROP POLICY IF EXISTS "Users can view own badges" ON user_badges;
DROP POLICY IF EXISTS "Users can insert own badges" ON user_badges;

CREATE POLICY "Users can view own badges" ON user_badges
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges" ON user_badges
    FOR INSERT WITH CHECK (auth.uid() = user_id);