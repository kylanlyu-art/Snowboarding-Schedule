import { useState, type FormEvent } from 'react'
import type { Event, EventType, TimeSlot } from '../types'
import { updateEvent, deleteEvent } from '../services/events'

interface Props {
  event: Event
  onClose: () => void
  onChanged: () => void
}

const EVENT_TYPES: EventType[] = ['课程', '练活', '培训']

export default function EventEditModal({ event, onClose, onChanged }: Props) {
  const [type, setType] = useState<EventType>(
    event.type === '试课' ? '课程' : event.type,
  )
  const [title, setTitle] = useState(event.title)
  const [venue, setVenue] = useState(event.venue ?? '')
  const [notes, setNotes] = useState(event.notes ?? '')
  const [date, setDate] = useState(event.date)
  const [timeSlot, setTimeSlot] = useState<TimeSlot>(event.timeSlot)
  const [fee, setFee] = useState<string>(event.fee != null ? String(event.fee) : '')
  const [submitting, setSubmitting] = useState(false)
  const isTraining = type === '培训'

  const TIME_SLOTS: TimeSlot[] = ['上午', '下午', '夜场', '全天']

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await updateEvent(event.id, {
        type,
        title: title.trim() || event.title,
        venue: venue.trim() || undefined,
        notes: notes.trim() || undefined,
        date,
        timeSlot,
        fee: fee === '' ? undefined : Number(fee),
      })
      onChanged()
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!confirm('确定要删除这个事件吗？')) return
    setSubmitting(true)
    try {
      await deleteEvent(event.id)
      onChanged()
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3 className="modal-title">编辑事件</h3>
        <form onSubmit={handleSubmit} className="form">
          <div className="form-row">
            <label className="form-label">
              类型
              <select
                className="form-input"
                value={type}
                onChange={(e) => setType(e.target.value as EventType)}
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-label">
              日期
              <input
                className="form-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </label>
            <label className="form-label">
              时段
              <select
                className="form-input"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value as TimeSlot)}
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
              标题
              <input
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
          </div>
          <div className="form-row">
            <label className="form-label">
              场地
              <input
                className="form-input"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
              />
            </label>
            <label className="form-label">
              {isTraining ? '花费（元）' : '收入（元）'}
              <input
                className="form-input"
                type="number"
                min={0}
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                placeholder={isTraining ? '培训费用' : '课程收入'}
              />
            </label>
          </div>
          <div className="form-row">
            <label className="form-label">
              备注
              <textarea
                className="form-textarea"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={submitting}
            >
              取消
            </button>
            <button
              type="button"
              className="danger-button"
              onClick={handleDelete}
              disabled={submitting}
            >
              删除
            </button>
            <button type="submit" className="primary-button" disabled={submitting}>
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

