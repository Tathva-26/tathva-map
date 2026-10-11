import { expect, test } from 'vitest'
import type { ScheduleEvent } from '../../shared/schedule.ts'
import { hostPlaceId, markerPlaceId } from '../data/campus'
import { indexByVenue } from './venueIndex.ts'

const now = new Date('2026-02-06T10:00:00.000Z')

function ev(id: string, placeId: string, startAt: string, endAt: string): ScheduleEvent {
  return {
    id,
    title: id,
    description: null,
    category: 'workshop',
    placeId,
    room: null,
    startAt,
    endAt,
    originalStartAt: null,
    status: 'scheduled',
    note: null,
    updatedAt: startAt,
    updatedBy: 'admin',
  }
}

test('hostPlaceId maps an indoor room to its building and leaves other ids alone', () => {
  expect(hostPlaceId('elhc_301')).toBe('elhc')
  expect(hostPlaceId('elhc')).toBe('elhc')
})

test('a live event in an indoor room is grouped under, and lights up, its host building', () => {
  const room = ev('room', 'elhc_301', '2026-02-06T09:00:00.000Z', '2026-02-06T11:00:00.000Z')
  const { byPlace, liveVenueIds, eventVenueIds } = indexByVenue([room], now)
  expect(byPlace.get('elhc')).toEqual([room])
  expect(byPlace.has('elhc_301')).toBe(false)
  expect(liveVenueIds.has('elhc')).toBe(true)
  expect(eventVenueIds.has('elhc')).toBe(true)
})

test('a stage keeps its own popup; a room still borrows its building\'s', () => {
  expect(markerPlaceId('informals_stage')).toBe('informals_stage')
  expect(markerPlaceId('proshow')).toBe('proshow')
  expect(markerPlaceId('elhc_301')).toBe('elhc')
  expect(markerPlaceId('elhc')).toBe('elhc')
  // The stage is still *drawn and routed* as the thing it stands on; only the pin differs.
  expect(hostPlaceId('informals_stage')).toBe('atm_circle')
})

test("a stage's acts land on the stage and on the place it is held on", () => {
  // Reported from the fest: tapping the football ground while the proshow was on it answered
  // "Nothing listed right now", because the acts were filed under the stage's own pin alone.
  // Someone standing on the ground taps the ground, so the ground has to answer.
  const act = ev('Flashmob', 'informals_stage', '2026-02-06T09:00:00.000Z', '2026-02-06T11:00:00.000Z')
  const { byPlace, liveVenueIds } = indexByVenue([act], now)
  expect(byPlace.get('informals_stage')).toEqual([act])
  expect(byPlace.get('atm_circle')).toEqual([act])
  // Both light up too: the pin that names it and the place it is held on.
  expect(liveVenueIds.has('informals_stage')).toBe(true)
  expect(liveVenueIds.has('atm_circle')).toBe(true)
})

test("the host lists its own events as well as the stage's", () => {
  const act = ev('Flashmob', 'informals_stage', '2026-02-06T09:00:00.000Z', '2026-02-06T11:00:00.000Z')
  const stall = ev('Rageroom', 'atm_circle', '2026-02-06T09:00:00.000Z', '2026-02-06T11:00:00.000Z')
  const { byPlace } = indexByVenue([act, stall], now)
  expect(byPlace.get('informals_stage')).toEqual([act])
  expect(byPlace.get('atm_circle')).toEqual([act, stall])
})

test('a room is still listed once, on its building', () => {
  // The rule that changed is about stages. A room has no pin of its own, so its host *is* its
  // marker and the deduplication has to keep it to a single listing.
  const room = ev('Workshop', 'elhc_301', '2026-02-06T09:00:00.000Z', '2026-02-06T11:00:00.000Z')
  const { byPlace } = indexByVenue([room], now)
  expect(byPlace.get('elhc')).toEqual([room])
  expect(byPlace.has('elhc_301')).toBe(false)
})

test('an upcoming act marks both ids as event venues, so neither pin goes grey', () => {
  const soon = ev('Athma band', 'proshow', '2026-02-06T12:00:00.000Z', '2026-02-06T13:00:00.000Z')
  const { eventVenueIds, liveVenueIds } = indexByVenue([soon], now)
  expect(eventVenueIds.has('proshow')).toBe(true)
  expect(eventVenueIds.has('nit_football_ground')).toBe(true)
  expect(liveVenueIds.size).toBe(0)
})
