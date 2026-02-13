import { Fragment, useEffect, useMemo, useState } from 'react'
import type { Event, TimeSlot } from '../types'
import { getEventsInRange } from '../services/events'
import { addDays, formatDateZh, formatWeekdayZh, startOfDay, toDateString } from '../utils/date'
import EventEditModal from '../components/EventEditModal'

const DEFAULT_DAYS = 30
const DAY_OPTIONS = [7, 14, 30, 60]

export default function ScheduleView() {
  const [days, setDays] = useState(DEFAULT_DAYS)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)
  const [editing, setEditing] = useState<Event | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const today = startOfDay(new Date())
        const list = await getEventsInRange(today, days)
        if (!cancelled) setEvents(list)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [days, version])

  const byDate = useMemo(() => {
    const map: Record<string, Event[]> = {}
    for (const e of events) {
      if (!map[e.date]) map[e.date] = []
      map[e.date].push(e)
    }
    Object.keys(map).forEach((d) => map[d].sort((a, b) => a.startTime.localeCompare(b.startTime)))
    return map
  }, [events])

  const dateList = useMemo(() => {
    const today = startOfDay(new Date())
    const list: string[] = []
    for (let i = 0; i < days; i++) {
      list.push(toDateString(addDays(today, i)))
    }
    return list
  }, [days])

  const timeSlots: TimeSlot[] = ['上午', '下午', '夜场', '全天']

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: '#4b5563' }}>未来天数：</span>
        {DAY_OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setDays(n)}
            className="secondary-button"
            style={
              days === n ? { backgroundColor: '#111827', color: '#f9fafb', borderColor: '#111827' } : {}
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
          <div
            className="timetable-grid"
            style={{ gridTemplateColumns: `80px repeat(${Math.min(dateList.length, 7)}, minmax(0, 1fr))` }}
          >
            <div className="timetable-header-cell timetable-header-cell-muted" />
            {dateList.slice(0, 7).map((dateStr) => {
              const d = new Date(dateStr)
              return (
                <div key={dateStr} className="timetable-header-cell">
                  <div>{formatDateZh(d)}</div>
                  <div className="timetable-header-cell-muted">{formatWeekdayZh(d)}</div>
                </div>
              )
            })}
            {timeSlots.map((slot) => (
              <Fragment key={slot}>
                <div className="timetable-row-label">{slot}</div>
                {dateList.slice(0, 7).map((dateStr) => {
                  const dayEvents = (byDate[dateStr] ?? []).filter((e) => e.timeSlot === slot)
                  return (
                    <div key={`${dateStr}-${slot}`} className="timetable-slot-cell">
                      {dayEvents.length === 0 ? (
                        <span className="timetable-empty">空闲</span>
                      ) : (
                        dayEvents.map((e) => (
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
                    </div>
                  )
                })}
              </Fragment>
            ))}
          </div>
        </div>
      )}
      {dateList.length > 7 && (
        <p style={{ marginTop: 12, fontSize: 12, color: '#6b7280' }}>
          仅展示前 7 天网格；共 {events.length} 个事件分布在 {Object.keys(byDate).length} 天，可在下方按日期查看全部。
        </p>
      )}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>按日期列表</div>
        {dateList.filter((d) => (byDate[d]?.length ?? 0) > 0).length === 0 ? (
          <div style={{ fontSize: 13, color: '#6b7280' }}>未来 {days} 天内暂无安排</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {dateList.map((dateStr) => {
              const dayEvents = byDate[dateStr]
              if (!dayEvents?.length) return null
              const d = new Date(dateStr)
              return (
                <div key={dateStr} className="event-card">
                  <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                    {formatDateZh(d)}（{formatWeekdayZh(d)}）
                  </div>
                  <div className="event-list">
                    {dayEvents.map((e) => (
                      <div
                        key={e.id}
                        className={`timetable-event timetable-event-${e.type}`}
                        onClick={() => setEditing(e)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="timetable-event-header">
                          <span className="timetable-event-title">{e.title}</span>
                          <span className="event-time">
                            {e.timeSlot} {e.startTime}-{e.endTime}
                          </span>
                        </div>
                        <div className="timetable-event-meta">
                          {e.venue && <span>{e.venue}</span>}
                          <span>{e.duration} 小时</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
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
