import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '../../utils/cn'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  /** Rendered in the top-right corner (e.g. a close button). */
  footer?: ReactNode
  className?: string
}

/** Accessible modal: closes on backdrop click and on Escape, with a soft
 *  fade + scale entrance matching the design system. */
export default function Modal({ open, onClose, title, children, footer, className }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    // Move focus into the dialog on open (basic focus management).
    dialogRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'w-full max-w-md animate-modal-in rounded-2xl border border-border bg-surface p-6 shadow-panel outline-none',
          // Keep tall dialogs (e.g. regenerate) scrollable on small screens.
          // (100vh first as a fallback for browsers without dvh support.)
          'max-h-[calc(100vh-2rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-xl font-semibold tracking-tight text-text">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-muted transition-colors duration-200 hover:bg-surface-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="mt-4 text-text/90">{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}
