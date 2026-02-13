import { Fragment, useEffect, useMemo, useState } from 'react'
import type { Event, TimeSlot } from '../types'
import { getWeekEvents } from '../services/events'
import { startOfWeek, toDateString, formatWeekdayZh } from '../utils/date'
import EventEditModal from '../components/EventEditModal'

interface DayGroup {
  date: string
  events: Event[]
}

export default function WeekView() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)
  const [editing, setEditing] = useState<Event | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const list = await getWeekEvents()
        if (!cancelled) setEvents(list)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [version])

  const weekDays: DayGroup[] = useMemo(() => {
    const start = startOfWeek(new Date())
    const days: DayGroup[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const dateStr = toDateString(d)
      const dayEvents = events.filter((e) => e.date === dateStr).sort((a, b) => a.startTime.localeCompare(b.startTime))
      days.push({ date: dateStr, events: dayEvents })
    }
    return days
  }, [events])

  const timeSlots: TimeSlot[] = ['上午', '下午', '夜场', '全天']

  return (
    <div>
      {loading ? (
        <div style={{ fontSize: 14, color: '#6b7280' }}>加载中...</div>
      ) : (
        <div className="timetable">
          <div className="timetable-grid timetable-grid--week">
            {/* 头部行：左上空 + 7 天 */}
            <div className="timetable-header-cell timetable-header-cell-muted" />
            {weekDays.map((day) => {
              const dateObj = new Date(day.date)
              return (
                <div key={day.date} className="timetable-header-cell">
                  <div>{day.date.slice(5)}</div>
                  <div className="timetable-header-cell-muted">{formatWeekdayZh(dateObj)}</div>
                </div>
              )
            })}

            {/* 四个时段行 */}
            {timeSlots.map((slot) => (
              <Fragment key={slot}>
                <div className="timetable-row-label">{slot}</div>
                {weekDays.map((day) => {
                  const groupedBySlot: Record<TimeSlot, Event[]> = {
                    上午: [],
                    下午: [],
                    夜场: [],
                    全天: [],
                  }
                  for (const e of day.events) {
                    groupedBySlot[e.timeSlot]?.push(e)
                  }
                  ;(Object.keys(groupedBySlot) as TimeSlot[]).forEach((s) => {
                    groupedBySlot[s].sort((a, b) => a.startTime.localeCompare(b.startTime))
                  })

                  const slotEvents = groupedBySlot[slot]

                  return (
                    <div
                      key={`${day.date}-${slot}`}
                      className="timetable-slot-cell"
                    >
                      {slotEvents.length === 0 ? (
                        <span className="timetable-empty">空闲</span>
                      ) : (
                        slotEvents.slice(0, 2).map((e) => (
                          <div
                            key={e.id}
                            className={`timetable-event timetable-event-${e.type}`}
                            onClick={() => setEditing(e)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="timetable-event-header">
                              <span className="timetable-event-title">{e.title}</span>
                            </div>
                            <div className="timetable-event-meta">
                              {e.venue && <span>{e.venue}</span>}
                            </div>
                          </div>
                        ))
                      )}
                      {slotEvents.length > 2 && (
                        <div className="timetable-event-meta" style={{ marginTop: 2 }}>
                          +{slotEvents.length - 2} 更多
                        </div>
                      )}
                    </div>
                  )
                })}
              </Fragment>
            ))}
          </div>
        </div>
      )}
      {editing && (
        <EventEditModal
          event={editing}
          onClose={() => setEditing(null)}
          onChanged={() => setVersion((v) => v + 1)}
        />
      )}
    </div>
  )
}

