import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import api, { clearAuthToken, saveAuthToken, TOKEN_STORAGE_KEY } from '../services/api.js'

export const AUTH_USER_STORAGE_KEY = 'vestora-user'

const AuthContext = createContext(null)

function toPublicUser(user) {
  if (
    !user
    || !['string', 'number'].includes(typeof user.id)
    || typeof user.name !== 'string'
    || typeof user.email !== 'string'
    || !['customer', 'admin'].includes(user.role)
  ) {
    throw new Error('The authentication response did not contain a valid user profile.')
  }

  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    role: user.role,
    ...(typeof user.createdAt === 'string' ? { createdAt: user.createdAt } : {}),
  }
}

function readStoredUser() {
  try {
    if (!sessionStorage.getItem(TOKEN_STORAGE_KEY)) return null
    const stored = sessionStorage.getItem(AUTH_USER_STORAGE_KEY)
    return stored ? toPublicUser(JSON.parse(stored)) : null
  } catch {
    return null
  }
}

function persistUser(userData) {
  const user = toPublicUser(userData)
  try {
    sessionStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user))
  } catch (cause) {
    const error = new Error('Your account was verified, but this browser could not save the session profile.')
    error.cause = cause
    throw error
  }
  return user
}

function clearStoredUser() {
  try {
    sessionStorage.removeItem(AUTH_USER_STORAGE_KEY)
  } catch {
    return false
  }
  return true
}

export function AuthProvider({ children }) {
  const requestId = useRef(0)
  const [user, setUser] = useState(readStoredUser)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    let active = true
    const currentRequestId = ++requestId.current

    async function restoreSession() {
      try {
        const token = sessionStorage.getItem(TOKEN_STORAGE_KEY)
        if (!token) {
          clearStoredUser()
          if (active && requestId.current === currentRequestId) setUser(null)
          return
        }

        const result = await api.get('/auth/me')
        const savedUser = persistUser(result?.user)
        if (active && requestId.current === currentRequestId) {
          setUser(savedUser)
          setAuthError('')
        }
      } catch (error) {
        if (!active || requestId.current !== currentRequestId) return

        if (error.status === 401) {
          try {
            clearAuthToken()
          } catch {
            setAuthError('Your saved session expired, but this browser could not clear it. Please close and reopen this tab.')
          }
          clearStoredUser()
          setUser(null)
        } else {
          setUser(readStoredUser())
          setAuthError(`We could not verify your saved session. ${error.message || 'Please try again.'}`)
        }
      } finally {
        if (active && requestId.current === currentRequestId) setIsLoading(false)
      }
    }

    restoreSession()
    return () => {
      active = false
    }
  }, [])

  const authenticate = useCallback(async (endpoint, credentials) => {
    const currentRequestId = ++requestId.current
    setIsLoading(false)
    setIsAuthenticating(true)
    setAuthError('')

    try {
      const result = await api.post(endpoint, credentials)
      if (!result?.token || !result?.user) {
        throw new Error('The server returned an incomplete authentication response.')
      }

      const safeUser = toPublicUser(result.user)
      try {
        saveAuthToken(result.token)
        sessionStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(safeUser))
      } catch (cause) {
        try {
          clearAuthToken()
          sessionStorage.removeItem(AUTH_USER_STORAGE_KEY)
        } catch {
          // The original storage error is the actionable failure.
        }
        const error = new Error('Sign-in succeeded, but this browser could not save your session. Enable session storage and try again.')
        error.cause = cause
        throw error
      }

      setUser(safeUser)
      setIsLoading(false)
      return safeUser
    } finally {
      if (requestId.current === currentRequestId) setIsAuthenticating(false)
    }
  }, [])

  const login = useCallback(
    (credentials) => authenticate('/auth/login', credentials),
    [authenticate],
  )

  const register = useCallback(
    (details) => authenticate('/auth/register', details),
    [authenticate],
  )

  const logout = useCallback(() => {
    requestId.current += 1
    let failedToClearToken = false

    try {
      clearAuthToken()
    } catch {
      failedToClearToken = true
    }
    const userCleared = clearStoredUser()

    setUser(null)
    setIsLoading(false)
    setAuthError(
      failedToClearToken || !userCleared
        ? 'You are signed out, but this browser could not fully clear the saved session. Please close and reopen this tab.'
        : '',
    )
  }, [])

  const clearAuthError = useCallback(() => setAuthError(''), [])
  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      isAuthenticating,
      authError,
      login,
      register,
      logout,
      clearAuthError,
    }),
    [user, isLoading, isAuthenticating, authError, login, register, logout, clearAuthError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
