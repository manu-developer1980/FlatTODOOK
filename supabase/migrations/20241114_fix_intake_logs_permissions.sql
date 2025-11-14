-- Fix intake_logs permissions and RLS policies

-- Ensure proper grants
GRANT SELECT, INSERT, UPDATE, DELETE ON intake_logs TO authenticated;
GRANT SELECT ON intake_logs TO anon;

-- Check if RLS policies exist and recreate them if needed
DO $$
BEGIN
    -- Check if the policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'intake_logs' 
        AND policyname = 'Users can view own intake logs'
    ) THEN
        -- Create the policy if it doesn't exist
        CREATE POLICY "Users can view own intake logs" ON intake_logs
            FOR SELECT USING (
                medication_id IN (
                    SELECT m.id FROM medications m 
                    JOIN patients p ON m.patient_id = p.id 
                    WHERE p.user_id = auth.uid()
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'intake_logs' 
        AND policyname = 'Users can insert own intake logs'
    ) THEN
        CREATE POLICY "Users can insert own intake logs" ON intake_logs
            FOR INSERT WITH CHECK (
                medication_id IN (
                    SELECT m.id FROM medications m 
                    JOIN patients p ON m.patient_id = p.id 
                    WHERE p.user_id = auth.uid()
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'intake_logs' 
        AND policyname = 'Users can update own intake logs'
    ) THEN
        CREATE POLICY "Users can update own intake logs" ON intake_logs
            FOR UPDATE USING (
                medication_id IN (
                    SELECT m.id FROM medications m 
                    JOIN patients p ON m.patient_id = p.id 
                    WHERE p.user_id = auth.uid()
                )
            );
    END IF;
END $$;