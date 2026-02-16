import { db, getConfig } from '../db'
import type { Config, Event, EventType, TimeSlot } from '../types'
import type { CsvRow } from './csv'
import {
  todayString,
  toDateString,
  startOfWeek,
  endOfWeek,
  addDays,
  startOfMonth,
  endOfMonth,
  startOfSeason,
  endOfSeason,
} from '../utils/date'
import { isSupabaseConfigured } from '../lib/supabase'
import {
  getSupabaseUserId,
  fetchEventsSupabase,
  fetchAllEvents,
  insertEventSupabase,
  updateEventSupabase,
  deleteEventSupabase,
} from '../lib/supabaseEvents'

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

interface BaseEventInput {
  date: string
  timeSlot: TimeSlot
  title: string
  venue?: string
  fee?: number
  notes?: string
}

async function buildEvent(
  type: EventType,
  input: BaseEventInput,
  overrideFeeStrategy?: (hours: number, baseFee: number | undefined, config: Config) => number | undefined,
): Promise<Event> {
  const config = await getConfig()
  const slotConfig = config.timeSlots[input.timeSlot]
  const now = new Date().toISOString()
  const hours = slotConfig.hours

  let fee = input.fee
  if (overrideFeeStrategy) {
    fee = overrideFeeStrategy(hours, fee, config)
  }

  return {
    id: generateId(),
    type,
    date: input.date,
    timeSlot: input.timeSlot,
    startTime: slotConfig.start,
    endTime: slotConfig.end,
    duration: hours,
    title: input.title,
    venue: input.venue,
    fee,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  }
}

async function useSupabase(): Promise<boolean> {
  return isSupabaseConfigured() && (await getSupabaseUserId()) != null
}

export async function addCourse(input: BaseEventInput): Promise<void> {
  const event = await buildEvent('课程', input, (hours, baseFee, config) => {
    if (typeof baseFee === 'number') return baseFee
    return hours >= 5 ? config.pricing.fullDay5h : config.pricing.standard3h
  })
  const userId = await getSupabaseUserId()
  if (userId) {
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = event
    await insertEventSupabase(userId, rest)
    return
  }
  await db.events.add(event)
}

export async function addPractice(input: BaseEventInput): Promise<void> {
  const event = await buildEvent('练活', input, () => undefined)
  const userId = await getSupabaseUserId()
  if (userId) {
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = event
    await insertEventSupabase(userId, rest)
    return
  }
  await db.events.add(event)
}

export async function addTraining(input: BaseEventInput): Promise<void> {
  const event = await buildEvent('培训', input, (_h, baseFee) => baseFee)
  const userId = await getSupabaseUserId()
  if (userId) {
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = event
    await insertEventSupabase(userId, rest)
    return
  }
  await db.events.add(event)
}

export async function getTodayEvents(): Promise<Event[]> {
  if (await useSupabase()) {
    const userId = await getSupabaseUserId()
    if (!userId) return []
    return fetchEventsSupabase(userId, { date: todayString() })
  }
  const date = todayString()
  return db.events.where('date').equals(date).sortBy('startTime')
}

export async function getWeekEvents(referenceDate = new Date()): Promise<Event[]> {
  const start = startOfWeek(referenceDate)
  const end = endOfWeek(referenceDate)
  const startStr = toDateString(start)
  const endStr = toDateString(end)
  if (await useSupabase()) {
    const userId = await getSupabaseUserId()
    if (!userId) return []
    return fetchEventsSupabase(userId, { startDate: startStr, endDate: endStr })
  }
  return db.events.where('date').between(startStr, endStr, true, true).sortBy('date')
}

export async function getEventsInRange(startDate: Date, days: number): Promise<Event[]> {
  const start = new Date(startDate)
  const end = addDays(start, days - 1)
  const startStr = toDateString(start)
  const endStr = toDateString(end)
  if (await useSupabase()) {
    const userId = await getSupabaseUserId()
    if (!userId) return []
    return fetchEventsSupabase(userId, { startDate: startStr, endDate: endStr })
  }
  return db.events.where('date').between(startStr, endStr, true, true).sortBy('date')
}

