// Test script to verify Supabase API calls
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ovnnrejzzlscnidkvead.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92bm5yZWp6emxzY25pZGt2ZWFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNDQ2NTQsImV4cCI6MjA3ODYyMDY1NH0.PnB5sPUyDNHxFgobdTaaX5GJGYjA7cJlhcF6e09MS_k';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPatientsTable() {
  console.log('Testing patients table access...');
  
  try {
    // Test 1: Try to access patients table without auth (should fail)
    console.log('\n1. Testing without authentication:');
    const { data: data1, error: error1 } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', '16816bb5-d7a9-46bb-877c-ec63b012f537');
    
    console.log('Result without auth:', { data: data1, error: error1 });
    
    // Test 2: Try to sign in first
    console.log('\n2. Testing with authentication:');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword'
    });
    
    if (authError) {
      console.log('Auth error:', authError);
    } else {
      console.log('Auth successful, user:', authData.user?.id);
      
      // Test 3: Try to access patients table with auth
      const { data: data2, error: error2 } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', authData.user?.id);
      
      console.log('Result with auth:', { data: data2, error: error2 });
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testPatientsTable();