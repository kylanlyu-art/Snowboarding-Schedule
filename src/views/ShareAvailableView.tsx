import { useEffect, useMemo, useState } from 'react'
import type { Event, TimeSlot } from '../types'
import { getEventsInRange } from '../services/events'
import { addDays, formatDateZh, formatWeekdayZh, startOfDay, toDateString } from '../utils/date'

type RangeOption = 7 | 14 | 30

export default function ShareAvailableView() {
  const [range, setRange] = useState<RangeOption>(7)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')

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

  const availability = useMemo(() => {
    const today = startOfDay(new Date())
    const timeSlots: TimeSlot[] = ['上午', '下午', '夜场', '全天']
    const byDate: Record<string, Event[]> = {}
    for (const e of events) {
      if (!byDate[e.date]) byDate[e.date] = []
      byDate[e.date].push(e)
    }

    const days: {
      dateObj: Date
      slots: Record<TimeSlot, { busy: boolean; events: Event[] }>
    }[] = []

    for (let i = 0; i < range; i++) {
      const d = addDays(today, i)
      const dateStr = toDateString(d)
      const dayEvents = (byDate[dateStr] ?? []).slice().sort((a, b) => a.startTime.localeCompare(b.startTime))
      const slots: Record<TimeSlot, { busy: boolean; events: Event[] }> = {
        上午: { busy: false, events: [] },
        下午: { busy: false, events: [] },
        夜场: { busy: false, events: [] },
        全天: { busy: false, events: [] },
      }
      for (const e of dayEvents) {
        slots[e.timeSlot].busy = true
        slots[e.timeSlot].events.push(e)
      }
      days.push({ dateObj: d, slots })
    }
    return days
  }, [events, range])

  async function generateText() {
    const lines: string[] = []
    lines.push('📅 近期可约时间', '')

    const timeSlots: TimeSlot[] = ['上午', '下午', '夜场', '全天']

    for (const day of availability) {
      lines.push(`${formatDateZh(day.dateObj)}（${formatWeekdayZh(day.dateObj)}）`)
      for (const slot of timeSlots) {
        const info = day.slots[slot]
        if (info.busy) {
          const venue = info.events[0]?.venue
          lines.push(venue ? `❌ ${slot} 已约（${venue}）` : `❌ ${slot} 已约`)
        } else {
          lines.push(`✅ ${slot}`)
        }
      }
      lines.push('')
    }

    const result = lines.join('\n').trimEnd()
    setText(result)
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(result)
      } catch {
        // ignore
      }
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: '#4b5563' }}>生成未来天数：</span>
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
        <button
          type="button"
          className="primary-button"
          onClick={generateText}
          disabled={loading}
        >
          生成分享文本并复制
        </button>
      </div>

      {loading ? (
        <div style={{ fontSize: 14, color: '#6b7280' }}>加载中...</div>
      ) : (
        <textarea
          className="form-textarea"
          rows={Math.min(availability.length * 5 + 4, 20)}
          value={text}
          placeholder="点击上方按钮生成可复制的空余时间文本"
          readOnly
          style={{ width: '100%', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}
        />
      )}
    </div>
  )
}

