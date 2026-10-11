import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { currentPlaceId } from '../../shared/places.ts'
import type { ScheduleEvent } from '../../shared/schedule.ts'
import { fetchSchedule } from './api.ts'
import { loadCachedSchedule, saveCachedSchedule, type CachedSchedule } from './cache.ts'
import { useNow } from './useNow.ts'

const POLL_MS = 30_000
const STALE_MS = 2 * 60_000
const NO_EVENTS: ScheduleEvent[] = []

export function useSchedule(): { events: ScheduleEvent[]; fetchedAt: number | null; stale: boolean } {
  const [cached, setCached] = useState<CachedSchedule | null>(() => loadCachedSchedule())
  const etagRef = useRef<string | null>(cached?.etag ?? null)
  const now = useNow()

  const refresh = useCallback(async () => {
    try {
      const res = await fetchSchedule(etagRef.current)
      if (res.status === 'ok') {
        etagRef.current = res.etag
        const next = { data: res.data, etag: res.etag, fetchedAt: Date.now() }
        saveCachedSchedule(next)
        setCached(next)
      } else {
        setCached((prev) => (prev ? { ...prev, fetchedAt: Date.now() } : prev))
      }
    } catch {
      // keep showing the previous data
    }
  }, [])

  useEffect(() => {
    let timer: number | undefined
    const stop = () => {
      window.clearInterval(timer)
      timer = undefined
    }
    const start = () => {
      stop()
      timer = window.setInterval(() => void refresh(), POLL_MS)
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refresh()
        start()
      } else {
        stop()
      }
    }
    if (document.visibilityState === 'visible') {
      void refresh()
      start()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [refresh])

  // A retired place is translated here as well as in the service, because this copy may not
  // have come from the service: it can be the snapshot committed into the build, or the one
  // in this browser's storage from a previous fest day. Neither can be fixed by a migration.
  const events = useMemo(() => {
    const raw = cached?.data.events ?? NO_EVENTS
    return raw.some((e) => currentPlaceId(e.placeId) !== e.placeId)
      ? raw.map((e) => ({ ...e, placeId: currentPlaceId(e.placeId) }))
      : raw
  }, [cached])

  const fetchedAt = cached?.fetchedAt ?? null
  return {
    events,
    fetchedAt,
    stale: fetchedAt === null || now.getTime() - fetchedAt > STALE_MS,
  }
}
