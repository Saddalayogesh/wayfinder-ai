import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage, getMe, updateMe } from '../services/api'
import Badge from '../components/common/Badge'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import Input from '../components/common/Input'
import ErrorState from '../components/common/ErrorState'
import Skeleton from '../components/common/Skeleton'

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
      <main className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <Skeleton className="h-8 w-48" />
        <div className="mt-6 space-y-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </main>
    )
  }

  if (state === 'error') {
    return (
      <main className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <ErrorState message={loadError ?? ''} onRetry={() => window.location.reload()} />
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Profile</h1>
      <p className="mt-1 text-sm text-slate-500">
        Manage your account details and password.
      </p>

      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white">
          {(user?.name ?? '?').charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{user?.name}</p>
          <p className="truncate text-sm text-slate-500">{user?.email}</p>
        </div>
        <Badge color={user?.role === 'ADMIN' ? 'violet' : 'indigo'} className="ml-auto shrink-0">
          {user?.role ?? 'USER'}
        </Badge>
      </div>

      {/* Name */}
      <Card className="mt-6 p-6">
        <h2 className="text-lg font-bold text-slate-900">Display name</h2>
        <p className="mt-1 text-sm text-slate-500">How your name appears across the app.</p>
        <form onSubmit={handleNameSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="Name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setNameDone(false)
              }}
              error={nameError}
              maxLength={100}
              required
            />
          </div>
          <Button type="submit" loading={nameSaving}>
            Save name
          </Button>
        </form>
        {nameDone && <p className="mt-3 text-sm text-emerald-600">Name updated ✅</p>}
      </Card>

      {/* Password */}
      <Card className="mt-6 p-6">
        <h2 className="text-lg font-bold text-slate-900">Change password</h2>
        <p className="mt-1 text-sm text-slate-500">
          Choose a strong password you haven't used before.
        </p>
        <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
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
          <div className="grid gap-4 sm:grid-cols-2">
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
            <p role="alert" className="text-sm text-rose-600">
              {pwError}
            </p>
          )}
          {pwDone && <p className="text-sm text-emerald-600">Password updated ✅</p>}
          <Button
            type="submit"
            loading={pwSaving}
            disabled={!currentPassword || !newPassword || !confirmPassword}
          >
            Update password
          </Button>
        </form>
      </Card>
    </main>
  )
}
