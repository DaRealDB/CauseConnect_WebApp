'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService } from '@/lib/api/services'
import { apiClient } from '@/lib/api/client'
import type { User } from '@/lib/api/types'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (emailOrUsername: string, password: string) => Promise<void>
  register: (data: {
    firstName: string
    lastName: string
    username: string
    email: string
    password: string
    confirmPassword: string
  }) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      // Wait a bit for localStorage to be fully available (SSR safety)
      await new Promise(resolve => setTimeout(resolve, 0))
      
      const token = apiClient.getToken()
      if (token) {
        try {
          const currentUser = await authService.getCurrentUser()
          setUser(currentUser)
        } catch (error: any) {
          // Only clear token and user on 401 (unauthorized) errors
          // Don't log out on network errors (status 0) or other non-auth errors
          if (error?.status === 401) {
            console.log('[AuthContext] Token invalid or expired (401), logging out')
            apiClient.removeToken()
            setUser(null)
          } else if (error?.status === 0) {
            // Network error - keep token and don't log out
            // The user might be offline or backend is temporarily unavailable
            console.warn('[AuthContext] Network error during auth check, keeping session alive')
            // Keep the token - user stays logged in
          } else {
            // Other error (500, 404, etc.) - don't log out
            console.warn('[AuthContext] Error verifying user, but keeping session:', error?.status, error?.message)
            // Keep the token - don't log out on server errors
          }
        }
      } else {
        // No token found - user is not logged in
        setUser(null)
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (emailOrUsername: string, password: string) => {
    const response = await authService.login({ emailOrUsername, password })
    setUser(response.user)
  }

  const register = async (data: {
    firstName: string
    lastName: string
    username: string
    email: string
    password: string
    confirmPassword: string
  }) => {
    const response = await authService.register(data)
    setUser(response.user)
  }

  const logout = () => {
    authService.logout()
    setUser(null)
  }

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
    } catch (error: any) {
      // Only clear user if it's a 401 (unauthorized) error
      // Other errors (network, etc.) should not log the user out
      if (error?.status === 401) {
        setUser(null)
      } else {
        // For other errors, keep the current user but log the error
        console.error("Failed to refresh user:", error)
        // Don't clear user on network errors or other non-auth errors
      }
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}


