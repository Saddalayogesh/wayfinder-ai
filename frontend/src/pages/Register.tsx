import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../services/api'
import Button from '../components/common/Button'
import BrandMark from '../components/common/BrandMark'
import AuthLayout from '../components/AuthLayout'

const inputClass = 'input mt-2'

export default function Register() {
  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Already signed in? Go straight to the dashboard.
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await register(name, email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      image="/images/auth-resort.jpg"
      quote="“Adventure is worthwhile in itself.”"
      attribution="— Amelia Earhart"
    >
      <form onSubmit={handleSubmit} className="panel p-7 sm:p-10">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <BrandMark size={26} />
        </span>
        <h1 className="mt-6 font-display text-3xl font-normal tracking-tight text-text">
          Create your account
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Start planning trips with AI in minutes.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-error/25 bg-error/10 px-4 py-3 text-sm text-error"
          >
            {error}
          </div>
        )}

        <label
          className="mt-7 block text-[13px] font-medium tracking-[0.02em] text-muted"
          htmlFor="name"
        >
          Full name
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          placeholder="Jane Doe"
          autoComplete="name"
        />

        <label
          className="mt-6 block text-[13px] font-medium tracking-[0.02em] text-muted"
          htmlFor="email"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          placeholder="you@example.com"
          autoComplete="email"
        />

        <label
          className="mt-6 block text-[13px] font-medium tracking-[0.02em] text-muted"
          htmlFor="password"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />

        <Button type="submit" size="lg" loading={submitting} className="mt-8 w-full">
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-accent transition-colors duration-200 hover:text-accent/80"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
