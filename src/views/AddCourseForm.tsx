import { useState, type FormEvent } from 'react'
import type { TimeSlot } from '../types'
import { todayString } from '../utils/date'
import { addCourse } from '../services/events'

interface Props {
  onCreated?: () => void
}

const TIME_SLOTS: TimeSlot[] = ['上午', '下午', '夜场', '全天']

export default function AddCourseForm({ onCreated }: Props) {
  const [date, setDate] = useState(todayString())
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('上午')
  const [studentName, setStudentName] = useState('')
  const [venue, setVenue] = useState('')
  const [fee, setFee] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!studentName.trim()) {
      setMessage('请填写学员名称')
      return
    }
    setSubmitting(true)
    setMessage(null)
    try {
      await addCourse({
        date,
        timeSlot,
        title: studentName.trim(),
        venue: venue.trim() || undefined,
        fee: fee ? Number(fee) : undefined,
        notes: notes.trim() || undefined,
      })
      setMessage('保存成功！')
      setStudentName('')
      setVenue('')
      setFee('')
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
          学员名称
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="form-input"
            placeholder="如：张三"
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
        <label className="form-label">
          课程费用（可选）
          <input
            type="number"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            className="form-input"
            placeholder="不填则按默认价格"
            min={0}
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
            placeholder="例如：初学单板 / 需要准备租板"
            rows={3}
          />
        </label>
      </div>

      <div className="form-actions">
        <button type="submit" className="primary-button" disabled={submitting}>
          {submitting ? '保存中...' : '保存课程'}
        </button>
        {message && <span className="form-message">{message}</span>}
      </div>
    </form>
  )
}

