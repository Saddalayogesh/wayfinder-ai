import axios from 'axios'

/** Shape of the response from GET /api/health. */
export interface HealthResponse {
  status: string
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

/** Fetches the backend health status. */
export async function getHealth(): Promise<HealthResponse> {
  const { data } = await api.get<HealthResponse>('/health')
  return data
}

export default api
