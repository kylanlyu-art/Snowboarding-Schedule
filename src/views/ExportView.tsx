import { useState } from 'react'
import { getMonthEvents, getSeasonEvents, getEventsInRange } from '../services/events'
import { startOfDay } from '../utils/date'
import { exportEventsToCsv, downloadCsv } from '../services/csv'

type RangeType = 'month' | 'season' | 'custom'

export default function ExportView() {
  const [rangeType, setRangeType] = useState<RangeType>('season')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [exporting, setExporting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleExport() {
    setExporting(true)
    setMessage(null)
    try {
      let events: Awaited<ReturnType<typeof getMonthEvents>> = []
      if (rangeType === 'month') {
        events = await getMonthEvents()
      } else if (rangeType === 'season') {
        events = await getSeasonEvents()
      } else {
        if (!startDate || !endDate) {
          setMessage('请选择开始和结束日期')
          return
        }
        const start = new Date(startDate)
        const end = new Date(endDate)
        const days = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1
        if (days < 1) {
          setMessage('结束日期须大于等于开始日期')
          return
        }
        events = await getEventsInRange(startOfDay(start), days)
      }
      const csv = exportEventsToCsv(events)
      const filename = `教学数据_${new Date().toISOString().slice(0, 10)}.csv`
      downloadCsv(csv, filename)
      setMessage(`已导出 ${events.length} 条记录`)
    } catch (e) {
      console.error(e)
      setMessage('导出失败')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <div className="form" style={{ maxWidth: 480 }}>
        <div className="form-row">
          <label className="form-label">
            导出范围
            <select
              className="form-input"
              value={rangeType}
              onChange={(e) => setRangeType(e.target.value as RangeType)}
            >
              <option value="month">本月</option>
              <option value="season">本季（默认）</option>
              <option value="custom">自定义日期范围</option>
            </select>
          </label>
        </div>
        {rangeType === 'custom' && (
          <div className="form-row">
            <label className="form-label">
              开始日期
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
            <label className="form-label">
              结束日期
              <input
                type="date"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </label>
          </div>
        )}
        <div className="form-actions">
          <button
            type="button"
            className="primary-button"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? '导出中...' : '导出 CSV'}
          </button>
          {message && <span className="form-message">{message}</span>}
        </div>
      </div>
    </div>
  )
}
