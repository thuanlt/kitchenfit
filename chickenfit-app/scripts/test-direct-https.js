const https = require('https');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

console.log('🔍 Testing Direct HTTPS Connection...\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('URL:', supabaseUrl);
console.log('Key:', serviceRoleKey ? serviceRoleKey.substring(0, 20) + '...' : 'NOT SET');
console.log('');

const testDirectHttps = () => {
  return new Promise((resolve, reject) => {
    const url = new URL(supabaseUrl);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: '/rest/v1/recipes?limit=3',
      method: 'GET',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    };
    
    console.log('Making direct HTTPS request...');
    console.log('Hostname:', options.hostname);
    console.log('Path:', options.path);
    console.log('');
    
    const req = https.request(options, (res) => {
      console.log('✅ HTTPS connection established!');
      console.log('Status:', res.statusCode);
      console.log('Headers:', JSON.stringify(res.headers, null, 2));
      console.log('');
      
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log('✅ Response received successfully!');
          console.log('Data:', JSON.stringify(json, null, 2));
          resolve(json);
        } catch (e) {
          console.log('Response (raw):', data);
          resolve(data);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ HTTPS request failed:', error.message);
      console.log('Error code:', error.code);
      console.log('Error stack:', error.stack);
      reject(error);
    });
    
    req.on('timeout', () => {
      console.log('❌ HTTPS request timeout');
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    req.end();
  });
};

testDirectHttps()
  .then(() => {
    console.log('\n✅ Direct HTTPS test completed successfully!');
    console.log('\n🎯 CONCLUSION: Direct HTTPS works, but fetch API fails!');
    console.log('This suggests a Node.js fetch implementation issue with proxy.');
  })
  .catch(err => {
    console.error('\n❌ Direct HTTPS test failed:', err.message);
    console.error('Error code:', err.code);
  });