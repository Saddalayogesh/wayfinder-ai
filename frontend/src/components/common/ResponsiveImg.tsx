import { cn } from '../../utils/cn'
import { responsiveSrcSet } from '../../utils/destinationImage'
import type { ImgHTMLAttributes } from 'react'

interface ResponsiveImgProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string
  /**
   * Responsive `sizes` hint so the browser picks the right variant from the
   * srcset — e.g. "100vw" for a full-bleed hero or "(min-width: 1024px) 25vw,
   * (min-width: 640px) 33vw, 80vw" for a card grid. Ignored for remote URLs.
   */
  sizes?: string
}

/**
 * Drop-in responsive <img>: attaches a width-based `srcset` (from the bundled
 * variant pool in /public/images/resp) plus sane loading defaults. Remote
 * photo URLs (Places API) render as a plain image with no srcset.
 */
export default function ResponsiveImg({
  src,
  sizes,
  className,
  loading = 'lazy',
  decoding = 'async',
  ...rest
}: ResponsiveImgProps) {
  const srcSet = responsiveSrcSet(src)
  return (
    <img
      src={src}
      srcSet={srcSet || undefined}
      sizes={srcSet ? sizes : undefined}
      loading={loading}
      decoding={decoding}
      draggable={false}
      className={cn('block h-full w-full select-none object-cover', className)}
      {...rest}
    />
  )
}
