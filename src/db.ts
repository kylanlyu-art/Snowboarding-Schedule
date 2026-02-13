import Dexie, { type EntityTable } from 'dexie'
import type { Config, Event } from './types'
import { defaultConfig } from './types'

export interface DBSchema {
  events: EntityTable<Event, 'id'>
  config: EntityTable<Config, 'id'>
}

class CoachScheduleDB extends Dexie {
  events!: DBSchema['events']
  config!: DBSchema['config']

  constructor() {
    super('CoachScheduleDB')

    this.version(1).stores({
      events: 'id, date, type, timeSlot',
      config: 'id',
    })
  }
}

export const db = new CoachScheduleDB()

const CONFIG_ID = 'default'

export async function getConfig(): Promise<Config> {
  const existing = await db.config.get(CONFIG_ID)
  if (existing) return existing

  const toSave: Config = { ...defaultConfig }
  await db.config.put({ ...(toSave as Config), id: CONFIG_ID } as any)
  return toSave
}

export async function saveConfig(config: Config): Promise<void> {
  await db.config.put({ ...(config as Config), id: CONFIG_ID } as any)
}

