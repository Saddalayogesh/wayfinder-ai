import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import TripForm from './TripForm'
import { TRAVEL_STYLES, type TripInput } from '../services/tripService'

// The form used by CreateTrip. Tests exercise the client-side validation that
// guards required fields before any API call happens.
//
// Note: we fire the submit event directly instead of clicking the submit
// button, because the inputs' native `required` attributes make jsdom's
// constraint validation swallow the click for invalid forms before React's
// buildInput() validation ever runs.

describe('TripForm (CreateTrip) validation', () => {
  const submitForm = () => {
    const form = screen.getByRole('button', { name: 'Save' }).closest('form')
    if (!form) throw new Error('form not rendered')
    fireEvent.submit(form)
  }

  it('blocks submission with an empty destination', () => {
    const onSubmit = vi.fn()
    render(<TripForm submitLabel="Save" onSubmit={onSubmit} />)

    submitForm()

    expect(screen.getByRole('alert')).toHaveTextContent('Destination is required')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('rejects an end date before the start date', () => {
    const onSubmit = vi.fn()
    render(<TripForm submitLabel="Save" onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('Destination'), { target: { value: 'Tokyo' } })
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2026-08-15' } })
    fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2026-08-10' } })
    submitForm()

    expect(screen.getByRole('alert')).toHaveTextContent(
      'End date must be on or after the start date',
    )
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits a fully valid trip to the parent handler', () => {
    const onSubmit = vi.fn()
    render(<TripForm submitLabel="Save" onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('Destination'), { target: { value: 'Kyoto' } })
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2026-11-01' } })
    fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2026-11-05' } })
    fireEvent.change(screen.getByLabelText('Travelers'), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText('Budget (USD)'), { target: { value: '3000' } })
    submitForm()

    expect(onSubmit).toHaveBeenCalledTimes(1)
    // A successful build clears the previous validation error.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    const input = onSubmit.mock.calls[0][0] as TripInput
    expect(input).toMatchObject({
      destination: 'Kyoto',
      startDate: '2026-11-01',
      endDate: '2026-11-05',
      travelers: 2,
      budget: 3000,
      travelStyle: TRAVEL_STYLES[0],
      interests: [],
    })
    // Title defaults to "Trip to <destination>" when left blank.
    expect(input.title).toBe('Trip to Kyoto')
  })
})
