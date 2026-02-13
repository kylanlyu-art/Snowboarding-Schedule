import { useState, type FormEvent } from 'react'
import type { TimeSlot } from '../types'
import { todayString } from '../utils/date'
import { addTraining } from '../services/events'

interface Props {
  onCreated?: () => void
}

const TIME_SLOTS: TimeSlot[] = ['上午', '下午', '夜场', '全天']

export default function AddTrainingForm({ onCreated }: Props) {
  const [date, setDate] = useState(todayString())
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('上午')
  const [projectName, setProjectName] = useState('')
  const [venue, setVenue] = useState('')
  const [cost, setCost] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!projectName.trim()) {
      setMessage('请填写培训项目名称')
      return
    }
    setSubmitting(true)
    setMessage(null)
    try {
      await addTraining({
        date,
        timeSlot,
        title: projectName.trim(),
        venue: venue.trim() || undefined,
        fee: cost ? Number(cost) : undefined,
        notes: notes.trim() || undefined,
      })
      setMessage('保存成功！')
      setProjectName('')
      setVenue('')
      setCost('')
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
          培训项目名称
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="form-input"
            placeholder="如：训练营、考试、找老师上课、CASI 2级等"
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
          花费（元，可选）
          <input
            type="number"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className="form-input"
            placeholder="如：考试费、培训费"
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
            rows={3}
          />
        </label>
      </div>

      <div className="form-actions">
        <button type="submit" className="primary-button" disabled={submitting}>
          {submitting ? '保存中...' : '保存培训'}
        </button>
        {message && <span className="form-message">{message}</span>}
      </div>
    </form>
  )
}

