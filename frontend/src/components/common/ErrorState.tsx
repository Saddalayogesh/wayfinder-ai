import { useEffect, useState, type ReactNode } from 'react'
import Button from './Button'
import { cn } from '../../utils/cn'

export interface ErrorStateProps {
  /** Human-readable message from the failed API call. */
  message: string
  /** HTTP status when available (404, 403, …) — drives the icon and headline. */
  status?: number | null
  onRetry?: () => void
  className?: string
}

function headlineFor(status: number | null | undefined, message: string): { icon: string; title: string; description: ReactNode } {
  if (status === 404) {
    return {
      icon: '🧭',
      title: "We couldn't find that",
      description: 'It may have been moved or deleted.',
    }
  }
  if (status === 403) {
    return {
      icon: '🔒',
      title: 'You do not have access',
      description: 'This resource belongs to another account.',
    }
  }
  if (status == null || status >= 500 || message.toLowerCase().includes('network')) {
    return {
      icon: '📡',
      title: 'Network hiccup',
      description: 'We could not reach the server. Check your connection and try again.',
    }
  }
  return {
    icon: '⚠️',
    title: 'Something went wrong',
    description: message,
  }
}

export default function ErrorState({ message, status, onRetry, className }: ErrorStateProps) {
  const [visible, setVisible] = useState(false)

  // Small entrance animation (respects reduced motion via Tailwind's motion-safe).
  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 10)
    return () => window.clearTimeout(t)
  }, [])

  const { icon, title, description } = headlineFor(status, message)

  return (
    <div
      role="alert"
      className={cn(
        'mx-auto max-w-md rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm transition-all duration-300',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        className,
      )}
    >
      <div className="text-4xl" aria-hidden="true">
        {icon}
      </div>
      <h2 className="mt-4 text-lg font-bold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">
        {description}
        {message && !(status === 404 || status === 403) && (
          <span className="mt-2 block text-xs text-slate-400">{message}</span>
        )}
      </p>
      {onRetry && (
        <Button variant="secondary" size="md" onClick={onRetry} className="mt-6">
          Try again
        </Button>
      )}
    </div>
  )
}
