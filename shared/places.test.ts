import { expect, test } from 'vitest'
import { currentPlaceId, knownPlaces, MOVED_PLACES } from './places.ts'

test('a retired place is gone from the places an event can name', () => {
  for (const old of Object.keys(MOVED_PLACES)) {
    expect(knownPlaces.has(old), old).toBe(false)
  }
})

test('every retirement points at a place that exists', () => {
  // A typo here would translate one unknown venue into another, which reads as "Unknown
  // venue" in the app and routes nowhere — the exact failure the map is meant to prevent.
  for (const [old, now] of Object.entries(MOVED_PLACES)) {
    expect(knownPlaces.has(now), `${old} -> ${now}`).toBe(true)
  }
})

test('current ids and unknown ids pass through unchanged', () => {
  expect(currentPlaceId('abc_auditorium_complex')).toBe('abc_auditorium_complex')
  expect(currentPlaceId('not_a_place')).toBe('not_a_place')
})

test('the lecture halls now answer to the ABC complex', () => {
  expect(currentPlaceId('aryabhatta_park')).toBe('abc_auditorium_complex')
})
