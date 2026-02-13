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

export async function addCourse(input: BaseEventInput): Promise<void> {
  const event = await buildEvent('课程', input, (hours, baseFee, config) => {
    if (typeof baseFee === 'number') return baseFee
    return hours >= 5 ? config.pricing.fullDay5h : config.pricing.standard3h
  })
  await db.events.add(event)
}

export async function addPractice(input: BaseEventInput): Promise<void> {
  const event = await buildEvent('练活', input, () => undefined)
  await db.events.add(event)
}

export async function addTraining(input: BaseEventInput): Promise<void> {
  const event = await buildEvent('培训', input, (_h, baseFee) => baseFee)
  await db.events.add(event)
}

export async function getTodayEvents(): Promise<Event[]> {
  const date = todayString()
  const list = await db.events.where('date').equals(date).sortBy('startTime')
  return list
}

export async function getWeekEvents(referenceDate = new Date()): Promise<Event[]> {
  const start = startOfWeek(referenceDate)
  const end = endOfWeek(referenceDate)
  const startStr = toDateString(start)
  const endStr = toDateString(end)
  const list = await db.events
    .where('date')
    .between(startStr, endStr, true, true)
    .sortBy('date')
  return list
}

export async function getEventsInRange(startDate: Date, days: number): Promise<Event[]> {
  const start = new Date(startDate)
  const end = addDays(start, days - 1)
  const startStr = toDateString(start)
  const endStr = toDateString(end)
  const list = await db.events
    .where('date')
    .between(startStr, endStr, true, true)
    .sortBy('date')
  return list
}

export async function getMonthEvents(referenceDate = new Date()): Promise<Event[]> {
  const start = startOfMonth(referenceDate)
  const end = endOfMonth(referenceDate)
  const startStr = toDateString(start)
  const endStr = toDateString(end)
  return db.events.where('date').between(startStr, endStr, true, true).sortBy('date')
}

export async function getSeasonEvents(referenceDate = new Date()): Promise<Event[]> {
  const start = startOfSeason(referenceDate)
  const end = endOfSeason(referenceDate)
  const startStr = toDateString(start)
  const endStr = toDateString(end)
  return db.events.where('date').between(startStr, endStr, true, true).sortBy('date')
}

export async function updateEvent(
  id: string,
  updates: Partial<Pick<Event, 'title' | 'venue' | 'notes' | 'date' | 'timeSlot' | 'fee' | 'type'>>,
): Promise<void> {
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
  await db.events.delete(id)
}

export async function getAllEvents(): Promise<Event[]> {
  const list = await db.events.toArray()
  return list.sort((a, b) =>
    a.date !== b.date ? a.date.localeCompare(b.date) : a.startTime.localeCompare(b.startTime),
  )
}

export async function importEventsFromCsv(rows: CsvRow[]): Promise<{ ok: number; err: number }> {
  const config = await getConfig()
  let ok = 0
  let err = 0
  for (const row of rows) {
    try {
      const slot: TimeSlot = '上午'
      const slotConfig = config.timeSlots[slot]
      const duration = row.duration ?? slotConfig.hours
      const event: Event = {
        id: generateId(),
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await db.events.add(event)
      ok++
    } catch {
      err++
    }
  }
  return { ok, err }
}


