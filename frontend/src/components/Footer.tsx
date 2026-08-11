import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BrandMark from './common/BrandMark'
import { MapPin, Plane, Sparkles, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'

/** Footer link — muted text that brightens on hover, small tap targets stacked. */
function FooterLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 text-sm text-muted transition-colors duration-200 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
    >
      {children}
    </Link>
  )
}

/**
 * Global site footer — sits below the routed content on every page. Uses the
 * same tokens as the navbar: surface backdrop, hairline gradient top border,
 * muted secondary text, and the Wayfinder AI brand mark.
 */
export default function Footer() {
  const { isAuthenticated } = useAuth()
  const year = new Date().getFullYear()

  return (
    <footer className="relative bg-surface/40 backdrop-blur">
      {/* Gradient hairline above the footer body */}
      <div aria-hidden="true" className="divider" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link
              to="/"
              className="group inline-flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary transition-colors duration-200 group-hover:bg-primary/25">
                <BrandMark size={24} />
              </span>
              <span className="font-display text-lg font-semibold tracking-tight text-text">
                Wayfinder AI
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              Personalized, AI-crafted itineraries — from a passing thought to a
              fully planned adventure.
            </p>
            <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-muted">
              <Sparkles size={13} className="text-accent" aria-hidden="true" />
              Powered by Gemini
            </p>
          </div>

          {/* Explore */}
          <nav aria-label="Explore" className="flex flex-col gap-3.5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Explore
            </h3>
            <FooterLink to="/">
              <MapPin size={14} aria-hidden="true" />
              Home
            </FooterLink>
            {isAuthenticated ? (
              <>
                <FooterLink to="/trips">
                  <Plane size={14} aria-hidden="true" />
                  My trips
                </FooterLink>
                <FooterLink to="/favorites">
                  <Sparkles size={14} aria-hidden="true" />
                  Favorites
                </FooterLink>
                <FooterLink to="/profile">
                  <UserRound size={14} aria-hidden="true" />
                  Profile
                </FooterLink>
              </>
            ) : (
              <>
                <FooterLink to="/login">
                  <MapPin size={14} aria-hidden="true" />
                  Sign in
                </FooterLink>
                <FooterLink to="/register">
                  <Sparkles size={14} aria-hidden="true" />
                  Get started
                </FooterLink>
              </>
            )}
          </nav>

          {/* Plan */}
          <nav aria-label="Plan" className="flex flex-col gap-3.5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Plan
            </h3>
            <FooterLink to={isAuthenticated ? '/trips/new' : '/register'}>
              <Plane size={14} aria-hidden="true" />
              Plan a trip
            </FooterLink>
            <FooterLink to={isAuthenticated ? '/dashboard' : '/register'}>
              <MapPin size={14} aria-hidden="true" />
              Start planning
            </FooterLink>
            {isAuthenticated && (
              <FooterLink to="/trips">
                <Sparkles size={14} aria-hidden="true" />
                Your adventures
              </FooterLink>
            )}
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-border/60 py-6 text-xs text-muted sm:flex-row">
          <p>© {year} Wayfinder AI. All rights reserved.</p>
          <p className="inline-flex items-center gap-1.5">
            Made for travelers
            <span aria-hidden="true" className="text-primary">
              •
            </span>
            planned by AI
          </p>
        </div>
      </div>
    </footer>
  )
}
