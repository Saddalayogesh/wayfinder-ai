import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate, type NavLinkRenderProps } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { cn } from '../utils/cn'

const linkClass = ({ isActive }: NavLinkRenderProps) =>
  cn(
    'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-indigo-100 text-indigo-700'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  )

const mobileLinkClass = ({ isActive }: NavLinkRenderProps) =>
  cn(
    'block rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
    isActive
      ? 'bg-indigo-100 text-indigo-700'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  )

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)

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
    <header ref={headerRef} className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-indigo-600">
          <span aria-hidden="true">✈️</span>
          <span className="hidden sm:inline">AI Trip Planner</span>
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
              <span className="ml-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white"
                >
                  {user?.name.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[10rem] truncate text-sm font-medium text-slate-700">
                  {user?.name}
                </span>
              </span>
              <button
                onClick={handleLogout}
                className="ml-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
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
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                Get started
              </NavLink>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label="Toggle navigation menu"
          className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 transition hover:bg-slate-100 md:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            {menuOpen ? (
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            ) : (
              <path
                fillRule="evenodd"
                d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z"
                clipRule="evenodd"
              />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 shadow-lg md:hidden">
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
                <div className="mt-1 flex items-center gap-2 border-t border-slate-100 px-4 pt-3 text-sm text-slate-600">
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white"
                  >
                    {user?.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="truncate">{user?.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="mt-2 rounded-lg border border-rose-200 px-4 py-2 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                >
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
