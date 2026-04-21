#!/usr/bin/env node

console.log('🔍 Checking Environment Variables...\n');

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

let allSet = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const maskedValue = varName.includes('KEY') 
      ? value.substring(0, 20) + '...' 
      : value;
    console.log(`✅ ${varName}: ${maskedValue}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    allSet = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allSet) {
  console.log('✅ All required environment variables are set!');
  process.exit(0);
} else {
  console.log('❌ Some environment variables are missing!');
  console.log('\nPlease set them in:');
  console.log('  - .env file (local development)');
  console.log('  - Vercel Dashboard (deployment)');
  process.exit(1);
}