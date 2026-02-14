import { Fragment, useEffect, useMemo, useState } from 'react'
import type { Event, TimeSlot } from '../types'
import { getEventsInRange } from '../services/events'
import { addDays, formatDateZh, formatWeekdayZh, startOfDay, toDateString } from '../utils/date'

type RangeOption = 7 | 14 | 30

interface DayAvailability {
  date: string
  dateObj: Date
  slots: Record<
    TimeSlot,
    {
      busy: boolean
      events: Event[]
    }
  >
}

export default function AvailableView() {
  const [range, setRange] = useState<RangeOption>(7)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const today = startOfDay(new Date())
        const list = await getEventsInRange(today, range)
        if (!cancelled) setEvents(list)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [range])

  const days: DayAvailability[] = useMemo(() => {
    const today = startOfDay(new Date())
    const byDate: Record<string, Event[]> = {}
    for (const e of events) {
      if (!byDate[e.date]) byDate[e.date] = []
      byDate[e.date].push(e)
    }

    const list: DayAvailability[] = []
    for (let i = 0; i < range; i++) {
      const d = addDays(today, i)
      const dateStr = toDateString(d)
      const dayEvents = (byDate[dateStr] ?? []).slice().sort((a, b) => a.startTime.localeCompare(b.startTime))
      const slots: DayAvailability['slots'] = {
        上午: { busy: false, events: [] },
        下午: { busy: false, events: [] },
        夜场: { busy: false, events: [] },
        全天: { busy: false, events: [] },
      }
      for (const e of dayEvents) {
        slots[e.timeSlot].busy = true
        slots[e.timeSlot].events.push(e)
      }
      list.push({ date: dateStr, dateObj: d, slots })
    }
    return list
  }, [events, range])

  const timeSlots: TimeSlot[] = ['上午', '下午', '夜场', '全天']

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: '#4b5563' }}>查看未来天数：</span>
        {[7, 14, 30].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRange(n as RangeOption)}
            className="secondary-button"
            style={
              range === n
                ? { backgroundColor: '#111827', color: '#f9fafb', borderColor: '#111827' }
                : {}
            }
          >
            {n} 天
          </button>
        ))}
      </div>
      {loading ? (
        <div style={{ fontSize: 14, color: '#6b7280' }}>加载中...</div>
      ) : (
        <div className="timetable">
          <div className="timetable-grid timetable-grid--week">
            <div className="timetable-header-cell timetable-header-cell-muted" />
            {days.map((day) => (
              <div key={day.date} className="timetable-header-cell">
                <div>{formatDateZh(day.dateObj)}</div>
                <div className="timetable-header-cell-muted">{formatWeekdayZh(day.dateObj)}</div>
              </div>
            ))}

            {timeSlots.map((slot) => (
              <Fragment key={slot}>
                <div className="timetable-row-label">{slot}</div>
                {days.map((day) => {
                  const info = day.slots[slot]
                  return (
                    <div key={`${day.date}-${slot}`} className="timetable-slot-cell">
                      {info.busy ? (
                        <span className="timetable-empty" style={{ color: '#b91c1c' }}>
                          ❌ 已约{info.events[0]?.venue ? `（${info.events[0].venue}）` : ''}
                        </span>
                      ) : (
                        <span className="timetable-empty" style={{ color: '#16a34a' }}>
                          ✅ 可约
                        </span>
                      )}
                    </div>
                  )
                })}
              </Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

