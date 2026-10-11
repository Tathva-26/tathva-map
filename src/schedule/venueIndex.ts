import { eventState } from '../../shared/classify.ts'
import type { ScheduleEvent } from '../../shared/schedule.ts'
import { hostPlaceId, markerPlaceId } from '../data/campus'
import { flagshipVenueOf } from './flagship'

/**
 * Events grouped for the map.
 *
 * `byPlace` is keyed by the marker whose popup should list them, so an indoor room's events show
 * on its building and a stage's acts show on the stage rather than on whatever it stands on.
 *
 * An event can land in **more than one** bucket, and that is the honest answer rather than a
 * bug. Robowars is stored at the Open Air Theatre and belongs both on the theatre's pin — which
 * is what it is — and on the pin named Robowars, which is what people are looking for. The
 * Proshow belongs on its own pin and on the football ground it is held on: someone standing on
 * that ground taps the ground, and a popup that answers "Nothing listed right now" while the
 * night's acts are on it is wrong in the one place it most needs to be right.
 *
 * The highlight sets are keyed by every id involved, because they colour shapes as well as pins:
 * the proshow should light its own pin and the football ground it is held on.
 */
export function indexByVenue(events: ScheduleEvent[], now: Date) {
  const byPlace = new Map<string, ScheduleEvent[]>()
  const liveVenueIds = new Set<string>()
  const eventVenueIds = new Set<string>()
  for (const e of events) {
    const ids = [markerPlaceId(e.placeId), hostPlaceId(e.placeId), flagshipVenueOf(e)]
    // Every id gets the bucket, deduplicated: a room's host *is* its marker, so a room's
    // events are listed once on the building, while a stage's host is a separate shape and
    // gets the acts as well as the highlight.
    for (const id of new Set(ids.filter((id): id is string => id !== null))) {
      const list = byPlace.get(id)
      if (list) list.push(e)
      else byPlace.set(id, [e])
      const state = eventState(e, now)
      if (state === 'live') {
        liveVenueIds.add(id)
        eventVenueIds.add(id)
      } else if (state === 'upcoming') {
        eventVenueIds.add(id)
      }
    }
  }
  return { byPlace, liveVenueIds, eventVenueIds }
}
