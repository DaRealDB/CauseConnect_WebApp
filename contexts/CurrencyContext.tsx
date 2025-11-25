'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { settingsService } from '@/lib/api/services'
import { formatCurrency, formatCurrencySimple, getCurrencySymbol, CURRENCIES } from '@/lib/utils/currency'

interface CurrencyContextType {
  currency: string
  setCurrency: (currency: string) => Promise<void>
  refreshCurrency: () => Promise<void>
  formatAmount: (amount: number) => string
  formatAmountSimple: (amount: number) => string
  getSymbol: () => string
  isLoading: boolean
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [currency, setCurrencyState] = useState<string>('USD')
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  // Load currency preference from settings
  useEffect(() => {
    const loadCurrency = async () => {
      if (!isAuthenticated) {
        // Default to USD for non-authenticated users
        setCurrencyState('USD')
        setIsLoading(false)
        return
      }

      try {
        const settings = await settingsService.getSettings()
        const userCurrency = settings.personalization?.currency || 'USD'
        setCurrencyState(userCurrency)
      } catch (error) {
        // Default to USD on error
        setCurrencyState('USD')
      } finally {
        setIsLoading(false)
      }
    }

    loadCurrency()
  }, [isAuthenticated, user, refreshKey])

  const setCurrency = async (newCurrency: string) => {
    try {
      // Update local state immediately for responsive UI
      setCurrencyState(newCurrency)
      
      // Update backend if authenticated
      if (isAuthenticated) {
        await settingsService.updateSettings({
          personalization: {
            currency: newCurrency,
          },
        })
        // Trigger refresh to ensure consistency
        setRefreshKey(prev => prev + 1)
      }
    } catch (error) {
      // Revert on error
      setCurrencyState(currency)
      throw error
    }
  }

  const refreshCurrency = async () => {
    if (!isAuthenticated) return
    
    try {
      const settings = await settingsService.getSettings()
      const userCurrency = settings.personalization?.currency || 'USD'
      setCurrencyState(userCurrency)
    } catch (error) {
      console.error('Failed to refresh currency:', error)
    }
  }

  const formatAmount = (amount: number): string => {
    return formatCurrency(amount, currency)
  }

  const formatAmountSimple = (amount: number): string => {
    return formatCurrencySimple(amount, currency)
  }

  const getSymbol = (): string => {
    return getCurrencySymbol(currency)
  }

  const value: CurrencyContextType = {
    currency,
    setCurrency,
    refreshCurrency,
    formatAmount,
    formatAmountSimple,
    getSymbol,
    isLoading,
  }

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}

