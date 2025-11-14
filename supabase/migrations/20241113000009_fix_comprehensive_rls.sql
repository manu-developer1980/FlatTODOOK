-- Fix RLS policies for patients table to resolve 406 and 42501 errors

-- Drop existing policies that might be causing conflicts
DROP POLICY IF EXISTS "Users can view own patient profile" ON patients;
DROP POLICY IF EXISTS "Users can update own patient profile" ON patients;
DROP POLICY IF EXISTS "Users can create own patient profile" ON patients;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON patients;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON patients;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON patients;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON patients;

-- Create comprehensive RLS policies for patients table

-- 1. Allow authenticated users to read their own patient profile
CREATE POLICY "Users can read own patient profile"
ON patients FOR SELECT
USING (
  auth.uid() = user_id
);

-- 2. Allow authenticated users to create their own patient profile
CREATE POLICY "Users can create own patient profile"
ON patients FOR INSERT
WITH CHECK (
  auth.uid() = user_id
);

-- 3. Allow authenticated users to update their own patient profile
CREATE POLICY "Users can update own patient profile"
ON patients FOR UPDATE
USING (
  auth.uid() = user_id
);

-- 4. Allow authenticated users to delete their own patient profile (if needed)
CREATE POLICY "Users can delete own patient profile"
ON patients FOR DELETE
USING (
  auth.uid() = user_id
);

-- Grant necessary permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON patients TO authenticated;
GRANT SELECT ON patients TO anon;

-- Fix RLS policies for user_stats table
DROP POLICY IF EXISTS "Users can view own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can update own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can create own stats" ON user_stats;

CREATE POLICY "Users can read own stats"
ON user_stats FOR SELECT
USING (
  auth.uid() = user_id
);

CREATE POLICY "Users can create own stats"
ON user_stats FOR INSERT
WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY "Users can update own stats"
ON user_stats FOR UPDATE
USING (
  auth.uid() = user_id
);

GRANT SELECT, INSERT, UPDATE ON user_stats TO authenticated;
GRANT SELECT ON user_stats TO anon;

-- Fix RLS policies for medications table
DROP POLICY IF EXISTS "Users can view own medications" ON medications;
DROP POLICY IF EXISTS "Users can create own medications" ON medications;
DROP POLICY IF EXISTS "Users can update own medications" ON medications;
DROP POLICY IF EXISTS "Users can delete own medications" ON medications;

-- Allow users to manage medications for their own patient profile
CREATE POLICY "Users can read own medications"
ON medications FOR SELECT
USING (
  patient_id IN (
    SELECT id FROM patients WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create own medications"
ON medications FOR INSERT
WITH CHECK (
  patient_id IN (
    SELECT id FROM patients WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own medications"
ON medications FOR UPDATE
USING (
  patient_id IN (
    SELECT id FROM patients WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own medications"
ON medications FOR DELETE
USING (
  patient_id IN (
    SELECT id FROM patients WHERE user_id = auth.uid()
  )
);

GRANT SELECT, INSERT, UPDATE, DELETE ON medications TO authenticated;
GRANT SELECT ON medications TO anon;

-- Fix RLS policies for other related tables
DROP POLICY IF EXISTS "Users can view own dosage schedules" ON dosage_schedules;
DROP POLICY IF EXISTS "Users can create own dosage schedules" ON dosage_schedules;

CREATE POLICY "Users can manage own dosage schedules"
ON dosage_schedules FOR ALL
USING (
  medication_id IN (
    SELECT id FROM medications 
    WHERE patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
  )
);

GRANT SELECT, INSERT, UPDATE, DELETE ON dosage_schedules TO authenticated;
GRANT SELECT ON dosage_schedules TO anon;

-- Fix intake_logs policies
DROP POLICY IF EXISTS "Users can view own intake logs" ON intake_logs;
DROP POLICY IF EXISTS "Users can create own intake logs" ON intake_logs;

CREATE POLICY "Users can manage own intake logs"
ON intake_logs FOR ALL
USING (
  medication_id IN (
    SELECT id FROM medications 
    WHERE patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
  )
);

GRANT SELECT, INSERT, UPDATE, DELETE ON intake_logs TO authenticated;
GRANT SELECT ON intake_logs TO anon;

-- Fix notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can create own notifications" ON notifications;

CREATE POLICY "Users can manage own notifications"
ON notifications FOR ALL
USING (
  patient_id IN (
    SELECT id FROM patients WHERE user_id = auth.uid()
  )
);

GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
GRANT SELECT ON notifications TO anon;

-- Fix appointments policies
DROP POLICY IF EXISTS "Users can view own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can create own appointments" ON appointments;

CREATE POLICY "Users can manage own appointments"
ON appointments FOR ALL
USING (
  patient_id IN (
    SELECT id FROM patients WHERE user_id = auth.uid()
  )
);

GRANT SELECT, INSERT, UPDATE, DELETE ON appointments TO authenticated;
GRANT SELECT ON appointments TO anon;

-- Fix user_badges policies
DROP POLICY IF EXISTS "Users can view own badges" ON user_badges;
DROP POLICY IF EXISTS "Users can earn own badges" ON user_badges;

CREATE POLICY "Users can manage own badges"
ON user_badges FOR ALL
USING (
  user_id = auth.uid()
);

GRANT SELECT, INSERT, UPDATE ON user_badges TO authenticated;
GRANT SELECT ON user_badges TO anon;

-- Fix subscriptions policies
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can create own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;

CREATE POLICY "Users can read own subscription"
ON subscriptions FOR SELECT
USING (
  user_id = auth.uid()
);

CREATE POLICY "Users can create own subscription"
ON subscriptions FOR INSERT
WITH CHECK (
  user_id = auth.uid()
);

CREATE POLICY "Users can update own subscription"
ON subscriptions FOR UPDATE
USING (
  user_id = auth.uid()
);

GRANT SELECT, INSERT, UPDATE ON subscriptions TO authenticated;
GRANT SELECT ON subscriptions TO anon;

-- Ensure audit_logs has proper policies
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can create audit logs" ON audit_logs;

CREATE POLICY "Users can read own audit logs"
ON audit_logs FOR SELECT
USING (
  user_id = auth.uid()
);

-- Allow system to create audit logs (for triggers)
CREATE POLICY "System can create audit logs"
ON audit_logs FOR INSERT
WITH CHECK (
  true
);

GRANT SELECT, INSERT ON audit_logs TO authenticated;
GRANT SELECT ON audit_logs TO anon;

-- Final permission check
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;