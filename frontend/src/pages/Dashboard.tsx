import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage, getMe } from '../services/api'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'
import { ArrowRight, Compass, LogOut } from 'lucide-react'

type ApiCheck = 'loading' | 'ok' | 'error'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState<{ name: string; email: string; role: string } | null>(null)
  const [check, setCheck] = useState<ApiCheck>('loading')
  const [checkError, setCheckError] = useState<string | null>(null)

  useEffect(() => {
    // Calls GET /api/users/me with the Bearer token attached by the axios
    // interceptor — proves the protected backend route accepts our JWT.
    getMe()
      .then((me) => {
        setProfile(me)
        setCheck('ok')
      })
      .catch((err) => {
        setCheckError(getErrorMessage(err))
        setCheck('error')
      })
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const firstName = user?.name.split(' ')[0] ?? 'there'

  return (
    <main className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
      <div className="panel p-7 sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <span className="btn-primary-bg flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white ring-2 ring-primary/30">
              {(user?.name ?? '?').charAt(0).toUpperCase()}
            </span>
            <div>
              <h1 className="font-display text-3xl font-normal tracking-tight text-text sm:text-4xl">
                Welcome back, {firstName}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Here's a snapshot of your travel planning.
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut size={16} aria-hidden="true" />
            Sign out
          </Button>
        </div>

        <dl className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-background/40 p-5 transition-colors duration-200 hover:border-primary/25">
            <dt className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Name</dt>
            <dd className="mt-2 truncate text-lg font-medium text-text">{user?.name}</dd>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/40 p-5 transition-colors duration-200 hover:border-primary/25">
            <dt className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Email</dt>
            <dd className="mt-2 truncate text-lg font-medium text-text">{user?.email}</dd>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/40 p-5 transition-colors duration-200 hover:border-primary/25">
            <dt className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Role</dt>
            <dd className="mt-2">
              <Badge color={user?.role === 'ADMIN' ? 'violet' : 'primary'}>
                {user?.role ?? 'USER'}
              </Badge>
            </dd>
          </div>
        </dl>

        {/* Shortcut into trip management */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary/10 p-6">
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Compass size={22} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-text">Plan a trip</h2>
              <p className="mt-0.5 text-sm text-muted">
                Create and manage your trips, or let AI draft the whole itinerary.
              </p>
            </div>
          </div>
          <Link to="/trips/new">
            <Button>
              Plan my trip
              <ArrowRight size={16} aria-hidden="true" />
            </Button>
          </Link>
        </div>

        {/* Live check that the JWT authenticates against the backend */}
        <div className="mt-8 rounded-xl border border-border/60 bg-background/40 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 rounded-full ${
                check === 'ok'
                  ? 'bg-success'
                  : check === 'error'
                    ? 'bg-error'
                    : 'bg-amber-400 animate-pulse'
              }`}
            />
            <h2 className="text-sm font-semibold text-text">Protected API check</h2>
            <span className="ml-auto font-mono text-xs text-muted">GET /api/users/me</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {check === 'loading' && 'Verifying your JWT against the backend…'}
            {check === 'ok' && (
              <>
                Authenticated as{' '}
                <span className="font-medium text-text">{profile?.email}</span> — your Bearer
                token was accepted.
              </>
            )}
            {check === 'error' && (
              <span className="text-error">The authenticated request failed: {checkError}</span>
            )}
          </p>
        </div>
      </div>
    </main>
  )
}
