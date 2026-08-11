import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import AuthLayout from './AuthLayout'

const props = {
  image: '/images/auth-ocean.jpg',
  quote: '“The world is a book”',
  attribution: '— Saint Augustine',
}

describe('AuthLayout', () => {
  it('renders the photo with the given src', () => {
    const { container } = render(
      <AuthLayout {...props}>
        <form aria-label="sign-in" />
      </AuthLayout>,
    )

    expect(container.querySelector('img')).toHaveAttribute('src', props.image)
  })

  it('renders the quote, attribution, and branded tagline', () => {
    render(
      <AuthLayout {...props}>
        <form aria-label="sign-in" />
      </AuthLayout>,
    )

    expect(screen.getByText(props.quote)).toBeInTheDocument()
    expect(screen.getByText(props.attribution)).toBeInTheDocument()
    expect(screen.getByText('Curated itineraries, crafted by AI')).toBeInTheDocument()
  })

  it('renders the form content inside the left column', () => {
    render(
      <AuthLayout {...props}>
        <form aria-label="sign-in">
          <input aria-label="email" />
        </form>
      </AuthLayout>,
    )

    expect(screen.getByLabelText('sign-in')).toBeInTheDocument()
    expect(screen.getByLabelText('email')).toBeInTheDocument()
  })
})
