import { useState, type FormEvent } from 'react'
import type { TimeSlot } from '../types'
import { todayString } from '../utils/date'
import { addPractice } from '../services/events'

interface Props {
  onCreated?: () => void
}

const TIME_SLOTS: TimeSlot[] = ['上午', '下午', '夜场', '全天']

export default function AddPracticeForm({ onCreated }: Props) {
  const [date, setDate] = useState(todayString())
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('上午')
  const [content, setContent] = useState('')
  const [venue, setVenue] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!content.trim()) {
      setMessage('请填写练习内容')
      return
    }
    setSubmitting(true)
    setMessage(null)
    try {
      await addPractice({
        date,
        timeSlot,
        title: content.trim(),
        venue: venue.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      setMessage('保存成功！')
      setContent('')
      setVenue('')
      setNotes('')
      if (onCreated) onCreated()
    } catch (err) {
      console.error(err)
      setMessage('保存失败，请稍后重试。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-row">
        <label className="form-label">
          日期
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="form-input"
            required
          />
        </label>
        <label className="form-label">
          时段
          <select
            value={timeSlot}
            onChange={(e) => setTimeSlot(e.target.value as TimeSlot)}
            className="form-input"
          >
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-row">
        <label className="form-label">
          练习内容 / 备注
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="form-input"
            placeholder="如：15 趟 / 练习公园"
            required
          />
        </label>
      </div>

      <div className="form-row">
        <label className="form-label">
          场地 / 雪场
          <input
            type="text"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            className="form-input"
            placeholder="如：万龙"
          />
        </label>
      </div>

      <div className="form-row">
        <label className="form-label">
          备注
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="form-textarea"
            rows={3}
          />
        </label>
      </div>

      <div className="form-actions">
        <button type="submit" className="primary-button" disabled={submitting}>
          {submitting ? '保存中...' : '保存练习'}
        </button>
        {message && <span className="form-message">{message}</span>}
      </div>
    </form>
  )
}

