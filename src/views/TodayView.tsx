import { Fragment, useEffect, useMemo, useState } from 'react'
import type { Event, TimeSlot } from '../types'
import { getTodayEvents } from '../services/events'
import { todayString, formatWeekdayZh } from '../utils/date'
import EventEditModal from '../components/EventEditModal'

export default function TodayView() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)
  const [editing, setEditing] = useState<Event | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const list = await getTodayEvents()
        if (!cancelled) {
          setEvents(list)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [version])

  const today = todayString()
  const todayDate = useMemo(() => new Date(), [])
  const totalDuration = events.reduce((sum, e) => sum + (e.duration || 0), 0)

  const timeSlots: TimeSlot[] = ['上午', '下午', '夜场', '全天']
  const eventsBySlot: Record<TimeSlot, Event[]> = useMemo(() => {
    const grouped: Record<TimeSlot, Event[]> = {
      上午: [],
      下午: [],
      夜场: [],
      全天: [],
    }
    for (const e of events) {
      grouped[e.timeSlot]?.push(e)
    }
    ;(Object.keys(grouped) as TimeSlot[]).forEach((slot) => {
      grouped[slot].sort((a, b) => a.startTime.localeCompare(b.startTime))
    })
    return grouped
  }, [events])

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>
            {today}{' '}
            <span style={{ fontSize: 14, color: '#6b7280' }}>（{formatWeekdayZh(todayDate)}）</span>
          </div>
          <div style={{ marginTop: 4, fontSize: 13, color: '#4b5563' }}>
            共 {events.length} 个事件 · 总时长 {totalDuration.toFixed(1)} 小时
          </div>
        </div>
      </div>
      {loading ? (
        <div style={{ fontSize: 14, color: '#6b7280' }}>加载中...</div>
      ) : events.length === 0 ? (
        <div style={{ fontSize: 14, color: '#6b7280' }}>今天还没有安排，可以先添加一节课程。</div>
      ) : (
        <div className="timetable">
          <div className="timetable-grid timetable-grid--today">
            {/* 头部行：空 + 今天 */}
            <div className="timetable-header-cell timetable-header-cell-muted" />
            <div className="timetable-header-cell">今天</div>

            {/* 四个时段行 */}
            {timeSlots.map((slot) => (
              <Fragment key={slot}>
                <div className="timetable-row-label">{slot}</div>
                <div className="timetable-slot-cell">
                  {eventsBySlot[slot].length === 0 ? (
                    <span className="timetable-empty">空闲</span>
                  ) : (
                    eventsBySlot[slot].map((e) => (
                      <div
                        key={e.id}
                        className={`timetable-event timetable-event-${e.type}`}
                        onClick={() => setEditing(e)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="timetable-event-header">
                          <span className="timetable-event-title">{e.title}</span>
                          <span className="event-time">
                            {e.startTime} - {e.endTime}
                          </span>
                        </div>
                        <div className="timetable-event-meta">
                          {e.venue && <span>{e.venue}</span>}
                          <span>{e.duration} 小时</span>
                          {e.notes && <span>{e.notes}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
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

