import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import DatePicker, { formatDisplayDate, DATE_PICKER_MONTHS } from './DatePicker'

/** Reads the month header ("August 2026") from the open calendar. */
function monthHeader(): { year: number; month: number } {
  const header = screen.getByText(
    (_, element) =>
      element?.tagName === 'P' &&
      /^[A-Z][a-z]+ \d{4}$/.test(element.textContent?.trim() ?? ''),
  )
  const [monthName, year] = (header.textContent ?? '').trim().split(' ')
  return { year: Number(year), month: DATE_PICKER_MONTHS.indexOf(monthName) }
}

/** Clicks next/previous until the calendar shows the requested month. */
function navigateToMonth(year: number, monthIndex: number) {
  let guard = 0
  while (guard < 24) {
    guard += 1
    const current = monthHeader()
    const currentKey = current.year * 12 + current.month
    const targetKey = year * 12 + monthIndex
    if (currentKey === targetKey) return
    fireEvent.click(
      screen.getByRole('button', {
        name: currentKey < targetKey ? 'Next month' : 'Previous month',
      }),
    )
  }
  throw new Error('Could not navigate to the target month')
}

/**
 * Opens the picker, navigates to the month of `isoDate` (the calendar starts
 * on the current month, so this keeps tests independent of their run date),
 * then clicks the target day.
 */
function pickDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-').map(Number)
  navigateToMonth(year, month - 1)
  fireEvent.click(
    screen.getByRole('button', { name: `${day} ${DATE_PICKER_MONTHS[month - 1]} ${year}` }),
  )
}

describe('DatePicker', () => {
  it('renders the label and placeholder when no value is set', () => {
    render(<DatePicker label="Start date" value="" onChange={() => {}} />)

    expect(screen.getByText('Start date')).toBeInTheDocument()
    expect(screen.getByText('Select a date')).toBeInTheDocument()
  })

  it('shows the formatted date on the trigger once a value is set', () => {
    render(<DatePicker label="Start date" value="2026-08-15" onChange={() => {}} />)

    expect(screen.getByRole('button', { name: 'Start date' })).toHaveTextContent('15 Aug 2026')
  })

  it('emits an ISO value when a day is clicked', () => {
    const onChange = vi.fn()
    render(<DatePicker label="Start date" value="" onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Start date' }))
    pickDate('2026-08-15')

    expect(onChange).toHaveBeenCalledWith('2026-08-15')
  })

  it('disables days before minDate but keeps later days enabled', () => {
    render(<DatePicker label="End date" value="" minDate="2026-08-10" onChange={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: 'End date' }))
    navigateToMonth(2026, 7) // August

    expect(screen.getByRole('button', { name: '5 August 2026' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '10 August 2026' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '31 August 2026' })).toBeEnabled()
  })

  it('navigates to the next month with the arrow button', () => {
    render(<DatePicker label="Start date" value="" onChange={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: 'Start date' }))
    const before = monthHeader()
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }))
    const after = monthHeader()

    expect(before.year * 12 + before.month).toBe(
      new Date().getFullYear() * 12 + new Date().getMonth(),
    )
    expect(after.year * 12 + after.month).toBe(before.year * 12 + before.month + 1)
  })

  it('formats ISO values into a friendly display string', () => {
    expect(formatDisplayDate('2026-08-15')).toBe('15 Aug 2026')
    expect(formatDisplayDate('')).toBe('')
  })
})
