import { useEffect, useState, type FormEvent } from 'react'
import type { Config, TimeSlot } from '../types'
import { getConfig, saveConfig } from '../db'

const SLOTS: TimeSlot[] = ['上午', '下午', '夜场', '全天']

export default function SettingsTimeView() {
  const [config, setConfig] = useState<Config | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getConfig().then((c) => {
      if (!cancelled) setConfig(c)
    })
    return () => { cancelled = true }
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!config) return
    setSubmitting(true)
    setMessage(null)
    try {
      await saveConfig(config)
      setMessage('已保存')
    } catch (err) {
      console.error(err)
      setMessage('保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (!config) return <p className="form-hint">加载中…</p>

  function updateSlot(slot: TimeSlot, field: 'start' | 'end' | 'hours', value: string | number) {
    setConfig((prev) => {
      if (!prev) return prev
      const next = { ...prev, timeSlots: { ...prev.timeSlots } }
      const item = { ...next.timeSlots[slot] }
      if (field === 'hours') item.hours = Number(value)
      else item[field] = String(value)
      next.timeSlots[slot] = item
      return next
    })
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <p className="form-hint" style={{ marginBottom: 16 }}>
        修改各时段的开始、结束时间和时长（小时），保存后新建事件将按新时段计算。
      </p>
      {SLOTS.map((slot) => (
        <div key={slot} className="form-row" style={{ flexWrap: 'wrap', gap: 12 }}>
          <label className="form-label">
            {slot} 开始
            <input
              type="time"
              className="form-input"
              value={config.timeSlots[slot].start}
              onChange={(e) => updateSlot(slot, 'start', e.target.value)}
            />
          </label>
          <label className="form-label">
            {slot} 结束
            <input
              type="time"
              className="form-input"
              value={config.timeSlots[slot].end}
              onChange={(e) => updateSlot(slot, 'end', e.target.value)}
            />
          </label>
          <label className="form-label">
            {slot} 时长（小时）
            <input
              type="number"
              min={0.5}
              step={0.5}
              className="form-input"
              value={config.timeSlots[slot].hours}
              onChange={(e) => updateSlot(slot, 'hours', e.target.value)}
            />
          </label>
        </div>
      ))}
      {message && <p className="form-hint" style={{ marginTop: 8 }}>{message}</p>}
      <div className="modal-actions" style={{ marginTop: 16 }}>
        <button type="submit" className="primary-button" disabled={submitting}>
          {submitting ? '保存中…' : '保存'}
        </button>
      </div>
    </form>
  )
}
