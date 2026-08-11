import { cn } from '../../utils/cn'
import { useId, type InputHTMLAttributes, type ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode
  error?: string | null
  hint?: ReactNode
}

export default function Input({ label, error, hint, id, className, ...rest }: InputProps) {
  const autoId = useId()
  const inputId = id ?? autoId

  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-[13px] font-medium tracking-[0.02em] text-muted"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        className={cn(
          'input mt-2',
          error ? 'border-error/40 focus:shadow-[0_0_0_3px_rgb(var(--color-error)_/_0.15)]' : '',
          className,
        )}
        {...rest}
      />
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-error">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  )
}
