import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import { useAuth } from '../context/AuthContext'

// ProtectedRoute consumes the auth state via the context hook — mock just that
// hook so each test can control the auth state directly.
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const mockedUseAuth = vi.mocked(useAuth)

/** A fully-typed fake auth state — structural typing keeps it type-checked. */
function authState(isAuthenticated: boolean) {
  return {
    user: null,
    token: null,
    isAuthenticated,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
  }
}

/** Renders the redirect target's location.state.from, proving the source route is remembered. */
function LoginProbe() {
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? 'no-from'
  return <p data-testid="from">{from}</p>
}

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to /login, remembering the source route', () => {
    mockedUseAuth.mockReturnValue(authState(false))
    render(
      <MemoryRouter initialEntries={['/trips/42']}>
        <Routes>
          <Route
            path="/trips/:id"
            element={
              <ProtectedRoute>
                <p>Secret trip page</p>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginProbe />} />
        </Routes>
      </MemoryRouter>,
    )

    // The protected content must never render…
    expect(screen.queryByText('Secret trip page')).not.toBeInTheDocument()
    // …and the login page receives the original path as redirect state.
    expect(screen.getByTestId('from')).toHaveTextContent('/trips/42')
  })

  it('renders its children when the user is authenticated', () => {
    mockedUseAuth.mockReturnValue(authState(true))
    render(
      <MemoryRouter initialEntries={['/trips/42']}>
        <Routes>
          <Route
            path="/trips/:id"
            element={
              <ProtectedRoute>
                <p>Secret trip page</p>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginProbe />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Secret trip page')).toBeInTheDocument()
    expect(screen.queryByTestId('from')).not.toBeInTheDocument()
  })
})
