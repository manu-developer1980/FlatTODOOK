-- Check and fix intake_logs permissions

-- Check current permissions
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'intake_logs' 
AND grantee IN ('anon', 'authenticated') 
ORDER BY grantee, privilege_type;

-- Grant permissions if missing
GRANT SELECT, INSERT, UPDATE, DELETE ON intake_logs TO authenticated;
GRANT SELECT ON intake_logs TO anon;

-- Check RLS policies
SELECT polname, polcmd, polqual, polwithcheck 
FROM pg_policies 
WHERE tablename = 'intake_logs';

-- Test the RLS policy
SELECT 
    'Testing RLS for user: ' || current_setting('app.current_user_id', true) as test_info,
    count(*) as accessible_logs
FROM intake_logs il
JOIN medications m ON il.medication_id = m.id  
JOIN patients p ON m.patient_id = p.id
WHERE p.user_id = current_setting('app.current_user_id', true)::uuid;