import { cn } from '../../utils/cn'

/** A shimmering loading placeholder block. */
export default function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse rounded-xl bg-slate-200/80',
        className,
      )}
    />
  )
}
