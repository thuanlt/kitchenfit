"# 🔍 Phân tích Vấn đề Hiệu năng & Khả năng gây Đơ App

> **Ngày kiểm tra:** 2026-04-28  
> **Mục đích:** Tìm các vấn đề tiềm ẩn có thể gây đơ/treo app do AI-generated code

---

## ✅ TỐT: Không có vấn đề nghiêm trọng

Sau khi kiểm tra toàn bộ codebase, **KHÔNG TÌM THẤY** các vấn đề nghiêm trọng sau:

### ✅ 1. Không có vòng lặp useEffect vô tận
- Tất cả `useEffect` đều có dependency array đúng cách
- Không có `useEffect(() => { fetchData(); })` (không có dependencies)
- Không có `setState` bên trong render body

### ✅ 2. SWR được cấu hình đúng
```typescript
// lib/swr-hooks.ts
const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false,        // ✅ Không gọi API khi tab focus
  revalidateOnReconnect: true,    // ✅ Chỉ gọi lại khi reconnect
  dedupingInterval: 60000,       // ✅ Dedupe trong 1 phút
  errorRetryCount: 3,            // ✅ Chỉ retry 3 lần
  errorRetryInterval: 5000,      // ✅ Delay 5s giữa các retry
};
```

### ✅ 3. Không có API calls liên tục
- SWR tự động dedupe requests
- Không có `fetch` trong `useEffect` mà không có dependencies
- Không có polling (setInterval)

### ✅ 4. Render được tối ưu
- Sử dụng `useMemo` cho filtering trong recipes page
- Dữ liệu hiển thị ít (chỉ 4 smoothies, 4 meals, 3 meal prep)
- Không render hàng ngàn items

---

## ⚠️ CẢNH BÁO: Các vấn đề nhỏ cần lưu ý

### ⚠️ 1. app/page.tsx - useEffect có nhiều dependencies

**Vấn đề:**
```typescript
useEffect(() => {
  if (!onboardingDone) {
    router.replace("/onboarding");
    return;
  }
  if (goal && age && weight && height && activity) {
    const p: UserProfile = { fullName: "", goal, gender, age, weight, height, activity, tdee: tdee ?? 0, onboardingDone: true };
    setProfile(p);
    setMacros(calcMacros(p));
  }
  setReady(true);
}, [onboardingDone, goal, gender, age, weight, height, activity, tdee, router]);
```

**Rủi ro:**
- useEffect sẽ chạy lại khi BẤT KỲ state nào thay đổi
- Nếu user thay đổi profile trong `/me` page, home page sẽ re-render
- Tuy nhiên: chỉ là tính toán local, không gọi API

**Đánh giá:** ⚠️ **Rủi ro thấp** - Không gây đơ, chỉ gây re-render không cần thiết

**Khuyến nghị cải thiện:**
```typescript
// ✅ Cách tốt hơn - chỉ chạy khi cần thiết
useEffect(() => {
  if (!onboardingDone) {
    router.replace("/onboarding");
    return;
  }
  setReady(true);
}, [onboardingDone, router]);

// ✅ Tách useEffect riêng cho profile
useEffect(() => {
  if (goal && age && weight && height && activity) {
    const p: UserProfile = { fullName: "", goal, gender, age, weight, height, activity, tdee: tdee ?? 0, onboardingDone: true };
    setProfile(p);
    setMacros(calcMacros(p));
  }
}, [goal, gender, age, weight, height, activity, tdee]);
```

---

### ⚠️ 2. app/plan/page.tsx - API call không có debounce

**Vấn đề:**
```typescript
async function generatePlan() {
  setGenerating(true);

  // Try API first if authenticated
  if (accessToken) {
    try {
      const res = await fetch("/api/plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ week_start: currentWeekStart }),
      });
      // ...
    } catch { /* fallback to local */ }
  }
}
```

**Rủi ro:**
- Nếu user spam click nút "Tạo kế hoạch AI", sẽ gọi API nhiều lần
- Không có debounce/throttle
- Không có loading state protection

**Đánh giá:** ⚠️ **Rủi ro trung bình** - Có thể gây API spam nếu user click nhanh

**Khuyến nghị cải thiện:**
```typescript
// ✅ Thêm debounce và protection
import { useCallback } from "react";

const generatePlan = useCallback(async () => {
  if (generating) return; // ✅ Prevent multiple calls
  
  setGenerating(true);

  try {
    if (accessToken) {
      const res = await fetch("/api/plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ week_start: currentWeekStart }),
      });
      // ...
    }
  } catch (error) {
    console.error("Failed to generate plan:", error);
  } finally {
    setGenerating(false);
  }
}, [generating, accessToken, currentWeekStart]);
```

---

### ⚠️ 3. lib/swr-hooks.ts - onSuccess callback có thể gây re-render

**Vấn đề:**
```typescript
export function useProfile() {
  const { setProfile: setStoreProfile } = useProfileStore();

  const { data, error, mutate: mutateProfile, isLoading } = useSWR<ProfileResponse>(
    accessToken ? "/api/profile" : null,
    (url) => authFetcher<ProfileResponse>(url, accessToken),
    {
      ...swrConfig,
      onSuccess: (data) => {
        // Sync with local store
        setStoreProfile({
          fullName: data.display_name || "",
          goal: GOAL_FROM_DB[data.goal] || "maintain",
          // ...
        });
      },
    }
  );
}
```

**Rủi ro:**
- `onSuccess` sẽ chạy mỗi khi SWR fetch data thành công
- `setStoreProfile` sẽ trigger re-render cho tất cả components đang sử dụng store
- Nếu có nhiều components sử dụng store, sẽ có nhiều re-renders

