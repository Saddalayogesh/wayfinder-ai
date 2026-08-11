import { useEffect } from 'react'

/**
 * Reveal-on-scroll: observes every element carrying the `.reveal` class on the
 * current page and adds `.is-visible` once it enters the viewport (one-shot).
 * The CSS transition lives in index.css and collapses under
 * prefers-reduced-motion.
 *
 * Usage: call `useReveal()` in a page component; mark sections with
 * `className="reveal"` (add a stagger via inline transitionDelay).
 */
export function useReveal() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('.reveal'))
    if (elements.length === 0) return

    if (!('IntersectionObserver' in window)) {
      elements.forEach((el) => el.classList.add('is-visible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -48px 0px' },
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}
