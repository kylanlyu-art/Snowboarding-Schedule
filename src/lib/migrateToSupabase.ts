import { supabase } from './supabase'
import { getAllEventsFromLocal } from '../services/events'
import { insertEventSupabase } from './supabaseEvents'

const MIGRATION_FLAG = 'ski-schedule-migrated-v1'

export function isMigrationDone(): boolean {
  return localStorage.getItem(MIGRATION_FLAG) === 'true'
}

export function setMigrationDone(): void {
  localStorage.setItem(MIGRATION_FLAG, 'true')
}

/** 将本地 IndexedDB 事件一次性迁移到 Supabase，并标记已迁移 */
export async function migrateLocalToSupabase(userId: string): Promise<{ ok: number; err: number }> {
  if (!supabase || isMigrationDone()) return { ok: 0, err: 0 }
  const localEvents = await getAllEventsFromLocal()
  let ok = 0
  let err = 0
  for (const e of localEvents) {
    try {
      await insertEventSupabase(userId, {
        type: e.type,
        date: e.date,
        timeSlot: e.timeSlot,
        startTime: e.startTime,
        endTime: e.endTime,
        duration: e.duration,
        title: e.title,
        venue: e.venue,
        fee: e.fee,
        notes: e.notes,
      })
      ok++
    } catch {
      err++
    }
  }
  setMigrationDone()
  return { ok, err }
}
