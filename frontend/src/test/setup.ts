import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Unmount any React trees rendered by a test so state never leaks between tests.
afterEach(() => {
  cleanup()
  localStorage.clear()
})
