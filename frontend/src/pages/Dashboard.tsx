import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage, getMe } from '../services/api'

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
  const roleBadge =
    user?.role === 'ADMIN'
      ? 'bg-violet-100 text-violet-700'
      : 'bg-indigo-100 text-indigo-700'

  return (
    <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Welcome back, {firstName} 👋
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              This is your dashboard — trip planning features land here in the next phase.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Sign out
          </button>
        </div>

        <dl className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Name</dt>
            <dd className="mt-1 truncate text-sm font-semibold text-slate-900">{user?.name}</dd>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</dt>
            <dd className="mt-1 truncate text-sm font-semibold text-slate-900">{user?.email}</dd>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Role</dt>
            <dd className="mt-1">
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleBadge}`}>
                {user?.role ?? '—'}
              </span>
            </dd>
          </div>
        </dl>

        {/* Live check that the JWT authenticates against the backend */}
        <div className="mt-8 rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 rounded-full ${
                check === 'ok'
                  ? 'bg-emerald-500'
                  : check === 'error'
                    ? 'bg-rose-500'
                    : 'bg-amber-400 animate-pulse'
              }`}
            />
            <h2 className="text-sm font-semibold text-slate-900">Protected API check</h2>
            <span className="ml-auto font-mono text-xs text-slate-400">GET /api/users/me</span>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            {check === 'loading' && 'Verifying your JWT against the backend…'}
            {check === 'ok' && (
              <>
                Authenticated as{' '}
                <span className="font-semibold text-slate-900">{profile?.email}</span> — your Bearer
                token was accepted. ✅
              </>
            )}
            {check === 'error' && (
              <span className="text-rose-600">
                The authenticated request failed: {checkError}
              </span>
            )}
          </p>
        </div>
      </div>
    </main>
  )
}
