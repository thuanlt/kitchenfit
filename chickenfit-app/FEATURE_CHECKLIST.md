# ✅ Checklist Thêm Tính Năng Mới — Fitness App
> Stack: React + Next.js + Supabase + Capacitor

---

## 🔍 1. Trước khi code (5 phút)

- [ ] Tính năng mới có đụng **Supabase table/view** nào đang dùng không?
- [ ] Có cần thêm **RLS policy** mới không? (Row Level Security)
- [ ] Tính năng có chạy khác nhau giữa **Web / PWA / Native (Capacitor)** không?
- [ ] Có dùng **Supabase Realtime** không? → Cẩn thận subscription leak

---

## 🏗️ 2. Khi code — Next.js

- [ ] Tính năng là **Server Component hay Client Component**? → Đừng nhầm lẫn
- [ ] Nếu thêm **API Route mới** → không đụng route cũ
- [ ] Có dùng **`useRouter` / `redirect()`** không? → Kiểm tra không ảnh hưởng navigation flow cũ
- [ ] **`loading.tsx` / `error.tsx`** đã cover tính năng mới chưa?
- [ ] Tính năng mới có ảnh hưởng **layout chung** (`layout.tsx`) không?

---

## 🗄️ 3. Khi đụng Supabase

- [ ] Chỉ **thêm cột mới** — không đổi tên/xóa cột cũ
- [ ] Cột mới phải có **default value** hoặc **nullable**
- [ ] **RLS policy** đã đúng chưa? (user chỉ đọc được data của mình)
- [ ] Nếu thêm **foreign key** → đã có index chưa?
- [ ] **Supabase Edge Function** mới có cần update CORS không?
- [ ] Kiểm tra **Supabase Dashboard → Logs** sau khi test

---

## 📱 4. Kiểm tra đa nền tảng (Capacitor)

- [ ] Tính năng dùng **Web API** không được support trên mobile không?
  - Camera, File System, Geolocation → phải dùng **Capacitor Plugin**
- [ ] UI có bị vỡ trên **màn hình nhỏ (mobile)** không?
- [ ] Có dùng **`window` / `document`** trực tiếp không? → Bọc trong `useEffect` hoặc check `typeof window`
- [ ] **Safe area** (notch, bottom bar) có bị che không?
- [ ] Nếu dùng **Capacitor Plugin mới** → đã `npx cap sync` chưa?

---

## 🔐 5. Auth & Security (Supabase Auth)

- [ ] Route/page mới có cần **protect bằng auth** không?
- [ ] Đã kiểm tra **`middleware.ts`** cover route mới chưa?
- [ ] Nếu có **admin-only feature** → RLS đã chặn đúng chưa?
- [ ] **Session handling** có bị ảnh hưởng không?

---

## ⚡ 6. Performance

- [ ] Component mới có gây **re-render không cần thiết** không? → Kiểm tra `useEffect` dependencies
- [ ] Fetch data ở **Server Component** được không? (thay vì client-side)
- [ ] Ảnh mới có dùng **`next/image`** không?
- [ ] Có query Supabase **trong loop** không? → Rất nguy hiểm

---

## 🧪 7. Test trước khi commit

- [ ] Test trên **browser** (web)
- [ ] Test trên **mobile browser** (PWA)
- [ ] Test trên **Capacitor simulator** nếu dùng native feature
- [ ] Mở **Supabase Dashboard** kiểm tra data có đúng không
- [ ] Không có **`console.error`** lạ
- [ ] Chạy `git diff` — không có sửa gì ngoài ý muốn

---

## 🚀 8. Trước khi deploy

- [ ] **Environment variable** mới đã thêm vào Vercel/server chưa?
- [ ] **Supabase migration** đã chạy trên production chưa?
- [ ] Build có pass không? → chạy `next build` locally
- [ ] Nếu có thay đổi native → đã build lại Capacitor chưa?

```bash
npx cap sync
npx cap build ios   # nếu có thay đổi native iOS
npx cap build android  # nếu có thay đổi native Android
```

---

## 💡 Những lỗi hay gặp nhất

| Lỗi | Nguyên nhân | Cách tránh |
|---|---|---|
| Hydration error | Dùng `window` trong Server Component | Check `typeof window` hoặc dùng `useEffect` |
| RLS block data | Quên thêm policy cho table mới | Luôn test với user thường, không dùng service key |
| Capacitor không nhận thay đổi | Quên `cap sync` | Thêm vào checklist deploy |
| Supabase subscription leak | Quên unsubscribe Realtime | Cleanup trong `useEffect` return |
| Query N+1 | Fetch trong loop | Dùng `.in()` hoặc join thay thế |

---

## 📏 Rule of thumb

> **"Thêm thì thoải mái — Sửa thì cẩn thận — Xóa thì sợ"**

| Hành động | Rủi ro | Lời khuyên |
|---|---|---|
| Thêm file/function mới | 🟢 Thấp | Cứ làm |
| Sửa function đang dùng | 🟡 Trung bình | Đọc hết nơi gọi trước |
| Đổi DB schema | 🟠 Cao | Migration cẩn thận |
| Xóa code/cột cũ | 🔴 Rất cao | Confirm không ai dùng nữa |
