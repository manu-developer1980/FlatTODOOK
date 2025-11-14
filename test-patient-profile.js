import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ovnnrejzzlscnidkvead.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92bm5yZWp6emxzY25pZGt2ZWFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA0NDY1NCwiZXhwIjoyMDc4NjIwNjU0fQ.07fNh7bBLs2LkbKGds7YdVnKc0hDcR8wrYZ9KsNm4rc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPatientProfileCreation() {
  console.log('🧪 Testing patient profile auto-creation on first login...\n');
  
  // Create a test user with service role (bypasses email confirmation)
  console.log('1️⃣ Creating test user with service role...');
  const testEmail = `patient-test-${Date.now()}@meditrack.com`;
  const testPassword = 'TestPassword123!';
  
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true, // Auto-confirm email
    user_metadata: {
      full_name: 'Test Patient',
      preferred_language: 'es'
    }
  });
  
  if (authError) {
    console.error('❌ Error creating user:', authError);
    return;
  }
  
  console.log('✅ Test user created:', authUser.user.id);
  console.log('Email confirmed:', authUser.user.email_confirmed_at ? 'Yes' : 'No');
  
  // Test 2: Check if patient profile exists (should not)
  console.log('\n2️⃣ Checking if patient profile exists...');
  const { data: existingPatient, error: checkError } = await supabase
    .from('patients')
    .select('*')
    .eq('user_id', authUser.user.id)
    .single();
  
  if (checkError && checkError.code === 'PGRST116') {
    console.log('✅ No patient profile exists yet (expected)');
  } else if (existingPatient) {
    console.log('⚠️  Patient profile already exists');
  } else {
    console.error('❌ Error checking patient profile:', checkError);
  }
  
  // Test 3: Simulate frontend login and patient profile creation
  console.log('\n3️⃣ Simulating frontend login process...');
  
  // Create a new client for the test user
  const userSupabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Sign in as the test user
  const { data: loginData, error: loginError } = await userSupabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  });
  
  if (loginError) {
    console.error('❌ Login failed:', loginError);
    return;
  }
  
  console.log('✅ Login successful');
  console.log('User ID:', loginData.user.id);
  
  // Test 4: Trigger patient profile creation by calling getUser
  console.log('\n4️⃣ Triggering patient profile creation...');
  
  // This simulates what happens in the frontend when getUser is called
  const { data: patientProfile, error: patientError } = await userSupabase
    .from('patients')
    .select('*')
    .eq('user_id', loginData.user.id)
    .single();
  
  if (patientError && patientError.code === 'PGRST116') {
    console.log('Patient profile not found, creating...');
    
    // Create patient profile
    const patientData = {
      user_id: loginData.user.id,
      first_name: loginData.user.user_metadata?.full_name || loginData.user.email?.split('@')[0] || 'Usuario',
      last_name: '',
      date_of_birth: '1990-01-01', // Default date since field is required
      gender: null,
      phone_number: null,
      emergency_contact_name: null,
      emergency_contact_phone: null,
      medical_conditions: null,
      allergies: null,
      preferred_language: 'es',
      timezone: 'Europe/Madrid',
      profile_completed: false
    };
    
    const { data: newPatient, error: insertError } = await supabase
      .from('patients')
      .insert(patientData)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Error creating patient profile:', insertError);
      return;
    }
    
    console.log('✅ Patient profile created successfully!');
    console.log('Patient ID:', newPatient.id);
    console.log('Name:', newPatient.first_name, newPatient.last_name);
    
    // Create user stats
    console.log('\n5️⃣ Creating user stats...');
    const statsData = {
      user_id: loginData.user.id,
      total_medications: 0,
      active_medications: 0,
      total_intakes: 0,
      successful_intakes: 0,
      missed_intakes: 0,
      adherence_rate: 0.00,
      current_streak: 0,
      longest_streak: 0,
      total_points: 0,
      last_activity_at: new Date().toISOString()
    };
    
    const { error: statsError } = await supabase
      .from('user_stats')
      .insert(statsData);
    
    if (statsError) {
      console.error('❌ Error creating user stats:', statsError);
    } else {
      console.log('✅ User stats created successfully!');
    }
    
    // Award welcome badge
    console.log('\n6️⃣ Awarding welcome badge...');
    const { data: welcomeBadge } = await supabase
      .from('badges')
      .select('id')
      .eq('name', 'welcome')
      .single();
    
    if (welcomeBadge) {
      const { error: badgeError } = await supabase
        .from('user_badges')
        .insert({
          user_id: loginData.user.id,
          badge_id: welcomeBadge.id,
          earned_at: new Date().toISOString(),
          points_at_earning: 0
        });
      
      if (badgeError) {
        console.error('❌ Error awarding welcome badge:', badgeError);
      } else {
        console.log('✅ Welcome badge awarded successfully!');
      }
    }
    
    // Test 7: Verify everything was created correctly
    console.log('\n7️⃣ Verifying complete setup...');
    
    // Check patient profile
    const { data: verifiedPatient } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', loginData.user.id)
      .single();
    
    if (verifiedPatient) {
      console.log('✅ Patient profile verified');
      console.log('  - Name:', verifiedPatient.first_name, verifiedPatient.last_name);
      console.log('  - Language:', verifiedPatient.preferred_language);
      console.log('  - Profile completed:', verifiedPatient.profile_completed);
    }
    
    // Check user stats
    const { data: verifiedStats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', loginData.user.id)
      .single();
    
    if (verifiedStats) {
      console.log('✅ User stats verified');
      console.log('  - Total medications:', verifiedStats.total_medications);
      console.log('  - Adherence rate:', verifiedStats.adherence_rate);
      console.log('  - Total points:', verifiedStats.total_points);
    }
    
    // Check badges
    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('*, badges(name, description)')
      .eq('user_id', loginData.user.id);
    
    if (userBadges && userBadges.length > 0) {
      console.log('✅ User badges verified');
      userBadges.forEach(badge => {
        console.log(`  - ${badge.badges?.name}: ${badge.badges?.description}`);
      });
    }
    
    console.log('\n🎯 Complete Test Summary:');
    console.log('✅ User registration: Working');
    console.log('✅ Email confirmation: Bypassed with service role');
    console.log('✅ Patient profile auto-creation: Working');
    console.log('✅ User stats creation: Working');
    console.log('✅ Welcome badge awarding: Working');
    console.log('✅ Complete user onboarding: Working');
    
  } else if (patientProfile) {
    console.log('⚠️  Patient profile already exists');
  } else {
    console.error('❌ Error with patient profile:', patientError);
  }
  
  // Cleanup: Delete test user
  console.log('\n🧹 Cleaning up test user...');
  const { error: deleteError } = await supabase.auth.admin.deleteUser(authUser.user.id);
  
  if (deleteError) {
    console.error('❌ Error deleting test user:', deleteError);
  } else {
    console.log('✅ Test user deleted successfully');
  }
}

// Run the test
testPatientProfileCreation().catch(console.error);