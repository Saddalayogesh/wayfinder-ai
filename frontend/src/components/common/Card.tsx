import { cn } from '../../utils/cn'
import type { HTMLAttributes } from 'react'

/**
 * Card container with the surface treatment: dark fill, hairline border,
 * 16px radius, and a soft violet-tinted shadow that appears on hover only.
 */
export default function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border/70 bg-surface transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10',
        className,
      )}
      {...rest}
    />
  )
}
