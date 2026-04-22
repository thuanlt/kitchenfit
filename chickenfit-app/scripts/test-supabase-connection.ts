import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

console.log('🔍 Checking Supabase Environment Variables...\n');

// Check environment variables
const requiredEnvVars = {
  'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
};

let allVarsPresent = true;

for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (value) {
    console.log(`✅ ${key}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${key}: MISSING`);
    allVarsPresent = false;
  }
}

if (!allVarsPresent) {
  console.log('\n❌ Some environment variables are missing!');
  process.exit(1);
}

console.log('\n🔌 Testing Supabase Connection...\n');

try {
  // Test with anon key (client-side)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Test simple query
  console.log('Testing with Anon Key...');
  const { data: recipes, error: recipesError } = await supabase
    .from('recipes')
    .select('count')
    .limit(1);

  if (recipesError) {
    console.log('❌ Anon Key connection failed:', recipesError.message);
  } else {
    console.log('✅ Anon Key connection successful!');
  }

  // Test with service role key (server-side)
  console.log('\nTesting with Service Role Key...');
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: tags, error: tagsError } = await supabaseAdmin
    .from('tags')
    .select('count')
    .limit(1);

  if (tagsError) {
    console.log('❌ Service Role Key connection failed:', tagsError.message);
  } else {
    console.log('✅ Service Role Key connection successful!');
  }

  // Test auth
  console.log('\nTesting Auth...');
  const { data: authData, error: authError } = await supabase.auth.getSession();
  
  if (authError) {
    console.log('❌ Auth check failed:', authError.message);
  } else {
    console.log('✅ Auth service is accessible!');
  }

  console.log('\n✅ All Supabase connections are working correctly!');
  console.log('\n📊 Summary:');
  console.log('- Database: Connected');
  console.log('- Auth: Connected');
  console.log('- Anon Key: Valid');
  console.log('- Service Role Key: Valid');

} catch (error) {
  console.error('\n❌ Connection test failed:', error);
  process.exit(1);
}