// PayPal configuration - using REST API directly
export const PAYPAL_BASE_URL = process.env.PAYPAL_ENVIRONMENT === 'live'
  ? 'https://api.paypal.com'
  : 'https://api.sandbox.paypal.com'

export const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || ''
export const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || ''

