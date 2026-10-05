import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { AuthContext } from './auth-context'
import { ApiError, authApi, authStorage, type User } from '../services/api'

let refreshInFlight: ReturnType<typeof authApi.refresh> | null = null

function refreshSession(refreshToken: string) {
  if (!refreshInFlight) {
    refreshInFlight = authApi.refresh(refreshToken).finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const loadSession = useCallback(async () => {
    const stored = authStorage.read()
    if (!stored) {
      setLoading(false)
      return
    }

    try {
      setUser(await authApi.me(stored.accessToken))
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) {
        setLoading(false)
        throw error
      }
      try {
        const refreshed = await refreshSession(stored.refreshToken)
        const persistent = localStorage.getItem('citas.auth') !== null
        authStorage.save(refreshed, persistent)
        setUser(await authApi.me(refreshed.accessToken))
      } catch (refreshError) {
        if (refreshError instanceof ApiError && refreshError.status === 401) {
          authStorage.clear()
          setUser(null)
          return
        }
        throw refreshError
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSession().catch((error: unknown) => {
      console.error('Unable to restore authentication session', error)
    })
  }, [loadSession])

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    const tokens = await authApi.login(email, password)
    authStorage.save(tokens, remember)
    try {
      setUser(await authApi.me(tokens.accessToken))
    } catch (error) {
      authStorage.clear()
      throw error
    }
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    await authApi.register(name, email, password)
  }, [])

  const logout = useCallback(async () => {
    const tokens = authStorage.read()
    try {
      if (tokens) await authApi.logout(tokens.refreshToken)
    } finally {
      authStorage.clear()
      setUser(null)
    }
  }, [])

  const value = useMemo(() => ({ user, loading, login, register, logout }), [
    user,
    loading,
    login,
    register,
    logout,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
