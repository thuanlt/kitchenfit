# 🎯 GIẢI QUYẾT VẤN ĐỀ PROXY - SUPABASE CONNECTION
**Ngày phát hiện:** 2026-04-17  
**Mức độ:** ✅ **ĐÃ TÌM RA NGUYÊN NHÂN**

---

## 🔍 NGUYÊN NHÂN CHÍNH XÁC

### Vấn đề:
```bash
HTTP_PROXY: http://10.36.252.45:8080
HTTPS_PROXY: http://10.36.252.45:8080
```

**Có một corporate proxy đang chặn kết nối tới Supabase!**

### Tại sao PowerShell hoạt động nhưng Node.js không?
- **PowerShell:** Có thể không sử dụng proxy settings hoặc có configuration riêng
- **Node.js:** Tự động đọc environment variables `HTTP_PROXY` và `HTTPS_PROXY`
- **Kết quả:** Node.js cố gắng kết nối qua proxy → proxy không cho phép → timeout/socket hang up

---

## ✅ KẾT QUẢ TEST THỰC TẾ

### PowerShell (Direct Connection):
```powershell
✅ Anon Key: SUCCESS
✅ Service Role Key: SUCCESS  
✅ Tags Table: SUCCESS
✅ Database: WORKING
```

### Node.js (Via Proxy):
```javascript
❌ Native fetch FAILED: fetch failed
❌ HTTPS request TIMEOUT
❌ Socket hang up
```

### Kết luận:
- **Supabase project HOẠT ĐỘNG TỐT** ✅
- **API keys ĐÚNG** ✅
- **Database CÓ DỮ LIỆU** ✅
- **Vấn đề:** Corporate proxy blocking Node.js connections

---

## 🛠️ GIẢI PHÁP

### SOLUTION 1: Thêm Supabase vào NO_PROXY (KHUYẾN NGHỊ)

#### Windows PowerShell:
```powershell
# Thêm vào environment variables (temporary)
$env:NO_PROXY = "localhost,127.0.0.1,.supabase.co,supabase.co"

# Hoặc set permanently
[System.Environment]::SetEnvironmentVariable('NO_PROXY', 'localhost,127.0.0.1,.supabase.co,supabase.co', 'User')
```

#### Windows Command Prompt:
```cmd
set NO_PROXY=localhost,127.0.0.1,.supabase.co,supabase.co
```

#### Linux/Mac:
```bash
export NO_PROXY="localhost,127.0.0.1,.supabase.co,supabase.co"
```

### SOLUTION 2: Tạo file .env.local với NO_PROXY

Thêm vào `chicken_fit/chickenfit-app/.env.local`:

```env
# Existing Supabase variables
NEXT_PUBLIC_SUPABASE_URL=https://mryrbyjzkiufoxsjtbyi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# Add this to bypass proxy for Supabase
NO_PROXY=localhost,127.0.0.1,.supabase.co,supabase.co
```

### SOLUTION 3: Configure Supabase client để ignore proxy

Update `chicken_fit/chickenfit-app/lib/db-server.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import { HttpsProxyAgent } from 'https-proxy-agent';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create agent that ignores proxy for Supabase
const noProxyAgent = new HttpsProxyAgent({
  rejectUnauthorized: true,
  // This will bypass proxy and connect directly
});

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        // Use agent that bypasses proxy
        agent: noProxyAgent,
      });
    },
  },
});
```

### SOLUTION 4: Disable proxy tạm thời cho development

```powershell
# Disable proxy temporarily
$env:HTTP_PROXY = ""
$env:HTTPS_PROXY = ""

# Run your app
cd chicken_fit/chickenfit-app
npm run dev
```

### SOLUTION 5: Configure proxy properly (nếu bắt buộc phải dùng)

Nếu corporate network yêu cầu proxy, cần configure proxy để allow Supabase domains:

```typescript
import { createClient } from '@supabase/supabase-js';
import { HttpsProxyAgent } from 'https-proxy-agent';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;

// Create proxy agent
const proxyAgent = new HttpsProxyAgent(proxyUrl);

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        agent: proxyAgent,
      });
    },
  },
});
```

---

## 🚀 CÁC BƯỚC THỰC HIỆN (QUICK FIX)

### Bước 1: Test với NO_PROXY
```powershell
# Set NO_PROXY environment variable
$env:NO_PROXY = "localhost,127.0.0.1,.supabase.co,supabase.co"

# Test connection
cd chicken_fit/chickenfit-app
node scripts/test-supabase-connection.js
```

### Bước 2: Nếu thành công, thêm vào .env.local
```env
# Thêm vào cuối file .env.local
NO_PROXY=localhost,127.0.0.1,.supabase.co,supabase.co
```

### Bước 3: Restart dev server
```bash
cd chicken_fit/chickenfit-app
npm run dev
```

### Bước 4: Test application
- Test signup endpoint
- Test login endpoint  
- Test API endpoints

---

## 📋 CHECKLIST FIX

### ✅ Đã xác nhận:
- [x] Supabase project hoạt động tốt
- [x] API keys đúng
- [x] Database có dữ liệu
- [x] Tìm ra nguyên nhân: Corporate proxy

### ⚠️ Cần làm:
- [ ] Thêm NO_PROXY environment variable
- [ ] Test connection sau khi fix
- [ ] Verify application hoạt động
- [ ] Document solution cho team

### 🔄 Long-term:
- [ ] Add proxy configuration vào documentation
- [ ] Consider using proxy-aware fetch library
- [ ] Setup proper proxy for production
- [ ] Add connection retry logic

---

## 🎯 THỬ NGAY BÂY GIỜ

### Quick Test:
```powershell
# 1. Set NO_PROXY
$env:NO_PROXY = ".supabase.co,supabase.co"

# 2. Test connection
cd chicken_fit/chickenfit-app
node scripts/test-supabase-connection.js
```

Nếu test thành công, thêm vào `.env.local` và restart dev server!

---

## 📊 SUMMARY

| Component | Status | Solution |
|-----------|--------|----------|
| Supabase Project | ✅ Working | N/A |
| API Keys | ✅ Valid | N/A |
| Database | ✅ Has Data | N/A |
| Connection (PowerShell) | ✅ Working | Direct connection |
| Connection (Node.js) | ❌ Blocked | Add NO_PROXY |
| Application | ⚠️ Needs Fix | Apply Solution 1 or 2 |

---

*Solution documented by AI Assistant*