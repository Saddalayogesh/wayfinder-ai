import { useId } from 'react'

interface BrandMarkProps {
  size?: number
  className?: string
}

/**
 * Wayfinder AI brand mark — a terracotta compass star with a sand destination
 * dot and a dashed route from the origin. All colors resolve from the theme
 * tokens (CSS variables) so the mark adapts to dark/light and the palette.
 * Rendered inline so it inherits no font/color context and stays crisp at any
 * size. Use in the navbar, footer, and auth screens; the favicon
 * (public/favicon.svg) is the tiled version.
 */
export default function BrandMark({ size = 32, className }: BrandMarkProps) {
  // Unique gradient id per instance so multiple marks on one page never collide.
  const gradientId = useId().replace(/[^a-zA-Z0-9]/g, '')

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="8" y1="6" x2="26" y2="28" gradientUnits="userSpaceOnUse">
          <stop
            offset="0"
            style={{ stopColor: 'color-mix(in srgb, rgb(var(--color-primary)) 72%, white)' }}
          />
          <stop offset="1" style={{ stopColor: 'rgb(var(--color-primary))' }} />
        </linearGradient>
      </defs>
      {/* Route — origin dot to destination */}
      <path
        d="M7 25 L15 17"
        style={{ stroke: 'var(--color-accent)' }}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeDasharray="2.5 2.5"
        opacity="0.9"
      />
      <circle cx="7" cy="25" r="1.7" style={{ fill: 'var(--color-accent)' }} />
      {/* Outer ring */}
      <circle
        cx="16"
        cy="16"
        r="12"
        style={{ stroke: 'rgb(var(--color-primary) / 0.4)' }}
        strokeWidth="1.5"
      />
      {/* Compass star */}
      <path
        d="M16 5.5 L18.8 13.2 L26.5 16 L18.8 18.8 L16 26.5 L13.2 18.8 L5.5 16 L13.2 13.2 Z"
        fill={`url(#${gradientId})`}
      />
      {/* Destination dot — surface token so it matches light/dark themes */}
      <circle
        cx="16"
        cy="16"
        r="2.3"
        style={{ fill: 'var(--color-surface)' }}
        stroke="var(--color-accent)"
        strokeWidth="1.4"
      />
    </svg>
  )
}
