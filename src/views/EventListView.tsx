import { useEffect, useState } from 'react'
import type { Event } from '../types'
import { getMonthEvents, getSeasonEvents, getAllEvents } from '../services/events'
import { formatDateZh, formatWeekdayZh } from '../utils/date'
import EventEditModal from '../components/EventEditModal'

type RangeType = 'month' | 'season' | 'all'

export default function EventListView() {
  const [range, setRange] = useState<RangeType>('season')
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)
  const [editing, setEditing] = useState<Event | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const list =
          range === 'month'
            ? await getMonthEvents()
            : range === 'season'
              ? await getSeasonEvents()
              : await getAllEvents()
        if (!cancelled) setEvents(list)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [range, version])

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: '#4b5563' }}>显示范围：</span>
        {(['month', 'season', 'all'] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className="secondary-button"
            style={
              range === r ? { backgroundColor: '#111827', color: '#f9fafb', borderColor: '#111827' } : {}
            }
          >
            {r === 'month' ? '本月' : r === 'season' ? '本季' : '全部'}
          </button>
        ))}
        <span style={{ fontSize: 12, color: '#6b7280' }}>共 {events.length} 条，点击某条可编辑</span>
      </div>

      {loading ? (
        <div style={{ fontSize: 14, color: '#6b7280' }}>加载中...</div>
      ) : events.length === 0 ? (
        <div style={{ fontSize: 14, color: '#6b7280' }}>该范围内暂无事件</div>
      ) : (
        <div className="timetable" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                <th style={{ textAlign: 'left', padding: '8px 10px' }}>日期</th>
                <th style={{ textAlign: 'left', padding: '8px 10px' }}>类型</th>
                <th style={{ textAlign: 'left', padding: '8px 10px' }}>时段</th>
                <th style={{ textAlign: 'left', padding: '8px 10px' }}>标题</th>
                <th style={{ textAlign: 'left', padding: '8px 10px' }}>场地</th>
                <th style={{ textAlign: 'left', padding: '8px 10px' }}>时长</th>
                <th style={{ textAlign: 'left', padding: '8px 10px' }}>收入/花费</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => {
                const d = new Date(e.date)
                return (
                  <tr
                    key={e.id}
                    onClick={() => setEditing(e)}
                    style={{
                      borderBottom: '1px solid #e5e7eb',
                      cursor: 'pointer',
                    }}
                    className="event-list-row"
                  >
                    <td style={{ padding: '8px 10px' }}>
                      {formatDateZh(d)}（{formatWeekdayZh(d)}）
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span className={`event-type-tag event-type-${e.type}`}>{e.type}</span>
                    </td>
                    <td style={{ padding: '8px 10px' }}>{e.timeSlot}</td>
                    <td style={{ padding: '8px 10px' }}>{e.title}</td>
                    <td style={{ padding: '8px 10px', color: '#6b7280' }}>{e.venue ?? '—'}</td>
                    <td style={{ padding: '8px 10px', color: '#6b7280' }}>{e.duration} 小时</td>
                    <td style={{ padding: '8px 10px', color: '#6b7280' }}>
                      {e.fee != null
                        ? e.type === '培训'
                          ? `花费 ${e.fee} 元`
                          : `收入 ${e.fee} 元`
                        : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
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
