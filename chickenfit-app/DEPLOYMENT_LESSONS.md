"# 📚 Bài học từ Deployment Failures

> **Mục đích:** Tài liệu này ghi lại các lỗi đã gặp phải trong quá trình deployment và cách khắc phục để tránh gặp lại trong tương lai.

---

## 🔴 Deployment Failed #1: Import Path Errors

### 📅 Ngày: 2026-04-28

### ❌ Lỗi:
```
Module not found: Can't resolve '../lib/profile'
Module not found: Can't resolve '../store/profile.store'
```

### 🔍 Nguyên nhân:
- File `app/onboarding/page.tsx` đang sử dụng sai đường dẫn import
- Đường dẫn `../lib/profile` sẽ trỏ đến `app/lib/profile` (không tồn tại)
- Đường dẫn đúng phải là `../../lib/profile` (trỏ đến `lib/profile`)

### ✅ Cách fix:
```typescript
// ❌ SAI
import { calcTDEE, type UserProfile } from "../lib/profile";
import { useProfileStore } from "../store/profile.store";

// ✅ ĐÚNG
import { calcTDEE, type UserProfile } from "../../lib/profile";
import { useProfileStore } from "../../store/profile.store";
```

### 🛡️ Cách phòng tránh:

#### 1. **Quy tắc đường dẫn tương đối:**
```
app/
├── onboarding/
│   └── page.tsx          (muốn import từ lib/)
├── me/
│   └── page.tsx          (muốn import từ lib/)
└── api/
    └── profile/
        └── route.ts      (muốn import từ lib/)

lib/
├── profile.ts
└── macros.ts

store/
└── profile.store.ts
```

- Từ `app/onboarding/page.tsx` → `lib/profile.ts`: `../../lib/profile` (lên 2 cấp)
- Từ `app/me/page.tsx` → `lib/profile.ts`: `../../lib/profile` (lên 2 cấp)
- Từ `app/api/profile/route.ts` → `lib/profile.ts`: `../../../lib/profile` (lên 3 cấp)

#### 2. **Sử dụng TypeScript Path Aliases (khuyên dùng):**

Trong `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/lib/*": ["lib/*"],
      "@/store/*": ["store/*"],
      "@/components/*": ["components/*"],
      "@/app/*": ["app/*"]
    }
  }
}
```

Sau đó có thể import:
```typescript
import { calcTDEE, type UserProfile } from "@/lib/profile";
import { useProfileStore } from "@/store/profile.store";
```

#### 3. **Kiểm tra trước khi commit:**
```bash
# Build local trước khi push
npm run build

# Nếu build fail, KHÔNG push code
```

#### 4. **Sử dụng IDE features:**
- VS Code: Auto-import sẽ tự động gợi ý đường dẫn đúng
- WebStorm: Alt+Enter để fix import paths

---

## 🔴 Deployment Failed #2: Type Mismatch Errors

### 📅 Ngày: 2026-04-28

### ❌ Lỗi:
```
Type '"sedentary" | "light" | "moderate" | "active" | "very_active"' 
is not assignable to type 'ActivityLevel'.
Type '"sedentary"' is not assignable to type 'ActivityLevel'.
```

### 🔍 Nguyên nhân:
- `UserProfile.ActivityLevel` là number type: `1.2 | 1.375 | 1.55 | 1.725 | 1.9`
- Onboarding form đang lưu activity dưới dạng string: `"sedentary" | "light" | ...`
- Không có conversion giữa string và number type

### ✅ Cách fix:
```typescript
// Import conversion helpers
import { ACT_TO_DB, GOAL_TO_DB } from "../../lib/profile";

// Convert trước khi gán vào profile
const profile: Omit<UserProfile, "tdee" | "onboardingDone"> = {
  fullName,
  gender,
  age,
  weight,
  height,
  activity: ACT_TO_DB[activity as keyof typeof ACT_TO_DB], // string → number
  goal: GOAL_TO_DB[goal as keyof typeof GOAL_TO_DB],       // string → enum
};
```

### 🛡️ Cách phòng tránh:

#### 1. **Đồng bộ type definitions:**
```typescript
// lib/profile.ts
export type ActivityLevel = 1.2 | 1.375 | 1.55 | 1.725 | 1.9;

export const ACT_TO_DB: Record<"sedentary" | "light" | "moderate" | "active" | "very_active", ActivityLevel> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};
```

#### 2. **Sử dụng type guards:**
```typescript
function isValidActivity(value: string): value is keyof typeof ACT_TO_DB {
  return value in ACT_TO_DB;
}

// Sử dụng
if (isValidActivity(activity)) {
  const activityLevel = ACT_TO_DB[activity];
}
```

#### 3. **Zod schema validation:**
```typescript
import { z } from "zod";

const ActivitySchema = z.enum(["sedentary", "light", "moderate", "active", "very_active"]);

// Validate form data
const validatedActivity = ActivitySchema.parse(activity);
const activityLevel = ACT_TO_DB[validatedActivity];
```

#### 4. **Unit test cho type conversions:**
```typescript
describe('Type Conversions', () => {
  it('should convert activity string to number', () => {
    expect(ACT_TO_DB["sedentary"]).toBe(1.2);
    expect(ACT_TO_DB["very_active"]).toBe(1.9);
  });
});
```

---

## 🔴 Deployment Failed #3: Missing Required Fields

### 📅 Ngày: 2026-04-28

### ❌ Lỗi:
```
Property 'fullName' is missing in type '{ goal: Goal; gender: Gender; age: number; ... }' 
but required in type 'UserProfile'.
```

### 🔍 Nguyên nhân:
- Interface `UserProfile` được thêm field `fullName`
- Các object `UserProfile` cũ trong code và tests chưa được cập nhật
- TypeScript báo lỗi vì thiếu required field

