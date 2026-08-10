import { cn } from '../../utils/cn'
import type { HTMLAttributes } from 'react'

type BadgeColor = 'indigo' | 'slate' | 'emerald' | 'amber' | 'rose' | 'violet'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor
}

const colorClasses: Record<BadgeColor, string> = {
  indigo: 'bg-indigo-100 text-indigo-700',
  slate: 'bg-slate-100 text-slate-600',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-700',
  violet: 'bg-violet-100 text-violet-700',
}

export default function Badge({ color = 'indigo', className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        colorClasses[color],
        className,
      )}
      {...rest}
    />
  )
}
