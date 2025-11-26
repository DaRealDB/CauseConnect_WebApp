import { hashPassword, comparePassword } from './password'

/**
 * Generate a 6-digit OTP code
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Hash OTP using bcrypt (similar to password hashing)
 */
export async function hashOTP(otp: string): Promise<string> {
  return hashPassword(otp)
}

/**
 * Compare OTP with hashed OTP
 */
export async function compareOTP(otp: string, hashedOTP: string): Promise<boolean> {
  return comparePassword(otp, hashedOTP)
}

/**
 * Generate expiration time (10 minutes from now)
 */
export function getOTPExpiration(): Date {
  return new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
}




