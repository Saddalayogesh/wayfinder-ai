import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import TripCover from './TripCover'

describe('TripCover', () => {
  it('renders a deterministic destination photo for the label', () => {
    const { container } = render(<TripCover label="Tokyo" />)

    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    // "Tokyo" matches the Japan/Asia pool image.
    expect(img).toHaveAttribute('src', expect.stringContaining('/images/dest-8.jpg'))
    // The wrapper exposes an accessible name.
    expect(screen.getByRole('img', { name: 'Tokyo' })).toBeInTheDocument()
  })

  it('prefers the explicit src when provided', () => {
    const { container } = render(
      <TripCover label="Tokyo" src="https://example.com/places/photo.jpg" />,
    )

    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://example.com/places/photo.jpg',
    )
  })

  it('falls back to a gradient tile with the initial letter when the image fails', () => {
    const { container } = render(<TripCover label="Kyoto" />)

    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    fireEvent.error(img as HTMLImageElement)

    // The fallback keeps the accessible label and shows the initial letter.
    expect(screen.getByRole('img', { name: 'Kyoto' })).toHaveTextContent('K')
    expect(container.querySelector('img')).toBeNull()
  })
})
