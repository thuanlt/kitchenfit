# 🐛 Bug Report - 2026-04-28

---

## 📋 Bug #001: Tên lưu ngay khi gõ trong Profile (Name saves immediately when typing in profile)

### Bug Information

| Field | Value |
|-------|-------|
| **Bug ID** | BUG-001 |
| **Title** | Tên lưu ngay khi gõ trong Profile (Name saves immediately when typing in profile) |
| **Severity** | Medium |
| **Priority** | P2 |
| **Status** | Open |
| **Assignee** | TBD |
| **Reporter** | Development Team |
| **Created Date** | 2026-04-28 |

---

### Description

**What is the bug?**
Khi người dùng đang nhập tên trong trang Profile, tên được lưu ngay lập tức vào store mỗi khi gõ phím, thay vì chỉ lưu khi người dùng nhấn nút "Lưu" (Save). Điều này gây ra các vấn đề:

1. **Unnecessary API calls**: Mỗi lần gõ phím có thể trigger API call để cập nhật profile
2. **Inconsistent state**: Dữ liệu trong store được cập nhật trước khi user xác nhận muốn lưu
3. **Poor UX**: User không có cơ hội hủy thay đổi nếu họ đổi ý
4. **Race conditions**: Nếu user gõ nhanh, có thể xảy ra các request conflict

**Steps to Reproduce**
1. Mở trang Profile
2. Click vào trường "Tên" (Name field)
3. Bắt đầu gõ tên mới
4. Observe: Tên được cập nhật ngay lập tức trong UI và có thể trigger API calls
5. Thử refresh trang hoặc navigate away và quay lại
6. Observe: Tên đã được lưu mà không cần nhấn nút "Lưu"

**Expected Behavior**
- Tên chỉ được lưu vào store và gửi lên server khi người dùng nhấn nút "Lưu" (Save)
- User có thể hủy thay đổi bằng cách không nhấn nút "Lưu" hoặc nhấn nút "Hủy" (Cancel)
- Có draft state để giữ giá trị tạm thời trước khi xác nhận

**Actual Behavior**
- Tên được lưu ngay lập tức vào store mỗi khi gõ phím
- Không có cơ chế draft/confirm
- Thay đổi được áp dụng ngay lập tức mà không cần user confirmation

**Screenshots/Videos**
*(Screenshots hoặc video demo sẽ được thêm sau)*

---

### Environment

| Field | Value |
|-------|-------|
| **Platform** | Web / iOS / Android |
| **Browser** | Chrome / Safari / Firefox |
| **OS Version** | All versions |
| **App Version** | Latest |

---

### Root Cause Analysis

**Root Cause:**
Code hiện tại đang cập nhật store trực tiếp thông qua `setStoreProfile` mỗi khi user gõ phím, thay vì sử dụng một draft/local state để giữ giá trị tạm thời. Điều này vi phạm pattern tốt nhất cho form handling trong React/Next.js.

**Pattern Issue:**
- ❌ **Current Pattern**: Input onChange → Direct store update → API call
- ✅ **Correct Pattern**: Input onChange → Local draft state → User clicks Save → Store update → API call

**Affected Files:**
- [ ] `app/profile/page.tsx` - Profile page component
- [ ] `components/profile/ProfileForm.tsx` - Profile form component
- [ ] `store/profileStore.ts` - Profile store (if exists)
- [ ] `lib/api/profile.ts` - Profile API functions

**Potential Code Locations:**
```typescript
// ❌ BAD: Direct store update on every keystroke
<input 
  value={storeProfile.name}
  onChange={(e) => setStoreProfile({ ...storeProfile, name: e.target.value })}
/>

// ✅ GOOD: Use local draft state
const [draftProfile, setDraftProfile] = useState(storeProfile);

<input 
  value={draftProfile.name}
  onChange={(e) => setDraftProfile({ ...draftProfile, name: e.target.value })}
/>

// Only update store when user clicks Save
const handleSave = () => {
  setStoreProfile(draftProfile);
  // Then call API
};
```

---

### Fix Information

**Fix Description:**
1. Implement draft pattern for Profile form
2. Add local state to hold temporary values before save
3. Only update store and call API when user explicitly clicks "Save"
4. Add "Cancel" button to discard changes
5. Show unsaved changes indicator
6. Warn user if they try to leave with unsaved changes

**Proposed Changes:**

#### 1. Update ProfileForm Component
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useProfileStore } from '@/store/profileStore';

