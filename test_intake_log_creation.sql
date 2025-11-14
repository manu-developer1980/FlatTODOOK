-- Test intake log creation directly
-- This will help us identify if there's a database issue

-- First, let's check what medications exist for the current user
SELECT 
    m.id as medication_id,
    m.generic_name,
    m.patient_id,
    p.user_id
FROM medications m
JOIN patients p ON m.patient_id = p.id
WHERE p.user_id = auth.uid();

-- Try to manually insert an intake log
INSERT INTO intake_logs (medication_id, scheduled_time, taken_at, status, notes)
VALUES (
    (SELECT m.id FROM medications m JOIN patients p ON m.patient_id = p.id WHERE p.user_id = auth.uid() LIMIT 1),
    NOW(),
    NOW(),
    'taken',
    'Test manual insertion'
);

-- Check if the insert worked
SELECT * FROM intake_logs il
JOIN medications m ON il.medication_id = m.id
JOIN patients p ON m.patient_id = p.id
WHERE p.user_id = auth.uid()
ORDER BY il.created_at DESC;