### ✅ Cách fix:
```typescript
// Cập nhật tất cả các UserProfile objects
const profile: UserProfile = {
  fullName: fullName || "",  // ← Thêm dòng này
  goal: goal!,
  gender,
  age,
  weight,
  height,
  activity: activity!,
  tdee,
  onboardingDone: true,
};
```

### 🛡️ Cách phòng tránh:

#### 1. **Sử dụng utility types:**
```typescript
// Tạo type partial cho draft
type UserProfileDraft = Partial<Pick<UserProfile, 'fullName'>> & Omit<UserProfile, 'fullName'>;

// Hoặc làm fullName optional
type UserProfileWithOptionalName = Omit<UserProfile, 'fullName'> & { fullName?: string };
```

#### 2. **Factory functions:**
```typescript
function createEmptyProfile(): UserProfile {
  return {
    fullName: "",
    goal: "maintain",
    gender: "male",
    age: 0,
    weight: 0,
    height: 0,
    activity: 1.2,
    tdee: 0,
    onboardingDone: false,
  };
}

// Sử dụng
const profile = createEmptyProfile();
```

#### 3. **ESLint rules:**
```json
{
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/strict-boolean-expressions": "warn"
  }
}
```

#### 4. **Pre-commit hooks:**
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run type-check && npm run lint"
    }
  }
}
```

---

## 🔴 Deployment Failed #4: Cache Issues

### 📅 Ngày: 2026-04-28

### ❌ Lỗi:
```
.next/dev/types/validator.ts: File 'routes.d.ts' is not a module.
```

### 🔍 Nguyên nhân:
- Next.js cache bị lỗi sau khi thay đổi cấu trúc file
- Type definitions không được rebuild đúng cách

### ✅ Cách fix:
```bash
# Xóa cache và build lại
rm -rf .next  # Linux/Mac
# hoặc
Remove-Item -Recurse -Force .next  # Windows

npm run build
```

### 🛡️ Cách phòng tránh:

#### 1. **Script cleanup:**
```json
// package.json
{
  "scripts": {
    "clean": "rm -rf .next node_modules/.cache",
    "rebuild": "npm run clean && npm run build"
  }
}
```

#### 2. **Git ignore:**
```gitignore
# .gitignore
.next/
node_modules/.cache/
```

#### 3. **CI/CD clean build:**
```yaml
# .github/workflows/deploy.yml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
      - name: Install dependencies
        run: npm ci
      - name: Clean cache
        run: rm -rf .next
      - name: Build
        run: npm run build
```

---

## 📋 Checklist Trước Khi Deploy

### ✅ Pre-Deployment Checklist:

#### Code Quality:
- [ ] Chạy `npm run build` local - **BẮT BUỘC**
- [ ] Chạy `npm run lint` - fix tất cả warnings
- [ ] Chạy `npm run test` - tất cả tests phải pass
- [ ] Chạy `npx tsc --noEmit` - không có TypeScript errors

#### Import Paths:
- [ ] Kiểm tra tất cả imports từ `app/` → `lib/`, `store/`, `components/`
- [ ] Đảm bảo số lượng `../` đúng
- [ ] Cân nhắc sử dụng path aliases (`@/`)

#### Type Safety:
- [ ] Kiểm tra type conversions (string ↔ number ↔ enum)
- [ ] Đảm bảo tất cả required fields có giá trị
- [ ] Validate form data trước khi gán vào types

#### Cache & Dependencies:
- [ ] Xóa `.next` folder nếu có thay đổi lớn
- [ ] Run `npm ci` thay vì `npm install` trong CI/CD
- [ ] Kiểm tra `package.json` và `package-lock.json` sync

#### Environment Variables:
- [ ] Kiểm tra tất cả env variables trong `.env.local`
- [ ] Đảm bảo env variables được set trên Vercel/production
- [ ] Không commit `.env.local` vào git

#### Testing:
- [ ] Test manual trên local
- [ ] Test trên staging environment (nếu có)
- [ ] Test critical user flows

---

## 🛠️ Tools & Scripts Hữu Ích

### 1. Script kiểm tra imports:
```bash
# Tìm tất cả imports từ app/ với đường dẫn sai
grep -r "from \"../lib/" app/ --include="*.tsx" --include="*.ts"
grep -r "from \"../store/" app/ --include="*.tsx" --include="*.ts"
```

### 2. Script kiểm tra type errors:
```bash
# Chỉ kiểm tra type errors, không build
npx tsc --noEmit --pretty
```

### 3. ESLint config cho imports:
```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['../lib/*', '../store/*'],
            message: 'Use @/lib/* or @/store/* instead',
          },
        ],
      },
    ],
  },
};
```

---

## 📖 Tài liệu tham khảo:

- [Next.js Import Aliases](https://nextjs.org/docs/app/building-your-application/configuring/absolute-imports-and-module-aliases)
- [TypeScript Path Mapping](https://www.typescriptlang.org/tsconfig#paths)
- [Zod Validation](https://zod.dev/)
- [Husky Pre-commit Hooks](https://typicode.github.io/husky/)

---

## 🔄 Cập nhật:

| Deployment Failed # | Ngày | Vấn đề | Status |
|---------------------|------|--------|--------|
| #1 | 2026-04-28 | Import Path Errors | ✅ Fixed |
| #2 | 2026-04-28 | Type Mismatch Errors | ✅ Fixed |
| #3 | 2026-04-28 | Missing Required Fields | ✅ Fixed |
| #4 | 2026-04-28 | Cache Issues | ✅ Fixed |

---

**Last Updated:** 2026-04-28  
**Maintained by:** Development Team
"