import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProfileStore } from '../profile.store'

describe('Profile Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useProfileStore.getState().logout()
  })

  describe('fullName field', () => {
    it('should initialize with empty fullName', () => {
      const { result } = renderHook(() => useProfileStore())
      expect(result.current.fullName).toBe('')
    })

    it('should update fullName via setProfile', () => {
      const { result } = renderHook(() => useProfileStore())
      
      act(() => {
        result.current.setProfile({ fullName: 'Nguyễn Văn A' })
      })
      
      expect(result.current.fullName).toBe('Nguyễn Văn A')
    })

    it('should persist fullName across re-renders', () => {
      const { result } = renderHook(() => useProfileStore())
      
      act(() => {
        result.current.setProfile({ fullName: 'Test User' })
      })
      
      const { rerender } = renderHook(() => useProfileStore())
      rerender()
      
      expect(result.current.fullName).toBe('Test User')
    })

    it('should reset fullName on logout', () => {
      const { result } = renderHook(() => useProfileStore())
      
      act(() => {
        result.current.setProfile({ fullName: 'User Name' })
      })
      expect(result.current.fullName).toBe('User Name')
      
      act(() => {
        result.current.logout()
      })
      
      expect(result.current.fullName).toBe('')
    })
  })

  describe('complete profile with fullName', () => {
    it('should set complete profile including fullName', () => {
      const { result } = renderHook(() => useProfileStore())
      
      act(() => {
        result.current.setProfile({
          fullName: 'John Doe',
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
      
      expect(result.current.fullName).toBe('John Doe')
      expect(result.current.goal).toBe('cut')
      expect(result.current.onboardingDone).toBe(true)
    })
  })
})