-- Test query to check intake logs for current user
SELECT 
    il.id,
    il.medication_id,
    il.scheduled_time,
    il.taken_at,
    il.status,
    il.notes,
    m.generic_name as medication_name,
    p.user_id
FROM intake_logs il
JOIN medications m ON il.medication_id = m.id  
JOIN patients p ON m.patient_id = p.id
WHERE p.user_id = '00000000-0000-0000-0000-000000000000' -- Replace with actual user ID
ORDER BY il.taken_at DESC;