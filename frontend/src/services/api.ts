import axios from 'axios'
import { clearAuth, loadAuth, type StoredUser } from './authStorage'

/** Shape of the response from GET /api/health. */
export interface HealthResponse {
  status: string
}

/** Shape of POST /api/auth/register and POST /api/auth/login responses. */
export interface AuthResponse {
  token: string
  tokenType: string
  user: StoredUser
}

/**
 * Shared Axios instance.
 *
 * baseURL is relative ("/api") so it works everywhere:
 * - local dev: the Vite dev server proxies /api/* to http://localhost:8080
 * - production: the SPA is served by Spring Boot itself, same origin
 */
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach "Authorization: Bearer <token>" to every outgoing request when a
// session exists.
api.interceptors.request.use((config) => {
  const auth = loadAuth()
  if (auth?.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  return config
})

// On 401, drop the stored session and bounce to /login. Auth endpoints
// themselves legitimately return 401 for bad credentials, so they are exempt.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string = error.config?.url ?? ''
    if (error.response?.status === 401 && !url.startsWith('/auth/')) {
      clearAuth()
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  },
)

/** Fetches the backend health status. */
export async function getHealth(): Promise<HealthResponse> {
  const { data } = await api.get<HealthResponse>('/health')
  return data
}

/** Signs in with email + password, returning the JWT and user profile. */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password })
  return data
}

/** Creates an account, returning the JWT and user profile. */
export async function register(
  name: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', { name, email, password })
  return data
}

/** Fetches the signed-in user's profile (proves the Bearer header works). */
export async function getMe(): Promise<StoredUser> {
  const { data } = await api.get<StoredUser>('/users/me')
  return data
}

/** Extracts a human-readable message from an unknown error (e.g. an axios 4xx). */
export function getErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined
    if (data?.message) return data.message
  }
  if (err instanceof Error && err.message) return err.message
  return fallback
}

export default api
