import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate, type NavLinkRenderProps } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { cn } from '../utils/cn'
import BrandMark from './common/BrandMark'
import { LogOut, Menu, Moon, Sun, X } from 'lucide-react'

const linkClass = ({ isActive }: NavLinkRenderProps) =>
  cn(
    'rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
    isActive
      ? 'bg-primary/15 text-primary'
      : 'text-muted hover:bg-surface-hover hover:text-text',
  )

const mobileLinkClass = ({ isActive }: NavLinkRenderProps) =>
  cn(
    'block rounded-lg px-4 py-2.5 text-sm font-medium transition-colors duration-200',
    isActive ? 'bg-primary/15 text-primary' : 'text-muted hover:bg-surface-hover hover:text-text',
  )

/** Circular initials badge — primary background, 2px primary ring, text on primary. */
function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex items-center justify-center rounded-full bg-primary font-bold text-white ring-2 ring-primary/30',
        className,
      )}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  )
}

/** Light/dark toggle — icon cross-fades when the theme flips. */
function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-muted transition-colors duration-200 hover:bg-surface-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
        className,
      )}
    >
      <span
        key={theme}
        className="animate-fade-in-up inline-flex"
        style={{ animationDuration: '300ms' }}
      >
        {isDark ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
      </span>
    </button>
  )
}

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const headerRef = useRef<HTMLElement>(null)

  // Transparent over the hero; solid surface + hairline border once scrolled.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the mobile menu on Escape or when clicking outside the header.
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    const onPointerDown = (e: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [menuOpen])

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  const handleNavigate = () => setMenuOpen(false)

  return (
    <header
      ref={headerRef}
      className={cn(
        'sticky top-0 z-40 transition-all duration-300',
        scrolled || menuOpen
          ? 'bg-surface/90 shadow-lg shadow-black/10 dark:shadow-black/20 backdrop-blur-xl'
          : 'bg-transparent',
      )}
    >
      {/* Gradient hairline divider under the navbar (fades in on scroll). */}
      <div
        aria-hidden="true"
        className={cn(
          'divider absolute inset-x-0 bottom-0 transition-opacity duration-300',
          scrolled || menuOpen ? 'opacity-100' : 'opacity-0',
        )}
      />
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <Link to="/" className="group flex items-center gap-2.5" onClick={handleNavigate}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary transition-colors duration-200 group-hover:bg-primary/25">
            <BrandMark size={24} />
          </span>
          <span className="hidden font-display text-lg font-semibold tracking-tight text-text sm:inline">
            Wayfinder AI
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>

          {isAuthenticated ? (
            <>
              <NavLink to="/trips" className={linkClass}>
                My Trips
              </NavLink>
              <NavLink to="/favorites" className={linkClass}>
                Favorites
              </NavLink>
              <NavLink to="/profile" className={linkClass}>
                Profile
              </NavLink>
              <span className="ml-2 flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-1.5">
                <Avatar name={user?.name ?? '?'} className="h-7 w-7 text-xs" />
                <span className="max-w-[10rem] truncate text-sm font-medium text-text">
                  {user?.name}
                </span>
              </span>
              <button
                onClick={handleLogout}
                className="ml-1 inline-flex items-center gap-1.5 rounded-xl border border-border bg-transparent px-4 py-2 text-sm font-medium text-muted transition-colors duration-200 hover:border-text/25 hover:bg-surface-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              >
                <LogOut size={16} aria-hidden="true" />
                Sign out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Sign in
              </NavLink>
              <NavLink
                to="/register"
                className="btn-primary-bg rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-200 hover:shadow-primary/40 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                Get started
              </NavLink>
            </>
          )}

          <span className="ml-1.5">
            <ThemeToggle />
          </span>
        </div>

        {/* Mobile: theme toggle + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label="Toggle navigation menu"
            className="rounded-xl border border-border bg-surface p-2 text-muted transition-colors duration-200 hover:bg-surface-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="border-t border-border/60 bg-surface px-4 py-3 shadow-lg md:hidden">
          <div className="flex flex-col gap-1">
            <NavLink to="/" end className={mobileLinkClass} onClick={handleNavigate}>
              Home
            </NavLink>
            {isAuthenticated ? (
              <>
                <NavLink to="/trips" className={mobileLinkClass} onClick={handleNavigate}>
                  My Trips
                </NavLink>
                <NavLink to="/favorites" className={mobileLinkClass} onClick={handleNavigate}>
                  Favorites
                </NavLink>
                <NavLink to="/profile" className={mobileLinkClass} onClick={handleNavigate}>
                  Profile
                </NavLink>
                <div className="mt-1 flex items-center gap-2.5 border-t border-border/60 px-4 pt-3 text-sm text-muted">
                  <Avatar name={user?.name ?? '?'} className="h-7 w-7 text-xs" />
                  <span className="truncate text-text">{user?.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="mt-2 inline-flex items-center gap-2 rounded-xl border border-error/30 px-4 py-2 text-left text-sm font-medium text-error transition-colors duration-200 hover:bg-error/10"
                >
                  <LogOut size={16} aria-hidden="true" />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={mobileLinkClass} onClick={handleNavigate}>
                  Sign in
                </NavLink>
                <NavLink to="/register" className={mobileLinkClass} onClick={handleNavigate}>
                  Get started
                </NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
