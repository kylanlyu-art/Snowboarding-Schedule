import { useEffect, useMemo, useState } from 'react'
import type { Event } from '../types'
import { getTodayEvents, getWeekEvents, getMonthEvents, getSeasonEvents } from '../services/events'
import { computeStats, type StatsResult } from '../services/stats'
import { startOfWeek, startOfSeason, endOfSeason, formatDateZh, formatDateZhLong, addDays } from '../utils/date'

type Scope = 'today' | 'week' | 'month' | 'season'

const fetchers: Record<Scope, () => Promise<Event[]>> = {
  today: getTodayEvents,
  week: getWeekEvents,
  month: getMonthEvents,
  season: getSeasonEvents,
}

interface Props {
  scope: Scope
}

function Bar({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2, fontSize: 12 }}>
        <span>{label}</span>
        <span style={{ color: '#6b7280' }}>{value}</span>
      </div>
      <div
        style={{
          height: 8,
          borderRadius: 4,
          background: '#e5e7eb',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: color,
            borderRadius: 4,
          }}
        />
      </div>
    </div>
  )
}

export default function StatsView({ scope }: Props) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [copyOk, setCopyOk] = useState(false)

  useEffect(() => {
    let cancelled = false
    const fetchEvents = fetchers[scope]
    async function load() {
      setLoading(true)
      try {
        const list = await fetchEvents()
        if (!cancelled) setEvents(list)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [scope])

  const stats: StatsResult = useMemo(() => computeStats(events), [events])

  const weeklyTrend = useMemo(() => {
    if (scope !== 'month' && scope !== 'season') return []
    const byWeek: Record<string, { count: number; income: number }> = {}
    for (const e of events) {
      const weekStart = startOfWeek(new Date(e.date))
      const key = weekStart.toISOString().slice(0, 10)
      if (!byWeek[key]) byWeek[key] = { count: 0, income: 0 }
      byWeek[key].count += 1
      byWeek[key].income += e.fee ?? 0
    }
    return Object.entries(byWeek)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, v]) => {
        const start = new Date(key)
        const end = addDays(start, 6)
        return {
          label: `${formatDateZh(start)}-${formatDateZh(end)}`,
          count: v.count,
          income: v.income,
        }
      })
  }, [events, scope])

  const monthlyTrend = useMemo(() => {
    if (scope !== 'season') return []
    const byMonth: Record<string, { count: number; income: number }> = {}
    for (const e of events) {
      const key = e.date.slice(0, 7)
      if (!byMonth[key]) byMonth[key] = { count: 0, income: 0 }
      byMonth[key].count += 1
      byMonth[key].income += e.fee ?? 0
    }
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, v]) => {
        const [, m] = key.split('-')
        return { label: `${parseInt(m, 10)}月`, count: v.count, income: v.income }
      })
  }, [events, scope])

  const typeMax = Math.max(
    stats.courseCount,
    stats.practiceCount,
    stats.trainingCount,
    1,
  )
  const venueEntries = Object.entries(stats.venueDays).sort((a, b) => b[1] - a[1])
  const venueMax = venueEntries.length ? Math.max(...venueEntries.map(([, v]) => v)) : 1
  const trendData = scope === 'season' ? monthlyTrend : weeklyTrend
  const trendMax = trendData.length ? Math.max(...trendData.map((d) => d.count)) : 1

  const seasonRange =
    scope === 'season'
      ? (() => {
          const now = new Date()
          const start = startOfSeason(now)
          const end = endOfSeason(now)
          return `${formatDateZhLong(start)} - ${formatDateZhLong(end)}`
        })()
      : null

  const seasonSummaryText =
    scope === 'season'
      ? `本季共 ${stats.totalDays} 天有安排，教学 ${stats.totalTeachingHours.toFixed(1)} 小时、收入 ${stats.totalIncome} 元，累计 ${stats.studentNames.length} 名学员。培训 ${stats.trainingCount} 次、${stats.trainingHours.toFixed(1)} 小时、花费 ${stats.trainingCost} 元。`
      : null

  async function copySeasonSummary() {
    if (!seasonSummaryText) return
    try {
      await navigator.clipboard.writeText(seasonSummaryText)
      setCopyOk(true)
      setTimeout(() => setCopyOk(false), 2000)
    } catch {
      setCopyOk(false)
    }
  }

  if (loading) {
    return <div style={{ fontSize: 14, color: '#6b7280' }}>加载中...</div>
  }

  return (
    <div>
      {scope === 'season' && seasonRange && (
        <div className="event-card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>本季范围</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>{seasonRange}</div>
          <p style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.6, color: '#374151' }}>
            {seasonSummaryText}
          </p>
          <button
            type="button"
            className="secondary-button"
            onClick={copySeasonSummary}
            style={{ fontSize: 13 }}
          >
            {copyOk ? '已复制' : '复制本季汇总'}
          </button>
        </div>
      )}

      <div className="stats-kpi-grid" style={{ marginBottom: 12 }}>
        <div className="stats-kpi-card">
          <div className="stats-kpi-value">{stats.totalTeachingHours.toFixed(1)}</div>
          <div className="stats-kpi-label">教学课时（小时）</div>
        </div>
        <div className="stats-kpi-card">
          <div className="stats-kpi-value">{stats.totalIncome}</div>
          <div className="stats-kpi-label">总收入（元）</div>
        </div>
        <div className="stats-kpi-card">
          <div className="stats-kpi-value">{stats.totalDays}</div>
          <div className="stats-kpi-label">有安排（天）</div>
        </div>
        <div className="stats-kpi-card">
          <div className="stats-kpi-value">{stats.studentNames.length}</div>
          <div className="stats-kpi-label">累计学员（名）</div>
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <div className="stats-kpi-card" style={{ display: 'inline-block', minWidth: 220 }}>
          <div className="stats-kpi-label" style={{ marginBottom: 4 }}>培训（含训练营、考试、找老师上课等）</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
            参加 {stats.trainingCount} 次
          </div>
          <div style={{ fontSize: 14, color: '#374151', marginTop: 2 }}>
            {stats.trainingHours.toFixed(1)} 小时
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
            花费 {stats.trainingCost} 元
          </div>
        </div>
      </div>

      <div className="stats-charts-grid" style={{ marginBottom: 20 }}>
        <div className="event-card" style={{ padding: 14 }}>
          <div className="stats-section-title">活动类型分布</div>
          <Bar
            value={stats.courseCount}
            max={typeMax}
            label="课程"
            color="#22c55e"
          />
          <Bar
            value={stats.practiceCount}
            max={typeMax}
            label="练活"
            color="#3b82f6"
          />
          <Bar
            value={stats.trainingCount}
            max={typeMax}
            label="培训"
            color="#a855f7"
          />
        </div>
        <div className="event-card" style={{ padding: 14 }}>
          <div className="stats-section-title">场地分布</div>
          {venueEntries.length === 0 ? (
            <div style={{ fontSize: 12, color: '#6b7280' }}>暂无</div>
          ) : (
            venueEntries.map(([venue, days]) => (
              <Bar
                key={venue}
                value={days}
                max={venueMax}
                label={venue}
                color="#6366f1"
              />
            ))
          )}
        </div>
      </div>

      {(scope === 'month' || scope === 'season') && trendData.length > 0 && (
        <div className="event-card" style={{ padding: 14, marginBottom: 20 }}>
          <div className="stats-section-title">
            {scope === 'season' ? '按月趋势（场次 + 收入）' : '按周趋势'}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 8,
              height: scope === 'season' ? 140 : 120,
            }}
          >
            {trendData.map((d) => (
              <div
                key={d.label}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    maxWidth: 32,
                    height: `${(d.count / trendMax) * 80}px`,
                    minHeight: d.count > 0 ? 4 : 0,
                    background: '#f97316',
                    borderRadius: '4px 4px 0 0',
                  }}
                />
                <div style={{ fontSize: 10, color: '#6b7280', marginTop: 4 }}>{d.label}</div>
                <div style={{ fontSize: 10, color: '#6b7280' }}>{d.count} 节</div>
                {scope === 'season' && 'income' in d && d.income > 0 && (
                  <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 600, marginTop: 2 }}>
                    {d.income} 元
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="event-card" style={{ padding: 14 }}>
        <div className="stats-section-title">学员排行（按上课次数）</div>
        {stats.studentRanking.length === 0 ? (
          <div style={{ fontSize: 12, color: '#6b7280' }}>暂无</div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
            {stats.studentRanking.map((s, i) => (
              <li key={s.name} style={{ marginBottom: 4 }}>
                <span style={{ color: '#6b7280', marginRight: 8 }}>{i + 1}.</span>
                <span>{s.name}</span>
                <span style={{ color: '#6b7280', marginLeft: 8 }}>{s.count} 节</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
