import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage, getMe, updateMe } from '../services/api'
import Badge from '../components/common/Badge'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import ErrorState from '../components/common/ErrorState'
import Skeleton from '../components/common/Skeleton'
import { KeyRound, Pencil, UserRound } from 'lucide-react'

type LoadState = 'loading' | 'ready' | 'error'

export default function Profile() {
  const { user, updateUser } = useAuth()

  const [state, setState] = useState<LoadState>('loading')
  const [loadError, setLoadError] = useState<string | null>(null)

  const [name, setName] = useState(user?.name ?? '')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [nameDone, setNameDone] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwDone, setPwDone] = useState(false)

  useEffect(() => {
    getMe()
      .then((me) => {
        setName(me.name)
        setState('ready')
      })
      .catch((err) => {
        setLoadError(getErrorMessage(err, 'Could not load your profile.'))
        setState('error')
      })
  }, [])

  const handleNameSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!name.trim()) return
    setNameSaving(true)
    setNameError(null)
    setNameDone(false)
    try {
      const updated = await updateMe({ name: name.trim() })
      updateUser(updated)
      setNameDone(true)
    } catch (err) {
      setNameError(getErrorMessage(err, 'Could not update your name.'))
    } finally {
      setNameSaving(false)
    }
  }

  const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPwError(null)
    setPwDone(false)
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.')
      return
    }
    setPwSaving(true)
    try {
      await updateMe({
        name: user?.name ?? name,
        currentPassword,
        newPassword,
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPwDone(true)
    } catch (err) {
      setPwError(getErrorMessage(err, 'Could not change your password.'))
    } finally {
      setPwSaving(false)
    }
  }

  if (state === 'loading') {
    return (
      <main className="mx-auto max-w-lg px-4 py-20 sm:px-6">
        <Skeleton className="h-10 w-40" />
        <div className="panel mt-8 p-8">
          <div className="flex flex-col items-center">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="mt-4 h-5 w-40" />
          </div>
          <Skeleton className="mt-8 h-20 rounded-xl" />
          <Skeleton className="mt-6 h-20 rounded-xl" />
          <Skeleton className="mt-6 h-20 rounded-xl" />
        </div>
      </main>
    )
  }

  if (state === 'error') {
    return (
      <main className="mx-auto max-w-lg px-4 py-20 sm:px-6">
        <ErrorState message={loadError ?? ''} onRetry={() => window.location.reload()} />
      </main>
    )
  }

  const initials = (user?.name ?? '?').charAt(0).toUpperCase()

  return (
    <main className="mx-auto max-w-lg px-4 py-20 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Account</p>
      <h1 className="mt-3 font-display text-4xl font-normal tracking-tight text-text">
        Profile
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Manage your account details and password.
      </p>

      <div className="panel mt-8 p-8 sm:p-10">
        {/* Avatar — large, with a hover edit overlay that jumps to the name field. */}
        <div className="flex flex-col items-center text-center">
          <div className="group relative">
            <span className="btn-primary-bg flex h-20 w-20 items-center justify-center rounded-full font-display text-3xl font-semibold text-white shadow-glow ring-2 ring-primary/30">
              {initials}
            </span>
            <button
              type="button"
              onClick={() => document.getElementById('profile-name')?.focus()}
              aria-label="Edit display name"
              className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60 text-text opacity-0 backdrop-blur-sm transition-opacity duration-200 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 dark:text-white"
            >
              <Pencil size={18} aria-hidden="true" />
            </button>
          </div>
          <p className="mt-4 font-semibold text-text">{user?.name}</p>
          <p className="mt-0.5 text-sm text-muted">{user?.email}</p>
          <Badge color={user?.role === 'ADMIN' ? 'violet' : 'primary'} className="mt-3">
            {user?.role ?? 'USER'}
          </Badge>
        </div>

        {/* ---- Account ---- */}
        <section className="mt-9">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <UserRound size={19} aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-xl font-normal tracking-tight text-text">
                Account
              </h2>
              <p className="mt-0.5 text-sm text-muted">How your name appears across the app.</p>
            </div>
          </div>
          <form onSubmit={handleNameSubmit} className="mt-6">
            <Input
              id="profile-name"
              label="Display name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setNameDone(false)
              }}
              error={nameError}
              maxLength={100}
              required
            />
            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-sm text-accent">{nameDone ? 'Name updated ✓' : ''}</p>
              <Button type="submit" loading={nameSaving}>
                Save name
              </Button>
            </div>
          </form>
        </section>

        <div aria-hidden="true" className="divider my-9" />

        {/* ---- Security ---- */}
        <section>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <KeyRound size={19} aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-xl font-normal tracking-tight text-text">
                Security
              </h2>
              <p className="mt-0.5 text-sm text-muted">
                Choose a strong password you haven't used before.
              </p>
            </div>
          </div>
          <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-5">
            <Input
              label="Current password"
              type="password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value)
                setPwDone(false)
              }}
              autoComplete="current-password"
              required
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="New password"
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  setPwDone(false)
                }}
                hint="At least 8 characters"
                autoComplete="new-password"
                minLength={8}
                required
              />
              <Input
                label="Confirm new password"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  setPwDone(false)
                }}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            {pwError && (
              <p role="alert" className="text-sm text-error">
                {pwError}
              </p>
            )}
            {pwDone && <p className="text-sm text-accent">Password updated ✓</p>}
            <Button
              type="submit"
              loading={pwSaving}
              disabled={!currentPassword || !newPassword || !confirmPassword}
            >
              Update password
            </Button>
          </form>
        </section>
      </div>
    </main>
  )
}
