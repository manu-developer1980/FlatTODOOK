-- Create comprehensive RLS policies for all tables
-- This migration ensures authenticated users can access their own data

-- Patients table policies
CREATE POLICY "Users can view own patient profile" ON patients
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own patient profile" ON patients
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own patient profile" ON patients
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Medications table policies (through patient relationship)
CREATE POLICY "Users can view own medications" ON medications
    FOR SELECT USING (
        patient_id IN (
            SELECT id FROM patients WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own medications" ON medications
    FOR INSERT WITH CHECK (
        patient_id IN (
            SELECT id FROM patients WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own medications" ON medications
    FOR UPDATE USING (
        patient_id IN (
            SELECT id FROM patients WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can soft delete own medications" ON medications
    FOR UPDATE USING (
        patient_id IN (
            SELECT id FROM patients WHERE user_id = auth.uid()
        )
    );

-- Dosage schedules table policies (through medication -> patient relationship)
CREATE POLICY "Users can view own dosage schedules" ON dosage_schedules
    FOR SELECT USING (
        medication_id IN (
            SELECT id FROM medications 
            WHERE patient_id IN (
                SELECT id FROM patients WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert own dosage schedules" ON dosage_schedules
    FOR INSERT WITH CHECK (
        medication_id IN (
            SELECT id FROM medications 
            WHERE patient_id IN (
                SELECT id FROM patients WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update own dosage schedules" ON dosage_schedules
    FOR UPDATE USING (
        medication_id IN (
            SELECT id FROM medications 
            WHERE patient_id IN (
                SELECT id FROM patients WHERE user_id = auth.uid()
            )
        )
    );

-- Intake logs table policies (through medication -> patient relationship)
CREATE POLICY "Users can view own intake logs" ON intake_logs
    FOR SELECT USING (
        medication_id IN (
            SELECT id FROM medications 
            WHERE patient_id IN (
                SELECT id FROM patients WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert own intake logs" ON intake_logs
    FOR INSERT WITH CHECK (
        medication_id IN (
            SELECT id FROM medications 
            WHERE patient_id IN (
                SELECT id FROM patients WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update own intake logs" ON intake_logs
    FOR UPDATE USING (
        medication_id IN (
            SELECT id FROM medications 
            WHERE patient_id IN (
                SELECT id FROM patients WHERE user_id = auth.uid()
            )
        )
    );

-- Appointments table policies (through patient relationship)
CREATE POLICY "Users can view own appointments" ON appointments
    FOR SELECT USING (
        patient_id IN (
            SELECT id FROM patients WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own appointments" ON appointments
    FOR INSERT WITH CHECK (
        patient_id IN (
            SELECT id FROM patients WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own appointments" ON appointments
    FOR UPDATE USING (
        patient_id IN (
            SELECT id FROM patients WHERE user_id = auth.uid()
        )
    );

-- Notifications table policies (through patient relationship)
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (
        patient_id IN (
            SELECT id FROM patients WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (
        patient_id IN (
            SELECT id FROM patients WHERE user_id = auth.uid()
        )
    );

-- User stats table policies
CREATE POLICY "Users can view own stats" ON user_stats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own stats" ON user_stats
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats" ON user_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User badges table policies
CREATE POLICY "Users can view own badges" ON user_badges
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges" ON user_badges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Subscriptions table policies
CREATE POLICY "Users can view own subscription" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription" ON subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Badges table is read-only for all authenticated users
CREATE POLICY "Authenticated users can view badges" ON badges
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Audit logs table - users can only view their own audit logs
CREATE POLICY "Users can view own audit logs" ON audit_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Grant basic permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant read-only access to anon role for public data (if needed)
GRANT SELECT ON badges TO anon;

-- Create function to get current user ID
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS uuid AS $$
BEGIN
    RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;