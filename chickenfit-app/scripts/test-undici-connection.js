const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

console.log('🔍 Testing with Undici Dispatcher...\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Try using undici directly
try {
  const undici = require('undici');
  console.log('✅ Undici is available');
  
  // Create a dispatcher that bypasses proxy
  const dispatcher = new undici.Agent({
    connect: {
      // This will bypass any system proxy
      rejectUnauthorized: true,
    },
  });
  
  // Custom fetch using undici dispatcher
  const customFetch = async (url, options = {}) => {
    console.log(`Fetching: ${url}`);
    
    const fetchOptions = {
      ...options,
      dispatcher: dispatcher, // Use our custom dispatcher
    };
    
    try {
      const response = await fetch(url, fetchOptions);
      console.log('✅ Request successful!');
      return response;
    } catch (error) {
      console.log('❌ Request failed:', error.message);
      throw error;
    }
  };
  
  async function testConnection() {
    try {
      console.log('Creating Supabase client with undici dispatcher...');
      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          fetch: customFetch,
        },
      });
      
      console.log('\nTesting database connection...');
      const { data: recipes, error } = await supabase
        .from('recipes')
        .select('id, name_vi, emoji, calories')
        .limit(3);
      
      if (error) {
        console.log('❌ Database connection failed:', error.message);
      } else {
        console.log('✅ Database connection successful!');
        console.log(`Found ${recipes.length} recipes:`);
        recipes.forEach(r => {
          console.log(`  - ${r.emoji} ${r.name_vi} (${r.calories} kcal)`);
        });
      }
      
      console.log('\n✅ Test completed successfully!');
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    }
  }
  
  testConnection();
  
} catch (error) {
  console.log('❌ Undici not available:', error.message);
  console.log('Trying alternative approach...');
  
  // Fallback: try using https module directly
  const https = require('https');
  
  const testDirectHttps = () => {
    return new Promise((resolve, reject) => {
      const url = new URL(supabaseUrl);
      const options = {
        hostname: url.hostname,
        port: 443,
        path: '/rest/v1/recipes?limit=1',
        method: 'GET',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
        timeout: 10000,
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log('✅ Direct HTTPS request successful!');
          console.log('Status:', res.statusCode);
          try {
            const json = JSON.parse(data);
            console.log('Data:', JSON.stringify(json, null, 2));
            resolve(json);
          } catch (e) {
            console.log('Response:', data);
            resolve(data);
          }
        });
      });
      
      req.on('error', (error) => {
        console.log('❌ Direct HTTPS request failed:', error.message);
        reject(error);
      });
      
      req.on('timeout', () => {
        console.log('❌ Direct HTTPS request timeout');
        req.destroy();
        reject(new Error('Timeout'));
      });
      
      req.end();
    });
  };
  
  testDirectHttps()
    .then(() => console.log('\n✅ Direct HTTPS test completed!'))
    .catch(err => console.error('❌ Direct HTTPS test failed:', err.message));
}