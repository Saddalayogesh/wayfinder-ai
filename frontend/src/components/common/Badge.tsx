import { cn } from '../../utils/cn'
import type { HTMLAttributes } from 'react'

type BadgeColor = 'primary' | 'slate' | 'accent' | 'warning' | 'danger' | 'violet'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor
}

const colorClasses: Record<BadgeColor, string> = {
  primary: 'bg-primary/15 text-primary border-primary/25',
  slate: 'bg-surface-hover text-muted border-border/80',
  accent: 'bg-accent/10 text-accent border-accent/25',
  warning: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-400/10 dark:text-amber-300 dark:border-amber-400/25',
  danger: 'bg-error/10 text-error border-error/25',
  violet: 'bg-primary/15 text-primary border-primary/25',
}

export default function Badge({ color = 'primary', className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        colorClasses[color],
        className,
      )}
      {...rest}
    />
  )
}
