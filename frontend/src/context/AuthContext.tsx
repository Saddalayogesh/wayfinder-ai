import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { clearAuth, loadAuth, saveAuth, type StoredAuth, type StoredUser } from '../services/authStorage'
import * as api from '../services/api'

interface AuthContextValue {
  /** The signed-in user, or null when logged out. */
  user: StoredUser | null
  /** The raw JWT, or null when logged out. */
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<StoredAuth | null>(() => loadAuth())

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.login(email, password)
    const next: StoredAuth = { token: response.token, user: response.user }
    saveAuth(next)
    setAuth(next)
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const response = await api.register(name, email, password)
    const next: StoredAuth = { token: response.token, user: response.user }
    saveAuth(next)
    setAuth(next)
  }, [])

  const logout = useCallback(() => {
    clearAuth()
    setAuth(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: auth?.user ?? null,
      token: auth?.token ?? null,
      isAuthenticated: auth !== null,
      login,
      register,
      logout,
    }),
    [auth, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>')
  }
  return ctx
}
