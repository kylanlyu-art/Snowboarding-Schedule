import Dexie, { type EntityTable } from 'dexie'
import type { Config, Event } from './types'
import { defaultConfig } from './types'

/** 存入 IndexedDB 的配置带 id；对外接口仍用 Config */
export interface StoredConfig extends Config {
  id: string
}

export interface DBSchema {
  events: EntityTable<Event, 'id'>
  config: EntityTable<StoredConfig, 'id'>
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

  const toSave: StoredConfig = { ...defaultConfig, id: CONFIG_ID }
  await db.config.put(toSave)
  return toSave
}

export async function saveConfig(config: Config): Promise<void> {
  const stored: StoredConfig = { ...config, id: CONFIG_ID }
  await db.config.put(stored)
}

