const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

console.log('🔍 Testing Fixed Supabase Connection...\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Custom fetch with timeout and proxy bypass
const customFetch = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  try {
    const urlString = typeof url === 'string' ? url : url.toString();
    const urlObj = new URL(urlString);
    
    // Check if this is a Supabase request
    const isSupabaseRequest = urlObj.hostname.includes('.supabase.co') || 
                             urlObj.hostname.includes('supabase.co');
    
    console.log(`Fetching: ${urlString}`);
    console.log(`Is Supabase request: ${isSupabaseRequest}`);
    console.log(`Current HTTP_PROXY: ${process.env.HTTP_PROXY || 'NOT SET'}`);
    console.log(`Current HTTPS_PROXY: ${process.env.HTTPS_PROXY || 'NOT SET'}`);
    
    const fetchOptions = {
      ...options,
      signal: controller.signal,
    };
    
    // For Supabase requests, try to bypass proxy
    if (isSupabaseRequest) {
      console.log('Attempting to bypass proxy for Supabase request...');
      
      if (typeof process !== 'undefined' && process.versions?.node) {
        const originalHttpProxy = process.env.HTTP_PROXY;
        const originalHttpsProxy = process.env.HTTPS_PROXY;
        const originalNoProxy = process.env.NO_PROXY;
        
        try {
          // Disable proxy for this request
          delete process.env.HTTP_PROXY;
          delete process.env.HTTPS_PROXY;
          process.env.NO_PROXY = '*';
          
          console.log('Proxy temporarily disabled for this request');
          
          const response = await fetch(url, fetchOptions);
          clearTimeout(timeoutId);
          console.log('Response received!');
          return response;
        } finally {
          // Restore original proxy settings
          if (originalHttpProxy) process.env.HTTP_PROXY = originalHttpProxy;
          if (originalHttpsProxy) process.env.HTTPS_PROXY = originalHttpsProxy;
          if (originalNoProxy) process.env.NO_PROXY = originalNoProxy;
          else delete process.env.NO_PROXY;
          
          console.log('Proxy settings restored');
        }
      }
    }
    
    // Default fetch
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);
    return response;
    
  } catch (error) {
    clearTimeout(timeoutId);
    console.log('Fetch error:', error.message);
    throw error;
  }
};

async function testConnection() {
  try {
    console.log('Creating Supabase client with custom fetch...');
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