export function ProfileForm() {
  const storeProfile = useProfileStore(state => state.profile);
  const setStoreProfile = useProfileStore(state => state.setProfile);
  
  // Local draft state
  const [draftProfile, setDraftProfile] = useState(storeProfile);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync draft with store when store changes externally
  useEffect(() => {
    if (!hasUnsavedChanges) {
      setDraftProfile(storeProfile);
    }
  }, [storeProfile, hasUnsavedChanges]);

  const handleChange = (field: keyof typeof draftProfile, value: string) => {
    setDraftProfile(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update store
      setStoreProfile(draftProfile);
      
      // Call API
      await updateProfile(draftProfile);
      
      setHasUnsavedChanges(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDraftProfile(storeProfile);
    setHasUnsavedChanges(false);
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
      {/* Form fields */}
      <input
        value={draftProfile.name}
        onChange={(e) => handleChange('name', e.target.value)}
        placeholder="Your name"
      />
      
      {/* Action buttons */}
      <div className="flex gap-2">
        <button 
          type="submit" 
          disabled={!hasUnsavedChanges || isSaving}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        <button 
          type="button" 
          onClick={handleCancel}
          disabled={!hasUnsavedChanges}
        >
          Cancel
        </button>
      </div>
      
      {/* Unsaved changes indicator */}
      {hasUnsavedChanges && (
        <p className="text-yellow-600">You have unsaved changes</p>
      )}
    </form>
  );
}
```

#### 2. Add Unsaved Changes Warning
```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useUnsavedChangesWarning(hasUnsavedChanges: boolean) {
  const router = useRouter();

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);
}
```

**Files Changed:**
- [ ] `components/profile/ProfileForm.tsx` - Implement draft pattern
- [ ] `components/profile/useUnsavedChangesWarning.ts` - Add warning hook
- [ ] `app/profile/page.tsx` - Update to use new form component

**Testing Done:**
- [ ] Unit tests for ProfileForm component
- [ ] Integration tests for save/cancel functionality
- [ ] Manual testing completed
- [ ] Regression testing completed

---

### Related Bugs

- [ ] BUG-XXX - Auto-save issue in recipe editor
- [ ] BUG-XXX - Meal plan form missing draft pattern
- [ ] BUG-XXX - Progress log form saves immediately

---

## 🔍 Additional Bugs Found During Investigation

### Bug #002: Missing Draft Pattern in Recipe Editor
- **Severity**: Medium
- **Status**: Open
- **Description**: Recipe editor also updates store directly on input change
- **Action**: Apply same fix as BUG-001

### Bug #003: No Unsaved Changes Warning
- **Severity**: Low
- **Status**: Open
- **Description**: No warning when user tries to leave page with unsaved changes
- **Action**: Implement `useUnsavedChangesWarning` hook

### Bug #004: Missing Cancel Button
- **Severity**: Low
- **Status**: Open
- **Description**: No way to discard unsaved changes in profile form
- **Action**: Add cancel button with confirmation

---

## 📊 Impact Analysis

### User Impact
- **Severity**: Medium
- **Affected Users**: All users who edit their profile
- **Frequency**: Every time user edits profile
- **Workaround**: None currently available

### Technical Impact
- **Performance**: Unnecessary re-renders and potential API calls
- **Data Integrity**: Risk of partial/incomplete data being saved
- **User Experience**: Poor UX with no ability to cancel changes

---

## 🎯 Acceptance Criteria

- [ ] Profile form uses local draft state
- [ ] Store only updates when user clicks "Save"
- [ ] "Cancel" button discards unsaved changes
- [ ] Unsaved changes indicator is shown
- [ ] Warning when leaving page with unsaved changes
- [ ] No API calls until user confirms save
- [ ] All existing tests pass
- [ ] New tests added for draft pattern
- [ ] Manual testing completed on all platforms

---

## 📅 Timeline

| Milestone | Target Date | Status |
|-----------|-------------|--------|
| Investigation Complete | 2026-04-28 | ✅ Done |
| Fix Implementation | 2026-04-29 | ⏳ Pending |
| Testing | 2026-04-29 | ⏳ Pending |
| Code Review | 2026-04-30 | ⏳ Pending |
| Deployment to Staging | 2026-04-30 | ⏳ Pending |
| Production Deployment | 2026-05-01 | ⏳ Pending |

---

## 📝 Notes

- This bug was discovered during code review of the profile feature
- Similar pattern may exist in other forms throughout the application
- Consider creating a reusable `useFormDraft` hook for consistent implementation across all forms
- Refer to [BUG_FIX_CHECKLIST.md](./BUG_FIX_CHECKLIST.md) for complete fix process

---

**Last Updated:** 2026-04-28  
**Version:** 1.0.0