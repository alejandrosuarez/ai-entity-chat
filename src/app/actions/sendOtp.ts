'use server'

import { api } from '../../lib/fetchApi'
import type { components } from '../../lib/api.d'

type OTPRequest = components['schemas']['OTPRequest']
type OTPResponse = components['schemas']['OTPResponse']
type ErrorResponse = components['schemas']['Error']

export interface SendOtpResult {
  success: boolean
  data?: OTPResponse
  error?: string
}

/**
 * Send OTP to user's email for authentication
 * @param email - User's email address
 * @returns Result object with success status and data or error
 */
export async function sendOtp(email: string): Promise<SendOtpResult> {
  try {
    const payload: OTPRequest = {
      email,
      tenantId: 'default', // Using default tenant as per schema
    }

    const response = await api.post<OTPResponse>('/api/auth/send-otp', payload)

    return {
      success: true,
      data: response,
    }
  } catch (error) {
    console.error('Error sending OTP:', error)

    // Extract error message from the error object
    let errorMessage = 'Failed to send OTP. Please try again.'

    if (error instanceof Error) {
      errorMessage = error.message
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}
