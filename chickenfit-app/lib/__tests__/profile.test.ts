import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { 
  calcTDEE, 
  GOAL_TO_DB, 
  GOAL_FROM_DB, 
  ACT_TO_DB, 
  ACT_FROM_DB,
  type UserProfile 
} from '../profile'

describe('Profile Helpers', () => {
  describe('calcTDEE', () => {
    it('should calculate TDEE correctly for male', () => {
      const profile: Omit<UserProfile, 'tdee' | 'onboardingDone'> = {
              fullName: '',
              gender: 'male',
              age: 30,
              weight: 75,
              height: 175,
              activity: 1.55,
              goal: 'maintain'
            }
      
      const tdee = calcTDEE(profile)
      expect(tdee).toBeGreaterThan(0)
      expect(tdee).toBeLessThan(5000)
    })

    it('should calculate TDEE correctly for female', () => {
      const profile: Omit<UserProfile, 'tdee' | 'onboardingDone'> = {
              fullName: '',
              gender: 'female',
              age: 28,
              weight: 60,
              height: 165,
              activity: 1.375,
              goal: 'maintain'
            }
      
      const tdee = calcTDEE(profile)
      expect(tdee).toBeGreaterThan(0)
      expect(tdee).toBeLessThan(5000)
    })

    it('should adjust TDEE based on goal', () => {
      const baseProfile: Omit<UserProfile, 'tdee' | 'onboardingDone'> = {
              fullName: '',
              gender: 'male',
              age: 30,
              weight: 75,
              height: 175,
              activity: 1.55,
              goal: 'maintain'
            }
      
      const maintainTDEE = calcTDEE(baseProfile)
      const cutTDEE = calcTDEE({ ...baseProfile, goal: 'cut' })
      const bulkTDEE = calcTDEE({ ...baseProfile, goal: 'bulk' })
      
      expect(cutTDEE).toBeLessThan(maintainTDEE)
      expect(bulkTDEE).toBeGreaterThan(maintainTDEE)
    })
  })

  describe('Goal conversion helpers', () => {
    it('should convert goals to DB format', () => {
      expect(GOAL_TO_DB['burn']).toBe('cut')
      expect(GOAL_TO_DB['maintain']).toBe('maintain')
      expect(GOAL_TO_DB['build']).toBe('bulk')
    })

    it('should convert goals from DB format', () => {
      expect(GOAL_FROM_DB['cut']).toBe('burn')
      expect(GOAL_FROM_DB['maintain']).toBe('maintain')
      expect(GOAL_FROM_DB['bulk']).toBe('build')
    })

    it('should handle round-trip conversion for goals', () => {
      const goals = ['burn', 'maintain', 'build'] as const
      goals.forEach(goal => {
        const dbValue = GOAL_TO_DB[goal]
        const backToStore = GOAL_FROM_DB[dbValue]
        expect(backToStore).toBe(goal)
      })
    })
  })

  describe('Activity conversion helpers', () => {
    it('should convert activity to DB format', () => {
      expect(ACT_TO_DB['sedentary']).toBe(1.2)
      expect(ACT_TO_DB['light']).toBe(1.375)
      expect(ACT_TO_DB['moderate']).toBe(1.55)
      expect(ACT_TO_DB['active']).toBe(1.725)
      expect(ACT_TO_DB['very_active']).toBe(1.9)
    })

    it('should convert activity from DB format', () => {
      expect(ACT_FROM_DB[1.2]).toBe('sedentary')
      expect(ACT_FROM_DB[1.375]).toBe('light')
      expect(ACT_FROM_DB[1.55]).toBe('moderate')
      expect(ACT_FROM_DB[1.725]).toBe('active')
      expect(ACT_FROM_DB[1.9]).toBe('very_active')
    })

    it('should handle round-trip conversion for activities', () => {
      const activities = ['sedentary', 'light', 'moderate', 'active', 'very_active'] as const
      activities.forEach(activity => {
        const dbValue = ACT_TO_DB[activity]
        const backToStore = ACT_FROM_DB[dbValue]
        expect(backToStore).toBe(activity)
      })
    })
  })
})