export async function getMonthEvents(referenceDate = new Date()): Promise<Event[]> {
  const start = startOfMonth(referenceDate)
  const end = endOfMonth(referenceDate)
  const startStr = toDateString(start)
  const endStr = toDateString(end)
  if (await useSupabase()) {
    const userId = await getSupabaseUserId()
    if (!userId) return []
    return fetchEventsSupabase(userId, { startDate: startStr, endDate: endStr })
  }
  return db.events.where('date').between(startStr, endStr, true, true).sortBy('date')
}

export async function getSeasonEvents(referenceDate = new Date()): Promise<Event[]> {
  const start = startOfSeason(referenceDate)
  const end = endOfSeason(referenceDate)
  const startStr = toDateString(start)
  const endStr = toDateString(end)
  if (await useSupabase()) {
    const userId = await getSupabaseUserId()
    if (!userId) return []
    return fetchEventsSupabase(userId, { startDate: startStr, endDate: endStr })
  }
  return db.events.where('date').between(startStr, endStr, true, true).sortBy('date')
}

export async function updateEvent(
  id: string,
  updates: Partial<Pick<Event, 'title' | 'venue' | 'notes' | 'date' | 'timeSlot' | 'fee' | 'type'>>,
): Promise<void> {
  const userId = await getSupabaseUserId()
  if (userId) {
    await updateEventSupabase(userId, id, updates)
    return
  }
  const existing = await db.events.get(id)
  if (!existing) return
  const config = await getConfig()
  const newTimeSlot = updates.timeSlot ?? existing.timeSlot
  const newType = updates.type ?? existing.type
  const slotConfig = config.timeSlots[newTimeSlot]
  const now = new Date().toISOString()
  await db.events.update(id, {
    type: newType,
    title: updates.title ?? existing.title,
    venue: updates.venue ?? existing.venue,
    notes: updates.notes ?? existing.notes,
    date: updates.date ?? existing.date,
    timeSlot: newTimeSlot,
    startTime: slotConfig.start,
    endTime: slotConfig.end,
    duration: slotConfig.hours,
    fee: updates.fee !== undefined ? updates.fee : existing.fee,
    updatedAt: now,
  })
}

export async function deleteEvent(id: string): Promise<void> {
  const userId = await getSupabaseUserId()
  if (userId) {
    await deleteEventSupabase(userId, id)
    return
  }
  await db.events.delete(id)
}

export async function getAllEvents(): Promise<Event[]> {
  const userId = await getSupabaseUserId()
  if (userId) {
    const list = await fetchAllEvents(userId)
    return list.sort((a, b) =>
      a.date !== b.date ? a.date.localeCompare(b.date) : a.startTime.localeCompare(b.startTime),
    )
  }
  const list = await db.events.toArray()
  return list.sort((a: Event, b: Event) =>
    a.date !== b.date ? a.date.localeCompare(b.date) : a.startTime.localeCompare(b.startTime),
  )
}

/** 仅从本地 IndexedDB 读取全部事件（用于迁移到云端） */
export async function getAllEventsFromLocal(): Promise<Event[]> {
  const list = await db.events.toArray()
  return list.sort((a, b) =>
    a.date !== b.date ? a.date.localeCompare(b.date) : a.startTime.localeCompare(b.startTime),
  )
}

export async function importEventsFromCsv(rows: CsvRow[]): Promise<{ ok: number; err: number }> {
  const config = await getConfig()
  const userId = await getSupabaseUserId()
  let ok = 0
  let err = 0
  for (const row of rows) {
    try {
      const slot: TimeSlot = '上午'
      const slotConfig = config.timeSlots[slot]
      const duration = row.duration ?? slotConfig.hours
      const event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'> = {
        type: row.type,
        date: row.date,
        timeSlot: slot,
        startTime: slotConfig.start,
        endTime: slotConfig.end,
        duration,
        title: row.title,
        venue: row.venue,
        fee: row.fee,
        notes: undefined,
      }
      if (userId) {
        await insertEventSupabase(userId, event)
      } else {
        const fullEvent: Event = {
          ...event,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        await db.events.add(fullEvent)
      }
      ok++
    } catch {
      err++
    }
  }
  return { ok, err }
}
