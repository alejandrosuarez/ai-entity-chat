import { ChatFSM, FSMState } from '../../src/lib/chat-fsm'

describe('ChatFSM', () => {
  let fsm: ChatFSM

  beforeEach(() => {
    fsm = new ChatFSM()
  })

  describe('constructor', () => {
    it('should initialize with default state "unauth"', () => {
      expect(fsm.getCurrentState()).toBe('unauth')
    })

    it('should initialize with provided state', () => {
      const initialState: FSMState = 'authenticated'
      const customFsm = new ChatFSM(initialState)
      expect(customFsm.getCurrentState()).toBe('authenticated')
    })
  })

  describe('transition', () => {
    it('should transition from unauth to emailForm', () => {
      fsm.transition('emailForm')
      expect(fsm.getCurrentState()).toBe('emailForm')
    })

    it('should transition from emailForm to otpForm', () => {
      fsm.transition('emailForm')
      fsm.transition('otpForm')
      expect(fsm.getCurrentState()).toBe('otpForm')
    })

    it('should transition from otpForm to authenticated', () => {
      fsm.transition('otpForm')
      fsm.transition('authenticated')
      expect(fsm.getCurrentState()).toBe('authenticated')
    })

    it('should transition from authenticated to listing', () => {
      fsm.transition('authenticated')
      fsm.transition('listing')
      expect(fsm.getCurrentState()).toBe('listing')
    })

    it('should transition from authenticated to creating', () => {
      fsm.transition('authenticated')
      fsm.transition('creating')
      expect(fsm.getCurrentState()).toBe('creating')
    })

    it('should allow transition back to previous states', () => {
      fsm.transition('authenticated')
      fsm.transition('listing')
      fsm.transition('authenticated')
      expect(fsm.getCurrentState()).toBe('authenticated')
    })
  })

  describe('getCurrentState', () => {
    it('should return the current state', () => {
      expect(fsm.getCurrentState()).toBe('unauth')

      fsm.transition('emailForm')
      expect(fsm.getCurrentState()).toBe('emailForm')

      fsm.transition('authenticated')
      expect(fsm.getCurrentState()).toBe('authenticated')
    })
  })

  describe('state flow validation', () => {
    it('should handle complete authentication flow', () => {
      // Start from unauth
      expect(fsm.getCurrentState()).toBe('unauth')

      // Go to email form
      fsm.transition('emailForm')
      expect(fsm.getCurrentState()).toBe('emailForm')

      // Go to OTP form
      fsm.transition('otpForm')
      expect(fsm.getCurrentState()).toBe('otpForm')

      // Complete authentication
      fsm.transition('authenticated')
      expect(fsm.getCurrentState()).toBe('authenticated')

      // Use the app
      fsm.transition('listing')
      expect(fsm.getCurrentState()).toBe('listing')

      // Go back to main authenticated state
      fsm.transition('authenticated')
      expect(fsm.getCurrentState()).toBe('authenticated')

      // Create entity
      fsm.transition('creating')
      expect(fsm.getCurrentState()).toBe('creating')
    })

    it('should handle logout flow', () => {
      fsm.transition('authenticated')
      expect(fsm.getCurrentState()).toBe('authenticated')

      // Logout should go back to unauth
      fsm.transition('unauth')
      expect(fsm.getCurrentState()).toBe('unauth')
    })
  })
})
