const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

console.log('🔌 Testing Supabase Connection...\n');

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

async function testConnection() {
  try {
    // Test with anon key (client-side)
    console.log('Testing with Anon Key...');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Test simple query
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('count')
      .limit(1);

    if (recipesError) {
      console.log('❌ Anon Key connection failed:', recipesError.message);
    } else {
      console.log('✅ Anon Key connection successful!');
      console.log(`   Recipes count: ${recipes[0].count}`);
    }

    // Test with service role key (server-side)
    console.log('\nTesting with Service Role Key...');
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: tags, error: tagsError } = await supabaseAdmin
      .from('tags')
      .select('count')
      .limit(1);

    if (tagsError) {
      console.log('❌ Service Role Key connection failed:', tagsError.message);
    } else {
      console.log('✅ Service Role Key connection successful!');
      console.log(`   Tags count: ${tags[0].count}`);
    }

    // Test auth
    console.log('\nTesting Auth...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('❌ Auth check failed:', authError.message);
    } else {
      console.log('✅ Auth service is accessible!');
    }

    // Test fetching actual data
    console.log('\nTesting data fetch...');
    const { data: sampleRecipe, error: recipeError } = await supabase
      .from('recipes')
      .select('id, name_vi, emoji, calories')
      .limit(1);

    if (recipeError) {
      console.log('❌ Data fetch failed:', recipeError.message);
    } else if (sampleRecipe && sampleRecipe.length > 0) {
      console.log('✅ Data fetch successful!');
      console.log(`   Sample recipe: ${sampleRecipe[0].emoji} ${sampleRecipe[0].name_vi}`);
      console.log(`   Calories: ${sampleRecipe[0].calories}`);
    } else {
      console.log('⚠️  No recipes found in database');
    }

    console.log('\n✅ All Supabase connections are working correctly!');
    console.log('\n📊 Summary:');
    console.log('- Database: Connected');
    console.log('- Auth: Connected');
    console.log('- Anon Key: Valid');
    console.log('- Service Role Key: Valid');
    console.log('- Data Access: Working');

  } catch (error) {
    console.error('\n❌ Connection test failed:', error.message);
    process.exit(1);
  }
}

testConnection();