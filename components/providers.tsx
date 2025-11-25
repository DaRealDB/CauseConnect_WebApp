'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { CurrencyProvider } from '@/contexts/CurrencyContext'
import { ThemeContextProvider } from '@/contexts/ThemeContext'
import { ThemeProvider } from '@/components/theme-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ThemeContextProvider>
          <CurrencyProvider>{children}</CurrencyProvider>
        </ThemeContextProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}





