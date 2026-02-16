import type { Event, EventType, TimeSlot } from '../types'
import { supabase } from './supabase'
import { getConfig } from '../db'

/** Supabase 行 → 前端 Event */
export function rowToEvent(row: Record<string, unknown>): Event {
  return {
    id: String(row.id),
    type: row.type as EventType,
    date: String(row.date),
    timeSlot: row.time_slot as TimeSlot,
    startTime: String(row.start_time),
    endTime: String(row.end_time),
    duration: Number(row.duration),
    title: String(row.title),
    venue: row.venue != null ? String(row.venue) : undefined,
    fee: row.fee != null ? Number(row.fee) : undefined,
    notes: row.notes != null ? String(row.notes) : undefined,
    createdAt: new Date(row.created_at as string).toISOString(),
    updatedAt: new Date(row.updated_at as string).toISOString(),
  }
}

/** 前端 Event → Supabase 插入用（snake_case），不含 id 让 DB 生成或传 id */
export function eventToRow(e: Partial<Event>, userId: string): Record<string, unknown> {
  return {
    user_id: userId,
    type: e.type,
    date: e.date,
    time_slot: e.timeSlot,
    start_time: e.startTime,
    end_time: e.endTime,
    duration: e.duration,
    title: e.title,
    venue: e.venue ?? null,
    fee: e.fee ?? null,
    notes: e.notes ?? null,
  }
}

export async function getSupabaseUserId(): Promise<string | null> {
  if (!supabase) return null
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

export async function fetchAllEvents(userId: string): Promise<Event[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })
  if (error || !data) return []
  return data.map((row) => rowToEvent(row))
}

export async function fetchEventsSupabase(
  userId: string,
  filter: { date?: string; startDate?: string; endDate?: string },
): Promise<Event[]> {
  const all = await fetchAllEvents(userId)
  if (filter.date) return all.filter((e) => e.date === filter.date)
  if (filter.startDate && filter.endDate) {
    return all.filter((e) => e.date >= filter.startDate! && e.date <= filter.endDate!)
  }
  return all
}

export async function insertEventSupabase(userId: string, event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
  if (!supabase) return
  const row = eventToRow(event, userId)
  await supabase.from('events').insert(row)
}

export async function updateEventSupabase(
  userId: string,
  id: string,
  updates: Partial<Pick<Event, 'type' | 'title' | 'venue' | 'notes' | 'date' | 'timeSlot' | 'fee' | 'startTime' | 'endTime' | 'duration'>>,
): Promise<void> {
  if (!supabase) return
  const row: Record<string, unknown> = {}
  if (updates.type != null) row.type = updates.type
  if (updates.title != null) row.title = updates.title
  if (updates.venue != null) row.venue = updates.venue
  if (updates.notes != null) row.notes = updates.notes
  if (updates.date != null) row.date = updates.date
  if (updates.timeSlot != null) {
    const config = await getConfig()
    const slot = config.timeSlots[updates.timeSlot]
    row.start_time = slot.start
    row.end_time = slot.end
    row.duration = slot.hours
  }
  if (updates.startTime != null) row.start_time = updates.startTime
  if (updates.endTime != null) row.end_time = updates.endTime
  if (updates.duration != null) row.duration = updates.duration
  if (updates.fee != null) row.fee = updates.fee
  if (Object.keys(row).length === 0) return
  await supabase.from('events').update(row).eq('id', id).eq('user_id', userId)
}

export async function deleteEventSupabase(userId: string, id: string): Promise<void> {
  if (!supabase) return
  await supabase.from('events').delete().eq('id', id).eq('user_id', userId)
}
