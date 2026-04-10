'use client'

import { createContext, createElement, useContext, useState, useEffect, type ReactNode } from 'react'
import { useLocalStorage } from '@/hooks/use-local-storage'
import type { User } from './types'
import { login as apiLogin, getUserById } from './api'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [savedUserId, setSavedUserId] = useLocalStorage<string | null>('userId', null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!savedUserId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    // Check for saved session
    getUserById(savedUserId)
      .then(user => {
        setUser(user)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [savedUserId])

  const login = async (email: string, password: string): Promise<boolean> => {
    const user = await apiLogin(email, password)
    if (user) {
      setUser(user)
      setSavedUserId(user.id)
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    setSavedUserId(null)
  }

  return createElement(
    AuthContext.Provider,
    { value: { user, isLoading, login, logout } },
    children
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
