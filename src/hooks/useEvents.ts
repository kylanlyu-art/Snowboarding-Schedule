import { useState, useEffect, useCallback } from 'react'
import type { Event, EventType, TimeSlot } from '../types'
import { supabase } from '../lib/supabase'
import { getConfig } from '../db'

/** Supabase 行 → 前端 Event */
function rowToEvent(row: Record<string, unknown>): Event {
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

/** 前端 Event → Supabase 插入/更新用对象（snake_case） */
function eventToRow(e: Partial<Event>, userId: string): Record<string, unknown> {
  const row: Record<string, unknown> = {
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
  return row
}

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    if (!supabase) {
      setLoading(false)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setUserId(null)
      setEvents([])
      setLoading(false)
      return
    }
    setUserId(user.id)
    setLoading(true)
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (!error && data) {
      setEvents(data.map((row) => rowToEvent(row)))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const addEvent = useCallback(
    async (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!supabase || !userId) return { error: new Error('未登录或未配置 Supabase') }
      const row = eventToRow(event, userId)
      const { error } = await supabase.from('events').insert(row)
      if (!error) await fetchEvents()
      return { error }
    },
    [userId, fetchEvents],
  )

  const updateEvent = useCallback(
    async (
      id: string,
      updates: Partial<Pick<Event, 'type' | 'title' | 'venue' | 'notes' | 'date' | 'timeSlot' | 'fee'>>,
    ) => {
      if (!supabase) return { error: new Error('未配置 Supabase') }
      const row: Record<string, unknown> = {}
      if (updates.type != null) row.type = updates.type
      if (updates.title != null) row.title = updates.title
      if (updates.venue != null) row.venue = updates.venue
      if (updates.notes != null) row.notes = updates.notes
      if (updates.date != null) row.date = updates.date
      if (updates.timeSlot != null) row.time_slot = updates.timeSlot
      if (updates.fee != null) row.fee = updates.fee
      if (updates.timeSlot != null) {
        const config = await getConfig()
        const slot = config.timeSlots[updates.timeSlot]
        row.start_time = slot.start
        row.end_time = slot.end
        row.duration = slot.hours
      }
      if (Object.keys(row).length === 0) return { error: null }
      const { error } = await supabase.from('events').update(row).eq('id', id)
      if (!error) await fetchEvents()
      return { error }
    },
    [fetchEvents],
  )

  const deleteEvent = useCallback(
    async (id: string) => {
      if (!supabase) return { error: new Error('未配置 Supabase') }
      const { error } = await supabase.from('events').delete().eq('id', id)
      if (!error) await fetchEvents()
      return { error }
    },
    [fetchEvents],
  )

  return {
    events,
    loading,
    userId,
    addEvent,
    updateEvent,
    deleteEvent,
    refresh: fetchEvents,
  }
}
