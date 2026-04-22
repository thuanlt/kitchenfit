const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('🔍 Checking .env.local file...\n');

const envPath = path.resolve(__dirname, '../.env.local');

// Check if file exists
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file does not exist!');
  console.log('\nPlease create .env.local with the following variables:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

console.log('✅ .env.local file exists\n');

// Load environment variables
dotenv.config({ path: envPath });

// Check required variables
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

console.log('Checking required environment variables:\n');

let allPresent = true;
for (const varName of requiredVars) {
  const value = process.env[varName];
  if (value) {
    // Show only first 20 chars for security
    const maskedValue = value.length > 20 
      ? `${value.substring(0, 20)}...` 
      : value;
    console.log(`✅ ${varName}: ${maskedValue}`);
    
    // Validate format
    if (varName.includes('URL') && !value.startsWith('https://')) {
      console.log(`   ⚠️  Warning: URL should start with https://`);
    }
    if (varName.includes('KEY') && value.length < 20) {
      console.log(`   ⚠️  Warning: Key seems too short`);
    }
  } else {
    console.log(`❌ ${varName}: MISSING`);
    allPresent = false;
  }
}

if (!allPresent) {
  console.log('\n❌ Some required environment variables are missing!');
  console.log('Please add them to .env.local file.');
  process.exit(1);
}

console.log('\n✅ All required environment variables are present!');

// Check for optional variables
console.log('\nChecking optional environment variables:\n');

const optionalVars = [
  'NEXT_PUBLIC_APP_URL',
  'DATABASE_URL'
];

for (const varName of optionalVars) {
  const value = process.env[varName];
  if (value) {
    const maskedValue = value.length > 20 
      ? `${value.substring(0, 20)}...` 
      : value;
    console.log(`✅ ${varName}: ${maskedValue}`);
  } else {
    console.log(`⚪ ${varName}: Not set (optional)`);
  }
}

console.log('\n✅ Environment check completed successfully!');