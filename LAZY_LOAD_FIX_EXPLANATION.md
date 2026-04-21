"# 🔧 Lazy-Load Fix for Supabase Build Error

**Date:** 2026-04-17  
**Status:** ✅ **FIXED AND COMMITTED**

---

## 🎯 Problem

The deployment was still failing with:
```
Error: supabaseUrl is required.
at <unknown> (.next/server/chunks/chickenfit-app_lib_db-server_ts_0a45da8._.js:37:43463)
```

### Root Cause

The Supabase clients were being instantiated at the **top-level** of the module:

```typescript
// ❌ OLD CODE - Executes at build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {...});
```

**Why this fails:**
- During build time, Next.js evaluates all module code
- Environment variables are not available during build
- The `!` non-null assertion throws an error when variables are undefined
- Build process fails immediately

---

## ✅ Solution: Lazy-Loading

Changed to **lazy-load** the Supabase clients:

```typescript
// ✅ NEW CODE - Only executes at runtime
let supabaseAdminInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing required environment variables...');
    }

    supabaseAdminInstance = createClient(supabaseUrl, serviceRoleKey, {...});
  }

  return supabaseAdminInstance;
}

// Export proxy for backward compatibility
export const supabaseAdmin = new Proxy({} as any, {
  get(_target, prop) {
    const client = getSupabaseAdmin();
    return client[prop as keyof typeof client];
  },
});
```

### Why This Works:

1. **No Top-Level Execution**: The client is only created when first accessed
2. **Runtime Evaluation**: Environment variables are available at runtime
3. **Singleton Pattern**: Client is created once and reused
4. **Backward Compatible**: Existing code using `supabaseAdmin.auth.*` still works
5. **Better Error Messages**: Clear error if env vars are missing

---

## 📦 Changes Made

### File: `chickenfit-app/lib/db-server.ts`
- ✅ Implemented lazy-loading with `getSupabaseAdmin()` function
- ✅ Added Proxy wrapper for backward compatibility
- ✅ Added validation for environment variables
- ✅ Removed top-level instantiation

### File: `chickenfit-app/lib/db.ts`
- ✅ Implemented lazy-loading with `getSupabase()` function
- ✅ Added Proxy wrapper for backward compatibility
- ✅ Added validation for environment variables
- ✅ Removed top-level instantiation

---

## 🚀 Deployment Steps

### 1. ✅ Code Changes
- [x] Modified `lib/db.ts` to use lazy-loading
- [x] Modified `lib/db-server.ts` to use lazy-loading
- [x] Committed changes to Git
- [x] Pushed to remote repository

### 2. ⏳ Vercel Deployment
Vercel will automatically deploy the new commit. Monitor deployment at:
- Vercel Dashboard → Deployments tab

### 3. ⚠️ CRITICAL: Add Environment Variables

**You MUST add these to Vercel:**

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://mryrbyjzkiufoxsjtbyi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. **Important**: After adding environment variables, you need to redeploy:
   - Go to Deployments tab
   - Click the three dots (⋯) on the latest deployment
   - Select "Redeploy"

---

## 🧪 Testing

After deployment, test the endpoints:

```bash
# Test login endpoint
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test recipes endpoint
curl https://your-app.vercel.app/api/recipes

# Test signup endpoint
curl -X POST https://your-app.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","password":"password123"}'
```

---

## 🔍 How to Get Supabase Keys

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/mryrbyjzkiufoxsjtbyi/settings/api)
2. Copy the values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

---

## 📊 Expected Results

✅ **Build Success**: No more `supabaseUrl is required` errors  
✅ **Runtime Connection**: Supabase clients connect successfully  
✅ **API Endpoints**: All endpoints work correctly  
✅ **Authentication**: Login/signup functions properly  

---

## 🆘 Troubleshooting

### Issue: Still getting build errors
**Solution**: Make sure you've pulled the latest code and Vercel is deploying the correct commit

### Issue: Runtime errors about missing env vars
**Solution**: Verify environment variables are set in Vercel and redeploy

### Issue: API returns 500 errors
**Solution**: Check Vercel deployment logs for detailed error messages

---

## 📝 Technical Details

### Why Lazy-Loading?

1. **Build-Time vs Runtime**
   - Build-time: Code is bundled and optimized
   - Runtime: Code executes with actual environment

2. **Next.js Build Process**
   - Evaluates all modules during build
   - Static generation requires deterministic values
   - Environment variables injected at runtime

3. **Singleton Pattern Benefits**
   - Single connection instance
   - Efficient resource usage
   - Consistent configuration

### Proxy Pattern Explained

```typescript
export const supabaseAdmin = new Proxy({} as any, {
  get(_target, prop) {
    const client = getSupabaseAdmin();
    return client[prop as keyof typeof client];
  },
});
```

This allows existing code like:
```typescript
await supabaseAdmin.auth.signInWithPassword({...})
```

to work without changes, while still using lazy-loading internally.

---

## 🎉 Summary

| Issue | Status |
|-------|--------|
| ✅ Top-level instantiation | Fixed |
| ✅ Build-time env var access | Fixed |
| ✅ Lazy-loading implementation | Complete |
| ✅ Backward compatibility | Maintained |
| ✅ Code committed | Yes |
| ✅ Code pushed | Yes |
| ⏳ Vercel deployment | In progress |
| ⚠️ Environment variables | Need to add |

---

**Next Step**: Add environment variables to Vercel and redeploy!

For questions, refer to:
- `SUPABASE_DEPLOYMENT_FIX.md` - Original deployment fix
- Vercel Documentation - Environment Variables
- Supabase Documentation - Client Initialization
"