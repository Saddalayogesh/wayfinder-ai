import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  /** True when the user has not picked a theme explicitly (still on the dark default). */
  isSystem: boolean
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const STORAGE_KEY = 'wayfinder-theme'
const THEME_COLOR_META = 'theme-color'
const DARK_COLOR = '#26201C'
const LIGHT_COLOR = '#FDF4EF'

/**
 * The theme to start with: an explicit saved choice wins, otherwise **dark**
 * is the universal default for every visitor, regardless of OS preference.
 */
function initialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // localStorage unavailable (private mode / disabled) — fall through.
  }
  return 'dark'
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(initialTheme)
  const [isSystem, setIsSystem] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) == null
    } catch {
      return true
    }
  })

  // Apply the theme to <html> and persist the user's explicit choice.
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.classList.toggle('light', theme === 'light')
    // Keep the browser chrome (mobile URL bar) in sync with the page.
    document
      .querySelector(`meta[name="${THEME_COLOR_META}"]`)
      ?.setAttribute('content', theme === 'dark' ? DARK_COLOR : LIGHT_COLOR)
    try {
      if (!isSystem) localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Ignore storage failures — theming still works for this session.
    }
  }, [theme, isSystem])

  // (No OS-following: dark is the default for everyone until they toggle.)

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    setIsSystem(false)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((current) => (current === 'dark' ? 'light' : 'dark'))
    setIsSystem(false)
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, isSystem, setTheme, toggleTheme }),
    [theme, isSystem, setTheme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within a <ThemeProvider>')
  }
  return ctx
}
