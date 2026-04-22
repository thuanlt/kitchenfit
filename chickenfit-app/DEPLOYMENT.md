# 🚀 ChickenFit Deployment Guide

## Prerequisites

Before deploying, make sure you have:

1. ✅ VAPID Keys generated (already done!)
2. ✅ Supabase project set up
3. ✅ GitHub repository
4. ✅ Vercel account (free tier is fine)

---

## Step 1: Setup Environment Variables

### Create `.env.local` file in the project root:

```bash
# Supabase Configuration
# Get these from: https://supabase.com/dashboard/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# VAPID Keys for Web Push Notifications
# Already generated! Copy these:
NEXT_PUBLIC_VAPID_PUBLIC_KEY=MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEW-mygO9GFu2qNPTB2vaPtDAKPgpw5ZeH398KaagiqNq9J8U4-o7ft8P0LtH1A7U9f_gCLkD_2aH3HZnVkBX3hg
VAPID_PRIVATE_KEY=MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgivR_gcZVFIXtwHpePBQmHhpALYnBbg7uAQV7nfIhVLGhRANCAARb6bKA70YW7ao09MHa9o-0MAo-CnDll4ff3wppqCKo2r0nxTj6jt-3w_Qu0fUDtT1_-AIuQP_ZofcdmdWQFfeG

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### How to get Supabase credentials:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Option B: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `NEXT_PUBLIC_APP_URL`
5. Click **"Deploy"**

---

## Step 3: Configure VAPID Keys in Supabase

After deployment, add VAPID keys to Supabase for push notifications:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **Providers** → **Email**
4. Scroll down to **"Web Push Notifications"**
5. Add the VAPID keys:
   ```
   Public Key: MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEW-mygO9GFu2qNPTB2vaPtDAKPgpw5ZeH398KaagiqNq9J8U4-o7ft8P0LtH1A7U9f_gCLkD_2aH3HZnVkBX3hg
   Private Key: MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgivR_gcZVFIXtwHpePBQmHhpALYnBbg7uAQV7nfIhVLGhRANCAARb6bKA70YW7ao09MHa9o-0MAo-CnDll4ff3wppqCKo2r0nxTj6jt-3w_Qu0fUDtT1_-AIuQP_ZofcdmdWQFfeG
   Subject: mailto:your-email@example.com
   ```
6. Click **"Save"**

---

## Step 4: Verify Deployment

### Check the following:

1. ✅ Visit your deployed URL
2. ✅ Test login/signup pages:
   - `/login`
   - `/signup`
   - `/forgot-password`
3. ✅ Test authentication flow
4. ✅ Check PWA installation (mobile)
5. ✅ Test push notifications (if enabled)

### Run Lighthouse Audit:

```bash
# Install Lighthouse
npm install -g lighthouse

# Run audit
lighthouse https://your-domain.vercel.app --view
```

Target scores:
- Performance: > 90
- PWA: > 90
- Accessibility: > 90
- Best Practices: > 90

---

## Step 5: Post-Deployment Tasks

### 1. Update Supabase CORS Settings

Go to Supabase Dashboard → **Settings** → **API** → **CORS**

Add your domain:
```
https://your-domain.vercel.app
```

### 2. Test Database Connection

```bash
# Run migrations (if needed)
npm run db:push
```

### 3. Monitor Logs

- Vercel Dashboard → **Logs**
- Supabase Dashboard → **Logs**

### 4. Set up Analytics (Optional)

- Vercel Analytics
- Google Analytics
- Supabase Analytics

---

## Troubleshooting

### Issue: Build fails

**Solution:**
- Check environment variables are set correctly
- Verify `package.json` scripts
- Check for missing dependencies

### Issue: Auth not working

**Solution:**
- Verify Supabase URL and keys
- Check Supabase Auth settings
- Ensure email provider is enabled

### Issue: PWA not installing

**Solution:**
- Check `manifest.json` is accessible
- Verify service worker is registered
- Run Lighthouse audit

### Issue: Push notifications not working

**Solution:**
- Verify VAPID keys in Supabase
- Check browser notification permissions
- Ensure HTTPS is enabled (automatic on Vercel)

---

## Continuous Deployment

### Automatic deployments on push:

1. Connect GitHub repository to Vercel
2. Enable **"Deploy on Push"** in project settings
3. Every push to `main` branch triggers deployment

### Preview deployments:

Every pull request gets a preview URL automatically.

---

## Custom Domain (Optional)

1. Go to Vercel Dashboard → **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` environment variable

---

## Security Checklist

- [ ] Environment variables are set
- [ ] Supabase RLS policies are enabled
- [ ] CORS is configured correctly
- [ ] HTTPS is enabled (automatic on Vercel)
- [ ] Rate limiting is configured (if needed)
- [ ] Error tracking is set up (optional)

---

## Performance Optimization

### Enable caching:

```javascript
// next.config.ts
const nextConfig = {
  // ... existing config
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};
```

### Enable compression:

Vercel automatically compresses assets.

---

## Support

- 📖 [Next.js Docs](https://nextjs.org/docs)
- 📖 [Vercel Docs](https://vercel.com/docs)
- 📖 [Supabase Docs](https://supabase.com/docs)
- 💬 [GitHub Issues](https://github.com/your-repo/issues)

---

**Last Updated:** 2026-04-20
**Version:** 1.0.0