'use server'

import { api } from '../../lib/fetchApi'
import { setToken } from '../../lib/auth-cookie'
import type { components } from '../../lib/api.d'

type OTPVerifyRequest = components['schemas']['OTPVerifyRequest']
type TokenResponse = components['schemas']['TokenResponse']
type ErrorResponse = components['schemas']['Error']

export interface VerifyOtpResult {
  success: boolean
  data?: TokenResponse
  error?: string
}

/**
 * Verify OTP and receive JWT token
 * @param email - User's email address
 * @param code - OTP code
 * @returns Result object with success status and data or error
 */
export async function verifyOtp({
  email,
  code,
}: {
  email: string
  code: string
}): Promise<VerifyOtpResult> {
  try {
    const payload: OTPVerifyRequest = {
      email,
      otp: code,
      tenantId: 'default', // Using default tenant as per schema
    }

    const response = await api.post<TokenResponse>(
      '/api/auth/verify-otp',
      payload
    )

    if (response.token) {
      await setToken(response.token)
    }

    return {
      success: true,
      data: response,
    }
  } catch (error) {
    console.error('Error verifying OTP:', error)

    // Extract error message from the error object
    let errorMessage = 'Failed to verify OTP. Please try again.'

    if (error instanceof Error) {
      errorMessage = error.message
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}
