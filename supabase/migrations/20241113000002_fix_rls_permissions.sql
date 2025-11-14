-- Fix RLS permissions for proper auth access

-- Grant basic access to authenticated users for patients table
GRANT SELECT ON patients TO authenticated;
GRANT INSERT ON patients TO authenticated;
GRANT UPDATE ON patients TO authenticated;

-- Grant access to medications table
GRANT SELECT ON medications TO authenticated;
GRANT INSERT ON medications TO authenticated;
GRANT UPDATE ON medications TO authenticated;
GRANT DELETE ON medications TO authenticated;

-- Grant access to dosage_schedules table
GRANT SELECT ON dosage_schedules TO authenticated;
GRANT INSERT ON dosage_schedules TO authenticated;
GRANT UPDATE ON dosage_schedules TO authenticated;
GRANT DELETE ON dosage_schedules TO authenticated;

-- Grant access to intake_logs table
GRANT SELECT ON intake_logs TO authenticated;
GRANT INSERT ON intake_logs TO authenticated;
GRANT UPDATE ON intake_logs TO authenticated;
GRANT DELETE ON intake_logs TO authenticated;

-- Grant access to notifications table
GRANT SELECT ON notifications TO authenticated;
GRANT INSERT ON notifications TO authenticated;
GRANT UPDATE ON notifications TO authenticated;
GRANT DELETE ON notifications TO authenticated;

-- Grant access to user_stats table
GRANT SELECT ON user_stats TO authenticated;
GRANT INSERT ON user_stats TO authenticated;
GRANT UPDATE ON user_stats TO authenticated;

-- Grant access to user_badges table
GRANT SELECT ON user_badges TO authenticated;
GRANT INSERT ON user_badges TO authenticated;

-- Grant access to badges table (read only)
GRANT SELECT ON badges TO authenticated;

-- Grant access to appointments table
GRANT SELECT ON appointments TO authenticated;
GRANT INSERT ON appointments TO authenticated;
GRANT UPDATE ON appointments TO authenticated;
GRANT DELETE ON appointments TO authenticated;

-- Grant access to audit_logs table (read only)
GRANT SELECT ON audit_logs TO authenticated;

-- Create function to get current user ID
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;