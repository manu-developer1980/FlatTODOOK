-- Ensure patient profile can be created during signup
-- This fixes the issue where patient profiles aren't created during registration

-- Create a function to safely create patient profile
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
BEGIN
    -- Check if patient profile already exists
    SELECT id INTO v_patient_id FROM patients WHERE user_id = p_user_id;
    
    IF v_patient_id IS NULL THEN
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
        
        -- Award welcome badge
        INSERT INTO user_badges (user_id, badge_id, earned_at, points_at_earning)
        SELECT p_user_id, id, now(), 0 
        FROM badges 
        WHERE name = 'welcome';
        
    END IF;
    
    RETURN v_patient_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_patient_profile TO authenticated;