export type EventType = '课程' | '试课' | '练活' | '培训'

export type TimeSlot = '上午' | '下午' | '夜场' | '全天'

export interface Event {
  id: string
  type: EventType
  date: string // YYYY-MM-DD
  timeSlot: TimeSlot
  startTime: string // HH:mm
  endTime: string // HH:mm
  duration: number // hours
  title: string // 学员名 / 项目名 / 备注
  venue?: string
  fee?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface TimeSlotConfigItem {
  start: string
  end: string
  hours: number
}

export interface PricingConfig {
  hourlyRate: number
  standard3h: number
  fullDay5h: number
  trialClass: number
}

export interface EventTypeConfigItem {
  billable: boolean
  color: string
}

export interface Config {
  timeSlots: Record<TimeSlot, TimeSlotConfigItem>
  pricing: PricingConfig
  eventTypes: Record<EventType, EventTypeConfigItem>
}

export const defaultConfig: Config = {
  timeSlots: {
    上午: {
      start: '08:30',
      end: '12:00',
      hours: 3,
    },
    下午: {
      start: '13:00',
      end: '16:30',
      hours: 3,
    },
    夜场: {
      start: '18:30',
      end: '21:30',
      hours: 3,
    },
    全天: {
      start: '08:30',
      end: '16:30',
      hours: 5,
    },
  },
  pricing: {
    hourlyRate: 500,
    standard3h: 1500,
    fullDay5h: 2500,
    trialClass: 1000,
  },
  eventTypes: {
    课程: {
      billable: true,
      color: '#4CAF50',
    },
    试课: {
      billable: true,
      color: '#FFC107',
    },
    练活: {
      billable: false,
      color: '#2196F3',
    },
    培训: {
      billable: false,
      color: '#9C27B0',
    },
  },
}

