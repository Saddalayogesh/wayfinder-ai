import { cn } from '../../utils/cn'

/** A shimmering loading placeholder block — shapes match real content. */
export default function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-shimmer rounded-xl bg-gradient-to-r from-surface-hover via-border/70 to-surface-hover bg-[length:200%_100%]',
        className,
      )}
    />
  )
}
