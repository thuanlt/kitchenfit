import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Custom fetch with timeout and proxy bypass
const customFetch = async (url: RequestInfo | URL, options?: RequestInit) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
  
  try {
    // Create a new URL object to extract hostname
    const urlString = typeof url === 'string' ? url : url.toString();
    const urlObj = new URL(urlString);
    
    // Check if this is a Supabase request
    const isSupabaseRequest = urlObj.hostname.includes('.supabase.co') || 
                             urlObj.hostname.includes('supabase.co');
    
    // Prepare fetch options
    const fetchOptions: RequestInit = {
      ...options,
      signal: controller.signal,
    };
    
    // For Supabase requests, try to bypass proxy
    if (isSupabaseRequest) {
      // Remove proxy headers if they exist
      if (fetchOptions.headers) {
        const headers = fetchOptions.headers as Record<string, string>;
        delete headers['proxy-authorization'];
      }
      
      // In Node.js, we can try to use the undici dispatcher with proxy disabled
      // This is a workaround for the proxy issue
      if (typeof process !== 'undefined' && process.versions?.node) {
        // Temporarily disable proxy for this request
        const originalHttpProxy = process.env.HTTP_PROXY;
        const originalHttpsProxy = process.env.HTTPS_PROXY;
        const originalNoProxy = process.env.NO_PROXY;
        
        try {
          // Disable proxy for this request
          delete process.env.HTTP_PROXY;
          delete process.env.HTTPS_PROXY;
          process.env.NO_PROXY = '*';
          
          const response = await fetch(url, fetchOptions);
          clearTimeout(timeoutId);
          return response;
        } finally {
          // Restore original proxy settings
          if (originalHttpProxy) process.env.HTTP_PROXY = originalHttpProxy;
          if (originalHttpsProxy) process.env.HTTPS_PROXY = originalHttpsProxy;
          if (originalNoProxy) process.env.NO_PROXY = originalNoProxy;
          else delete process.env.NO_PROXY;
        }
      }
    }
    
    // Default fetch for non-Supabase requests
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);
    return response;
    
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Server-only admin client — never expose to browser
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    fetch: customFetch,
  },
});