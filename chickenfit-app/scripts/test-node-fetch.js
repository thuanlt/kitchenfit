const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

console.log('🔍 Testing Node.js fetch API...\n');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('URL:', url);
console.log('API Key:', apiKey ? apiKey.substring(0, 20) + '...' : 'NOT SET');
console.log('');

// Test 1: Native fetch (Node.js 18+)
console.log('Test 1: Native fetch API...');
if (typeof fetch !== 'undefined') {
  console.log('✅ Native fetch is available');
  
  const testUrl = `${url}/rest/v1/recipes?limit=1`;
  console.log('Fetching:', testUrl);
  
  fetch(testUrl, {
    method: 'GET',
    headers: {
      'apikey': apiKey,
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('✅ Native fetch SUCCESS!');
    console.log('Status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('Data:', JSON.stringify(data, null, 2));
  })
  .catch(error => {
    console.log('❌ Native fetch FAILED:', error.message);
  });
} else {
  console.log('❌ Native fetch is NOT available');
  console.log('Node version:', process.version);
}

console.log('');

// Test 2: Check Node.js version and environment
console.log('Test 2: Node.js Environment...');
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('Arch:', process.arch);
console.log('');

// Test 3: Check for proxy settings
console.log('Test 3: Proxy Settings...');
console.log('HTTP_PROXY:', process.env.HTTP_PROXY || 'NOT SET');
console.log('HTTPS_PROXY:', process.env.HTTPS_PROXY || 'NOT SET');
console.log('NO_PROXY:', process.env.NO_PROXY || 'NOT SET');
console.log('');

// Test 4: Check if we can reach the URL with a simple HTTP request
console.log('Test 4: Simple HTTP connectivity...');
const https = require('https');

const testUrl = new URL(url);
const options = {
  hostname: testUrl.hostname,
  port: 443,
  path: '/',
  method: 'HEAD',
  timeout: 10000
};

const req = https.request(options, (res) => {
  console.log('✅ HTTPS request SUCCESS!');
  console.log('Status:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
});

req.on('error', (error) => {
  console.log('❌ HTTPS request FAILED:', error.message);
});

req.on('timeout', () => {
  console.log('❌ HTTPS request TIMEOUT');
  req.destroy();
});

req.end();

console.log('');
console.log('=== Tests completed ===');