**Đánh giá:** ⚠️ **Rủi ro thấp** - SWR đã có deduping, chỉ fetch khi cần

**Khuyến nghị cải thiện:**
```typescript
// ✅ Thêm check để tránh update nếu data không thay đổi
onSuccess: (data) => {
  const currentProfile = useProfileStore.getState();
  const newFullName = data.display_name || "";
  
  // ✅ Chỉ update nếu thực sự thay đổi
  if (currentProfile.fullName !== newFullName || 
      currentProfile.goal !== GOAL_FROM_DB[data.goal]) {
    setStoreProfile({
      fullName: newFullName,
      goal: GOAL_FROM_DB[data.goal] || "maintain",
      // ...
    });
  }
},
```

---

### ⚠️ 4. app/recipes/page.tsx - Filter logic có thể gây re-render nhiều lần

**Vấn đề:**
```typescript
const results = useMemo(() => {
  const q = query.toLowerCase();
  return DB.filter((r) => {
    const matchFilter = active.size === 0 || r.tags.some((t) => active.has(t));
    const matchQuery  = !q || r.n.toLowerCase().includes(q) ||
                        r.ing.some((i) => i.n.toLowerCase().includes(q));
    return matchFilter && matchQuery;
  });
}, [query, active]);
```

**Rủi ro:**
- `useMemo` phụ thuộc vào `active` (Set object)
- Set object được tạo mới mỗi khi `toggleFilter` được gọi
- Điều này có thể gây re-render không cần thiết

**Đánh giá:** ⚠️ **Rủi ro thấp** - DB chỉ có ~99 items, filter rất nhanh

**Khuyến nghị cải thiện:**
```typescript
// ✅ Sử dụng stable reference cho active
const active = useMemo(() => new Set<string>(), []);

// ✅ Hoặc chuyển sang array thay vì Set
const [active, setActive] = useState<string[]>([]);

// ✅ Hoặc sử dụng useRef để stable reference
const activeRef = useRef<Set<string>>(new Set());
const [active, setActive] = useState<Set<string>>(new Set());
```

---

## 🟢 TỐT: Các best practices đã được áp dụng

### ✅ 1. Sử dụng SWR cho data fetching
- Tự động caching, deduping, revalidation
- Không cần manual fetch trong useEffect
- Config tốt với `dedupingInterval: 60000`

### ✅ 2. Zustand store được quản lý tốt
- Không có circular dependencies
- Selectors được sử dụng đúng cách
- Persist middleware được cấu hình đúng

### ✅ 3. Không có inline functions trong JSX (trừ event handlers)
- Các components được tách ra riêng
- Không tạo mới functions mỗi render

### ✅ 4. Sử dụng useMemo cho expensive computations
- Filtering trong recipes page
- Calculations trong home page

### ✅ 5. Loading states được quản lý tốt
- `isLoading` từ SWR
- `generating` state cho plan generation
- Không render khi data chưa sẵn sàng

---

## 📊 Tổng kết

| Loại vấn đề | Số lượng | Mức độ nghiêm trọng | Trạng thái |
|------------|----------|-------------------|-----------|
| Vòng lặp vô tận | 0 | ❌ Nghiêm trọng | ✅ Không có |
| API calls liên tục | 0 | ❌ Nghiêm trọng | ✅ Không có |
| Re-render không kiểm soát | 0 | ❌ Nghiêm trọng | ✅ Không có |
| Render quá nhiều dữ liệu | 0 | ❌ Nghiêm trọng | ✅ Không có |
| useEffect nhiều dependencies | 1 | ⚠️ Thấp | ⚠️ Cần cải thiện |
| API spam (no debounce) | 1 | ⚠️ Trung bình | ⚠️ Cần cải thiện |
| Re-render từ store update | 1 | ⚠️ Thấp | ⚠️ Có thể cải thiện |
| Filter logic optimization | 1 | ⚠️ Thấp | ⚠️ Có thể cải thiện |

---

## 🎯 Khuyến nghị ưu tiên

### 🔴 Cao ưu tiên (nên fix ngay):
1. **Thêm protection cho generatePlan** - Tránh API spam
   ```typescript
   if (generating) return;
   ```

### 🟡 Trung bình ưu tiên (nên fix trong tương lai):
2. **Tách useEffect trong app/page.tsx** - Giảm re-render không cần thiết
3. **Thêm check trước khi update store** - Tránh re-render thừa

### 🟢 Thấp ưu tiên (nice to have):
4. **Optimize filter logic** - Sử dụng stable reference cho Set

---

## ✅ Kết luận

**Tin tốt:** Code của bạn **KHÔNG có các vấn đề nghiêm trọng** thường gặp ở AI-generated code như:
- ❌ Vòng lặp useEffect vô tận
- ❌ API calls liên tục
- ❌ Re-render không kiểm soát
- ❌ Render hàng ngàn items

**Tuy nhiên:** Có một số vấn đề nhỏ có thể cải thiện để tối ưu hiệu năng hơn:
- ⚠️ Protection cho API calls
- ⚠️ Giảm re-render không cần thiết
- ⚠️ Optimize filter logic

**Đánh giá tổng thể:** 🟢 **Tốt** - Code an toàn, không gây đơ app. Có thể cải thiện thêm để tối ưu hơn.

---

## 📚 Tài liệu tham khảo

- [React useEffect Best Practices](https://react.dev/reference/react/useEffect)
- [SWR Documentation](https://swr.vercel.app/)
- [Zustand Performance](https://docs.pmnd.rs/zustand/guides/performance)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)

---

**Last Updated:** 2026-04-28  
**Checked by:** Development Team
"