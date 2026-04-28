import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import HomePage from '../page'
import { useProfileStore } from '../../store/profile.store'

// Mock the router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

// Mock the profile store
vi.mock('../../store/profile.store', () => ({
  useProfileStore: vi.fn(),
}))

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Greeting with fullName', () => {
    it('should display personalized greeting when fullName is set', () => {
      vi.mocked(useProfileStore).mockReturnValue({
        onboardingDone: true,
        goal: 'cut',
        gender: 'male',
        age: 30,
        weight: 75,
        height: 175,
        activity: 1.55,
        tdee: 2500,
        fullName: 'Nguyễn Văn A',
        accessToken: 'mock-token',
        userId: 'user-1',
        email: 'test@example.com',
        setProfile: vi.fn(),
        logout: vi.fn(),
        setTokens: vi.fn(),
      })

      render(<HomePage />)
      
      // Check if greeting contains the name
      const greetingElement = screen.getByText(/nguyễn van a/i)
      expect(greetingElement).toBeInTheDocument()
    })

    it('should display generic greeting when fullName is empty', () => {
      vi.mocked(useProfileStore).mockReturnValue({
        onboardingDone: true,
        goal: 'cut',
        gender: 'male',
        age: 30,
        weight: 75,
        height: 175,
        activity: 1.55,
        tdee: 2500,
        fullName: '',
        accessToken: 'mock-token',
        userId: 'user-1',
        email: 'test@example.com',
        setProfile: vi.fn(),
        logout: vi.fn(),
        setTokens: vi.fn(),
      })

      render(<HomePage />)
      
      // Check if greeting does NOT contain a name
      const greetingElements = screen.getAllByText(/chào/i)
      expect(greetingElements.length).toBeGreaterThan(0)
      
      // Should not have comma after greeting (which indicates a name follows)
      const greetingWithComma = greetingElements.find(el => 
        el.textContent?.includes(',')
      )
      expect(greetingWithComma).toBeUndefined()
    })

    it('should display greeting with exclamation mark when name is present', () => {
      vi.mocked(useProfileStore).mockReturnValue({
        onboardingDone: true,
        goal: 'cut',
        gender: 'male',
        age: 30,
        weight: 75,
        height: 175,
        activity: 1.55,
        tdee: 2500,
        fullName: 'John',
        accessToken: 'mock-token',
        userId: 'user-1',
        email: 'test@example.com',
        setProfile: vi.fn(),
        logout: vi.fn(),
        setTokens: vi.fn(),
      })

      render(<HomePage />)
      
      const greetingElement = screen.getByText(/john!/i)
      expect(greetingElement).toBeInTheDocument()
    })
  })

  describe('Onboarding redirect', () => {
    it('should redirect to onboarding if not completed', () => {
      const mockReplace = vi.fn()
      vi.mocked(useProfileStore).mockReturnValue({
        onboardingDone: false,
        goal: null,
        gender: null,
        age: null,
        weight: null,
        height: null,
        activity: null,
        tdee: 0,
        fullName: '',
        accessToken: null,
        userId: null,
        email: null,
        setProfile: vi.fn(),
        logout: vi.fn(),
        setTokens: vi.fn(),
      })

      // Simple mock without complex type casting
            const useRouter = require('next/navigation').useRouter
            vi.mocked(useRouter).mockReturnValue({
              push: vi.fn(),
              replace: mockReplace,
            })

      render(<HomePage />)
      
      expect(mockReplace).toHaveBeenCalledWith('/onboarding')
    })
  })
})