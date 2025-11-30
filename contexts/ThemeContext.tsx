'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { useTheme as useNextTheme } from 'next-themes'
import { settingsService } from '@/lib/api/services'

interface ThemeContextType {
  theme: string
  setTheme: (theme: string) => Promise<void>
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeContextProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const { theme: nextTheme, setTheme: setNextTheme } = useNextTheme()
  const [theme, setThemeState] = useState<string>('system')
  const [isLoading, setIsLoading] = useState(true)

  // Load theme preference from settings
  useEffect(() => {
    const loadTheme = async () => {
      if (!isAuthenticated) {
        // Default to system for non-authenticated users
        setThemeState('system')
        setIsLoading(false)
        return
      }

      try {
        const settings = await settingsService.getSettings()
        const userTheme = settings.personalization?.theme || 'system'
        setThemeState(userTheme)
        // Apply theme if it's different from current
        if (nextTheme !== userTheme) {
          setNextTheme(userTheme)
        }
      } catch (error) {
        // Default to system on error
        setThemeState('system')
      } finally {
        setIsLoading(false)
      }
    }

    loadTheme()
  }, [isAuthenticated, user, nextTheme, setNextTheme])

  const setTheme = async (newTheme: string) => {
    try {
      // Update local state immediately for responsive UI
      setThemeState(newTheme)
      // Apply theme immediately
      setNextTheme(newTheme)
      
      // Update backend if authenticated
      if (isAuthenticated) {
        await settingsService.updateSettings({
          personalization: {
            theme: newTheme,
          },
        })
      }
    } catch (error) {
      // Revert on error
      setThemeState(theme)
      setNextTheme(theme)
      throw error
    }
  }

  const value: ThemeContextType = {
    theme,
    setTheme,
    isLoading,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useThemeContext() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeContextProvider')
  }
  return context
}











