import type { ReactNode } from 'react'
import { Sparkles } from 'lucide-react'
import ResponsiveImg from './common/ResponsiveImg'

interface AuthLayoutProps {
  /** Photo shown on the right-hand side of the split screen. */
  image: string
  /** Quote overlaid at the bottom of the photo. */
  quote: string
  /** Quote attribution, e.g. "— Saint Augustine". */
  attribution: string
  /** The form content, rendered inside the left column. */
  children: ReactNode
}

/**
 * Shared two-column layout for the auth screens (login / register).
 *
 * The split-screen geometry lives here in one place so it cannot drift
 * between the two pages: the navbar-height assumption (exactly h-16 / 4rem),
 * the 45/55 column split, the photo overlay, and the internal scrolling for
 * short viewports. Pages only supply the photo, quote, and their form.
 */
export default function AuthLayout({ image, quote, attribution, children }: AuthLayoutProps) {
  return (
    <main className="grid lg:h-[calc(100vh-4rem)] lg:grid-cols-[9fr_11fr]">
      {/* Form side — centered, but scrolls internally on short viewports so the
          photo column always fills exactly one viewport. */}
      <div className="flex px-4 py-20 sm:px-8 lg:min-h-0 lg:overflow-y-auto lg:py-0">
        <div className="m-auto w-full max-w-md">{children}</div>
      </div>

      {/* Photo side — flush with the navbar bottom above and the viewport
          bottom below (navbar is exactly h-16 / 4rem). */}
      <div className="relative hidden overflow-hidden lg:block">
        <ResponsiveImg
          src={image}
          sizes="55vw"
          className="absolute inset-0 h-full w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/20" />
        <div className="absolute inset-0 flex flex-col justify-end p-12">
          <p className="font-display text-3xl font-medium leading-snug text-text">{quote}</p>
          <p className="mt-4 text-sm uppercase tracking-[0.25em] text-muted">{attribution}</p>
          <div className="mt-10 flex items-center gap-2 text-sm text-muted">
            <Sparkles size={16} className="text-accent" aria-hidden="true" />
            Curated itineraries, crafted by AI
          </div>
        </div>
      </div>
    </main>
  )
}
