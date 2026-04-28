import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OnboardingPage from '../page'
import { useProfileStore } from '../../../store/profile.store'

// Mock the router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}))

// Mock the profile store
vi.mock('../../../store/profile.store', () => ({
  useProfileStore: vi.fn(),
}))

describe('Onboarding Page', () => {
  const mockSetProfile = vi.fn()
  const mockRouter = { push: vi.fn(), replace: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useProfileStore).mockReturnValue({
      setProfile: mockSetProfile,
      accessToken: 'mock-token',
      onboardingDone: false,
      goal: null,
      gender: null,
      age: null,
      weight: null,
      height: null,
      activity: null,
      tdee: 0,
      fullName: '',
      userId: null,
      email: null,
      logout: vi.fn(),
      setTokens: vi.fn(),
    })

    // Simple mock without complex type casting
    const useRouter = require('next/navigation').useRouter
    vi.mocked(useRouter).mockReturnValue(mockRouter)
  })

  describe('Step 0: Full Name Input', () => {
    it('should render full name input on first step', () => {
      render(<OnboardingPage />)
      
      expect(screen.getByPlaceholderText(/nhập tên của bạn/i)).toBeInTheDocument()
      expect(screen.getByText(/xin chào!/i)).toBeInTheDocument()
    })

    it('should disable next button when name is empty', () => {
      render(<OnboardingPage />)
      
      const nextButton = screen.getByText(/tiếp theo/i)
      expect(nextButton).toBeDisabled()
    })

    it('should enable next button when name is entered', async () => {
      const user = userEvent.setup()
      render(<OnboardingPage />)
      
      const nameInput = screen.getByPlaceholderText(/nhập tên của bạn/i)
      const nextButton = screen.getByText(/tiếp theo/i)
      
      await user.type(nameInput, 'Nguyễn Văn A')
      
      expect(nextButton).toBeEnabled()
    })

    it('should move to next step after entering name and clicking next', async () => {
      const user = userEvent.setup()
      render(<OnboardingPage />)
      
      const nameInput = screen.getByPlaceholderText(/nhập tên của bạn/i)
      const nextButton = screen.getByText(/tiếp theo/i)
      
      await user.type(nameInput, 'Test User')
      await user.click(nextButton)
      
      await waitFor(() => {
        expect(screen.getByText(/mục tiêu của bạn/i)).toBeInTheDocument()
      })
    })

    it('should save fullName when completing onboarding', async () => {
      const user = userEvent.setup()
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: {} }),
        })
      ) as any

      render(<OnboardingPage />)
      
      // Enter name
      const nameInput = screen.getByPlaceholderText(/nhập tên của bạn/i)
      await user.type(nameInput, 'John Doe')
      
      // Click through steps
      const nextButton = screen.getByText(/tiếp theo/i)
      
      // Step 1: Goal
      await user.click(nextButton)
      await waitFor(() => {
        expect(screen.getByText(/giảm mỡ/i)).toBeInTheDocument()
      })
      await user.click(screen.getByText(/giảm mỡ/i))
      await user.click(nextButton)
      
      // Step 2: Body
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/nhập tuổi/i)).toBeInTheDocument()
      })
      const ageInput = screen.getByPlaceholderText(/nhập tuổi/i)
      await user.type(ageInput, '30')
      
      const weightInput = screen.getByPlaceholderText(/nhập cân nặng/i)
      await user.type(weightInput, '75')
      
      const heightInput = screen.getByPlaceholderText(/nhập chiều cao/i)
      await user.type(heightInput, '175')
      
      await user.click(nextButton)
      
      // Step 3: Activity
      await waitFor(() => {
        expect(screen.getByText(/ít vận động/i)).toBeInTheDocument()
      })
      await user.click(screen.getByText(/vừa phải/i))
      
      // Complete
      const completeButton = screen.getByText(/bắt đầu/i)
      await user.click(completeButton)
      
      await waitFor(() => {
        expect(mockSetProfile).toHaveBeenCalledWith(
          expect.objectContaining({
            fullName: 'John Doe',
            onboardingDone: true,
          })
        )
      })
    })
  })

  describe('Navigation', () => {
    it('should show progress dots', () => {
      render(<OnboardingPage />)
      
      // Should have 5 dots for 5 steps
      const dots = document.querySelectorAll('[style*="height: 6px"]')
      expect(dots.length).toBeGreaterThan(0)
    })

    it('should go back to previous step', async () => {
      const user = userEvent.setup()
      render(<OnboardingPage />)
      
      // Enter name and go to next step
      const nameInput = screen.getByPlaceholderText(/nhập tên của bạn/i)
      await user.type(nameInput, 'Test')
      
      const nextButton = screen.getByText(/tiếp theo/i)
      await user.click(nextButton)
      
      await waitFor(() => {
        expect(screen.getByText(/mục tiêu của bạn/i)).toBeInTheDocument()
      })
      
      // Go back
      const backButton = screen.getByText(/←/)
      await user.click(backButton)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/nhập tên của bạn/i)).toBeInTheDocument()
      })
    })
  })
})