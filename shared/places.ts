import campus from '../src/data/generated/campus.json' with { type: 'json' }
import { festVenues, indoorPlaces } from '../src/data/festContent.ts'

// Every place an event can be held at: place id -> display name.
export const knownPlaces: ReadonlyMap<string, string> = new Map([
  ...campus.places.map((p) => [p.id, p.name] as const),
  ...indoorPlaces.map((p) => [p.id, p.name] as const),
  ...festVenues.map((p) => [p.id, p.name] as const),
])

/**
 * Places that turned out not to be places, and where their events actually are.
 *
 * OSM named a lawn "Aryabhatta Park", 47 m north of the ABC Auditorium Complex, and the three
 * halls inside that complex — Aryabhatta, Bhaskara and Chanakya, which is what ABC stands for
 * — were matched onto it. The user's correction: there is no Aryabhatta Park at NITC. The name
 * is dropped from the map data, and the venue matcher now sends the halls to the building.
 *
 * That leaves events already stored under the old id: rows in the schedule database, the
 * snapshot committed at public/api/schedule, and the copy cached in every attendee's browser,
 * which no server-side fix can reach. So the id is translated wherever an event is read — in
 * the service (`rowToEvent`) and in the app (`useSchedule`) — rather than only migrated.
 * Without that, those events say "Unknown venue" and route nowhere.
 *
 * An entry can be deleted once nothing anywhere is serving the old id, which for a cached
 * copy on a phone means never, strictly speaking. They are cheap; leave them.
 */
export const MOVED_PLACES: Readonly<Record<string, string>> = {
  aryabhatta_park: 'abc_auditorium_complex',
}

/** The place an id means today. Unknown and current ids pass through unchanged. */
export const currentPlaceId = (placeId: string): string => MOVED_PLACES[placeId] ?? placeId
