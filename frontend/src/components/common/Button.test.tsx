import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Button from './Button'

describe('Button', () => {
  it('renders its children as the accessible name', () => {
    render(<Button>Plan my trip</Button>)

    expect(screen.getByRole('button', { name: 'Plan my trip' })).toBeEnabled()
  })

  it('is disabled while loading and still exposes the label', () => {
    render(<Button loading>Save</Button>)

    expect(screen.getByRole('button', { name: /Save/ })).toBeDisabled()
  })

  it('respects an explicit disabled prop', () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Delete
      </Button>,
    )

    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled()
  })
})
