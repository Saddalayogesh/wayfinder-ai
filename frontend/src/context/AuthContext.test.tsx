import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from './AuthContext'
import type { AuthResponse } from '../services/api'

// The AuthContext reaches the real backend through services/api — mock the
// module so no network request ever leaves the test process.
vi.mock('../services/api', () => ({
  login: vi.fn(),
  register: vi.fn(),
}))

import * as api from '../services/api'

const mockLogin = vi.mocked(api.login)

const authResponse: AuthResponse = {
  token: 'jwt.test-token',
  tokenType: 'Bearer',
  user: { id: 7, name: 'Ada Lovelace', email: 'ada@example.com', role: 'USER' },
}

/** Reads the context state into data-testid attributes so tests can assert on it. */
function Probe() {
  const { user, isAuthenticated, token, login, logout } = useAuth()
  return (
    <div>
      <p data-testid="authenticated">{String(isAuthenticated)}</p>
      <p data-testid="email">{user?.email ?? 'signed-out'}</p>
      <p data-testid="token">{token ?? 'no-token'}</p>
      <button onClick={() => login('ada@example.com', 'password123').catch(() => {})}>
        Sign in
      </button>
      <button onClick={logout}>Sign out</button>
    </div>
  )
}

describe('AuthContext', () => {
  it('starts signed out with no stored session', () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
    expect(screen.getByTestId('email')).toHaveTextContent('signed-out')
    expect(screen.getByTestId('token')).toHaveTextContent('no-token')
  })

  it('login stores the session in state and localStorage; logout clears both', async () => {
    mockLogin.mockResolvedValue(authResponse)
    const user = userEvent.setup()
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() =>
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true'),
    )
    expect(screen.getByTestId('email')).toHaveTextContent('ada@example.com')
    expect(screen.getByTestId('token')).toHaveTextContent('jwt.test-token')
    expect(mockLogin).toHaveBeenCalledWith('ada@example.com', 'password123')
    expect(localStorage.getItem('wayfinder_ai_auth')).toContain('jwt.test-token')

    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    await waitFor(() =>
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false'),
    )
    expect(screen.getByTestId('email')).toHaveTextContent('signed-out')
    expect(screen.getByTestId('token')).toHaveTextContent('no-token')
    expect(localStorage.getItem('wayfinder_ai_auth')).toBeNull()
  })

  it('login failure does not mark the user as authenticated', async () => {
    mockLogin.mockRejectedValue(new Error('Bad credentials'))
    const user = userEvent.setup()
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByTestId('authenticated')).toHaveTextContent('false')
    expect(screen.getByTestId('email')).toHaveTextContent('signed-out')
  })
})
