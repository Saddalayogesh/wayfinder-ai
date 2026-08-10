import { cn } from '../../utils/cn'
import type { HTMLAttributes } from 'react'

/** Card container with the standard surface, border, and shadow treatment. */
export default function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200 bg-white shadow-sm transition',
        className,
      )}
      {...rest}
    />
  )
}
