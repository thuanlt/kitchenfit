import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProfileStore } from '../store/profile.store'

describe('Onboarding Persistence', () => {
  afterEach(() => {
    // Clear localStorage after each test
    localStorage.clear()
  })

  describe('Store persistence', () => {
    it('should persist onboardingDone state', () => {
      const { result, unmount } = renderHook(() => useProfileStore())
      
      // Initially, onboarding should not be done
      expect(result.current.onboardingDone).toBe(false)
      
      // Complete onboarding
      act(() => {
        result.current.setProfile({
          fullName: 'Test User',
          goal: 'cut',
          gender: 'male',
          age: 30,
          weight: 75,
          height: 175,
          activity: 1.55,
          tdee: 2500,
          onboardingDone: true,
        })
      })
      
      expect(result.current.onboardingDone).toBe(true)
      
      // Unmount the hook (simulate page reload)
      unmount()
      
      // Create a new hook instance (simulate page reload)
      const { result: newResult } = renderHook(() => useProfileStore())
      
      // State should be persisted
      expect(newResult.current.onboardingDone).toBe(true)
      expect(newResult.current.fullName).toBe('Test User')
    })

    it('should persist fullName across page reloads', () => {
      const { result, unmount } = renderHook(() => useProfileStore())
      
      act(() => {
        result.current.setProfile({ fullName: 'Nguyễn Văn A' })
      })
      
      expect(result.current.fullName).toBe('Nguyễn Văn A')
      
      // Simulate page reload
      unmount()
      
      const { result: newResult } = renderHook(() => useProfileStore())
      
      expect(newResult.current.fullName).toBe('Nguyễn Văn A')
    })

    it('should reset all state on logout', () => {
      const { result } = renderHook(() => useProfileStore())
      
      // Set up a complete profile
      act(() => {
        result.current.setProfile({
          fullName: 'John Doe',
          goal: 'bulk',
          gender: 'male',
          age: 25,
          weight: 70,
          height: 180,
          activity: 1.725,
          tdee: 3000,
          onboardingDone: true,
        })
      })
      
      expect(result.current.onboardingDone).toBe(true)
      expect(result.current.fullName).toBe('John Doe')
      
      // Logout
      act(() => {
        result.current.logout()
      })
      
      // All state should be reset
      expect(result.current.onboardingDone).toBe(false)
      expect(result.current.fullName).toBe('')
      expect(result.current.goal).toBe(null)
      expect(result.current.age).toBe(0)
    })

    it('should not lose data when updating partial profile', () => {
      const { result } = renderHook(() => useProfileStore())
      
      // Set complete profile
      act(() => {
        result.current.setProfile({
          fullName: 'Initial Name',
          goal: 'maintain',
          gender: 'female',
          age: 28,
          weight: 60,
          height: 165,
          activity: 1.375,
          tdee: 2000,
          onboardingDone: true,
        })
      })
      
      // Update only fullName
      act(() => {
        result.current.setProfile({ fullName: 'Updated Name' })
      })
      
      // Other fields should remain unchanged
      expect(result.current.fullName).toBe('Updated Name')
      expect(result.current.goal).toBe('maintain')
      expect(result.current.age).toBe(28)
      expect(result.current.onboardingDone).toBe(true)
    })
  })

  describe('Storage key', () => {
    it('should use correct storage key', () => {
      const { unmount } = renderHook(() => useProfileStore())
      
      act(() => {
        useProfileStore.getState().setProfile({
          fullName: 'Storage Test',
          onboardingDone: true,
        })
      })
      
      unmount()
      
      // Check localStorage directly
      const storedData = localStorage.getItem('chickenfit-profile-store')
      expect(storedData).toBeTruthy()
      
      if (storedData) {
        const parsed = JSON.parse(storedData)
        expect(parsed.state.fullName).toBe('Storage Test')
        expect(parsed.state.onboardingDone).toBe(true)
      }
    })
  })
})