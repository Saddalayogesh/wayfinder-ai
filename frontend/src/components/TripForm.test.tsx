import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import TripForm from './TripForm'
import { DATE_PICKER_MONTHS } from './common/DatePicker'
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

  /**
   * Opens the picker named by its label and selects an ISO date. The calendar
   * opens on the current month, so we navigate to the target month first —
   * this keeps the tests independent of the day they run.
   */
  const pickDate = (triggerName: string, isoDate: string) => {
    const [year, month, day] = isoDate.split('-').map(Number)
    fireEvent.click(screen.getByRole('button', { name: triggerName }))

    let guard = 0
    while (guard < 24) {
      guard += 1
      // Match the month header by full textContent (it contains a nested span
      // for the year, which the default text matcher ignores).
      const header = screen.getByText(
        (_, element) =>
          element?.tagName === 'P' &&
          /^[A-Z][a-z]+ \d{4}$/.test(element.textContent?.trim() ?? ''),
      )
      const [headerMonth, headerYear] = (header.textContent ?? '').trim().split(' ')
      const currentKey = Number(headerYear) * 12 + DATE_PICKER_MONTHS.indexOf(headerMonth)
      const targetKey = year * 12 + (month - 1)
      if (currentKey === targetKey) break
      fireEvent.click(
        screen.getByRole('button', {
          name: currentKey < targetKey ? 'Next month' : 'Previous month',
        }),
      )
    }

    fireEvent.click(
      screen.getByRole('button', { name: `${day} ${DATE_PICKER_MONTHS[month - 1]} ${year}` }),
    )
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
    // Pick the end date first, then a later start date — the overlap trips the
    // validation guard (the end picker itself disables earlier dates).
    pickDate('End date', '2026-08-10')
    pickDate('Start date', '2026-08-15')
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
    pickDate('Start date', '2026-08-01')
    pickDate('End date', '2026-08-05')
    // Travelers stepper: +1 from the default of 1.
    fireEvent.click(screen.getByRole('button', { name: 'Increase travelers' }))
    fireEvent.change(screen.getByLabelText('Budget'), { target: { value: '3000' } })
    submitForm()

    expect(onSubmit).toHaveBeenCalledTimes(1)
    // A successful build clears the previous validation error.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    const input = onSubmit.mock.calls[0][0] as TripInput
    expect(input).toMatchObject({
      destination: 'Kyoto',
      startDate: '2026-08-01',
      endDate: '2026-08-05',
      travelers: 2,
      budget: 3000,
      travelStyle: TRAVEL_STYLES[0],
      interests: [],
    })
    // Currency defaults to USD and is included in the submitted payload.
    expect(input.currency).toBe('USD')
    // Title defaults to "Trip to <destination>" when left blank.
    expect(input.title).toBe('Trip to Kyoto')
  })

  it('sends the selected currency with the trip', () => {
    const onSubmit = vi.fn()
    render(<TripForm submitLabel="Save" onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('Destination'), { target: { value: 'Mumbai' } })
    pickDate('Start date', '2026-08-01')
    pickDate('End date', '2026-08-03')
    fireEvent.change(screen.getByLabelText('Budget'), { target: { value: '50000' } })
    fireEvent.change(screen.getByLabelText('Currency'), { target: { value: 'INR' } })
    submitForm()

    const input = onSubmit.mock.calls[0][0] as TripInput
    expect(input.currency).toBe('INR')
  })
})
