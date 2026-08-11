import { describe, expect, it } from 'vitest'
import { destinationImage } from './destinationImage'

const POOL = Array.from({ length: 10 }, (_, i) => `/images/dest-${i + 1}.jpg`)

describe('destinationImage', () => {
  it('is deterministic for the same label regardless of casing', () => {
    expect(destinationImage('Tokyo')).toBe(destinationImage('tokyo'))
    expect(destinationImage('Paris, France')).toBe(destinationImage('Paris, France'))
  })

  it('matches known destination keywords', () => {
    expect(destinationImage('Beach vacation in Maldives')).toBe('/images/dest-1.jpg')
    expect(destinationImage('Paris city break')).toBe('/images/dest-3.jpg')
    expect(destinationImage('Venice canals')).toBe('/images/dest-4.jpg')
    expect(destinationImage('Seoul')).toBe('/images/dest-8.jpg')
  })

  it('always returns one of the bundled pool images for unknown labels', () => {
    for (const label of ['Kyoto', 'Cape Town', 'Reykjavik', 'Mexico City', 'Queenstown']) {
      expect(POOL).toContain(destinationImage(label))
    }
  })

  it('handles an empty label gracefully', () => {
    expect(POOL).toContain(destinationImage(''))
    expect(POOL).toContain(destinationImage('   '))
  })
})
