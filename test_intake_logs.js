import { db } from '../src/lib/supabase';

// Test function to verify intake log creation and retrieval
async function testIntakeLogs() {
  console.log('=== Testing Intake Logs ===');
  
  // Replace with actual user ID and medication ID from your testing
  const userId = 'YOUR_USER_ID_HERE';
  const medicationId = 'YOUR_MEDICATION_ID_HERE';
  
  try {
    // Test creating an intake log
    console.log('Creating intake log...');
    const createResult = await db.createIntakeLog(medicationId, {
      taken_at: new Date().toISOString(),
      scheduled_time: new Date().toISOString(),
      status: 'taken',
      notes: 'Test intake log'
    });
    
    console.log('Create result:', createResult);
    
    // Test retrieving intake logs
    console.log('Retrieving intake logs...');
    const logsResult = await db.getIntakeLogs(userId);
    console.log('Logs result:', logsResult);
    
    if (logsResult.data) {
      console.log('Found', logsResult.data.length, 'intake logs');
      logsResult.data.forEach((log, index) => {
        console.log(`Log ${index + 1}:`, {
          id: log.id,
          medication_id: log.medication_id,
          taken_at: log.taken_at,
          scheduled_time: log.scheduled_time,
          status: log.status
        });
      });
    }
    
  } catch (error) {
    console.error('Error testing intake logs:', error);
  }
}

// Run the test
testIntakeLogs();