/**
 * Currency formatting utilities
 */

// Common currencies with their symbols and formatting
export const CURRENCIES: Record<string, { code: string; symbol: string; name: string; locale: string }> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'en-EU' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', locale: 'de-CH' },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', locale: 'zh-CN' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', locale: 'pt-BR' },
  MXN: { code: 'MXN', symbol: '$', name: 'Mexican Peso', locale: 'es-MX' },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', locale: 'en-ZA' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG' },
  HKD: { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', locale: 'en-HK' },
  NOK: { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', locale: 'nb-NO' },
  SEK: { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', locale: 'sv-SE' },
  DKK: { code: 'DKK', symbol: 'kr', name: 'Danish Krone', locale: 'da-DK' },
  PLN: { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', locale: 'pl-PL' },
  PHP: { code: 'PHP', symbol: '₱', name: 'Philippine Peso', locale: 'en-PH' },
  THB: { code: 'THB', symbol: '฿', name: 'Thai Baht', locale: 'th-TH' },
  IDR: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', locale: 'id-ID' },
  KRW: { code: 'KRW', symbol: '₩', name: 'South Korean Won', locale: 'ko-KR' },
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', locale: 'ar-AE' },
  SAR: { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', locale: 'ar-SA' },
}

/**
 * Format a number as currency
 */
export function formatCurrency(amount: number, currencyCode: string = 'USD'): string {
  const currency = CURRENCIES[currencyCode] || CURRENCIES.USD
  
  // For currencies without decimals (like JPY), don't show decimal places
  const showDecimals = !['JPY', 'KRW', 'VND'].includes(currencyCode)
  
  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount)
}

/**
 * Format a number with currency symbol (simpler format)
 */
export function formatCurrencySimple(amount: number, currencyCode: string = 'USD'): string {
  const currency = CURRENCIES[currencyCode] || CURRENCIES.USD
  
  // For currencies without decimals (like JPY), don't show decimal places
  const showDecimals = !['JPY', 'KRW', 'VND'].includes(currencyCode)
  
  const formatted = new Intl.NumberFormat(currency.locale, {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount)
  
  // Add currency symbol based on locale
  if (currency.symbol === '$' && currencyCode !== 'USD') {
    // Handle currencies that use $ but need prefix (CAD, AUD, etc.)
    return `${currency.symbol}${formatted}`
  }
  
  // For most currencies, symbol comes before
  if (['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'INR', 'BRL', 'MXN', 'ZAR', 'SGD', 'HKD', 'PHP', 'THB', 'IDR', 'KRW'].includes(currencyCode)) {
    return `${currency.symbol}${formatted}`
  }
  
  // For some currencies, symbol comes after
  return `${formatted} ${currency.symbol}`
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currencyCode: string = 'USD'): string {
  const currency = CURRENCIES[currencyCode] || CURRENCIES.USD
  return currency.symbol
}

/**
 * Get currency name
 */
export function getCurrencyName(currencyCode: string = 'USD'): string {
  const currency = CURRENCIES[currencyCode] || CURRENCIES.USD
  return currency.name
}

/**
 * Get all available currencies
 */
export function getAvailableCurrencies() {
  return Object.values(CURRENCIES).map((currency) => ({
    code: currency.code,
    symbol: currency.symbol,
    name: currency.name,
  }))
}






