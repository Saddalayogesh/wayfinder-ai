import { cn } from '../../utils/cn'
import Spinner from './Spinner'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  /** Shows an inline spinner and disables the button. */
  loading?: boolean
  children: ReactNode
}

const variantClasses: Record<Variant, string> = {
  // Primary CTA — violet gradient (135deg), soft glow that intensifies on
  // hover, and a light sweep (btn-shine). Only one per view.
  primary:
    'btn-shine btn-primary-bg text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 focus-visible:ring-primary/60',
  // Ghost — transparent fill, hairline border, muted text; hover lightens the
  // border and tints text primary. Distinct from the disabled (50% opacity) state.
  secondary:
    'border border-border bg-transparent text-muted hover:border-primary/40 hover:text-primary focus-visible:ring-accent/50',
  ghost:
    'text-muted hover:bg-surface-hover hover:text-text focus-visible:ring-accent/50',
  danger:
    'border border-error/30 bg-transparent text-error hover:border-error/50 hover:bg-error/10 hover:text-error/90 focus-visible:ring-error/40',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-7 py-3 text-sm',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...rest}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
}
