export type Role = 'USER' | 'ADMIN'

/** User profile as returned by the backend (safe subset, no password). */
export interface StoredUser {
  id: number
  name: string
  email: string
  role: Role
}

/** The persisted session: the JWT plus the user it belongs to. */
export interface StoredAuth {
  token: string
  user: StoredUser
}

const AUTH_KEY = 'wayfinder_ai_auth'

/** Reads the persisted session, returning null when absent or malformed. */
export function loadAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredAuth
    if (!parsed.token || !parsed.user) return null
    return parsed
  } catch {
    return null
  }
}

export function saveAuth(auth: StoredAuth): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth))
}

export function clearAuth(): void {
  localStorage.removeItem(AUTH_KEY)
}
