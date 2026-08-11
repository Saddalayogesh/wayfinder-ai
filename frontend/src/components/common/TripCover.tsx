import { useState } from 'react'
import { cn } from '../../utils/cn'
import { destinationImage } from '../../utils/destinationImage'
import ResponsiveImg from './ResponsiveImg'

interface TripCoverProps {
  /** Destination or place name used to pick the photo and the fallback letter. */
  label: string
  className?: string
  /** Override the image source (e.g. a Places photoUrl). */
  src?: string | null
  /** Rounded-corner shape of the image; defaults to squared-off (the parent clips). */
  imgClassName?: string
  /** Bottom scrim for overlaid text; disable for small thumbnails. */
  scrim?: boolean
  /** Responsive `sizes` hint for the srcset (see ResponsiveImg). */
  sizes?: string
}

/**
 * Destination imagery with a graceful fallback:
 *  - uses the Places `photoUrl` when available, otherwise a curated static
 *    travel photo from /public/images picked deterministically by label
 *  - static pool photos load via a width-based `srcset` (see ResponsiveImg)
 *    so mobile users never download the full-size image
 *  - falls back to a primary→accent gradient tile with the destination's
 *    first letter if the image ever fails to load
 *
 * The wrapper always carries role="img" + an accessible name; the photo is
 * rendered block-level with object-cover so it fills whatever frame the
 * parent gives it (fixed heights like h-44, or h-full inside a sized box).
 */
export default function TripCover({
  label,
  src,
  className,
  imgClassName,
  scrim = true,
  sizes,
}: TripCoverProps) {
  const [failed, setFailed] = useState(false)
  const resolvedSrc = src ?? destinationImage(label)

  const fallback = (
    <div
      role="img"
      aria-label={label}
      className={cn(
        'btn-primary-bg flex items-center justify-center',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="font-display text-4xl font-semibold text-white/90 sm:text-5xl"
      >
        {label.charAt(0).toUpperCase()}
      </span>
    </div>
  )

  if (failed) return fallback

  const isStatic = resolvedSrc.startsWith('/images/')

  return (
    <div
      role="img"
      aria-label={label}
      className={cn('relative overflow-hidden bg-surface-hover', className)}
    >
      {isStatic ? (
        <ResponsiveImg
          src={resolvedSrc}
          sizes={sizes}
          onError={() => setFailed(true)}
          className={imgClassName}
        />
      ) : (
        <img
          src={resolvedSrc}
          alt=""
          draggable={false}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className={cn('block h-full w-full select-none object-cover', imgClassName)}
        />
      )}
      {/* Soft bottom scrim so overlaid text stays legible on any photo. */}
      {scrim && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-background/25 to-transparent"
        />
      )}
    </div>
  )
}
