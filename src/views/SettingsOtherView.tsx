import { useRef, useState } from 'react'
import type { Config, Event } from '../types'
import { db, getConfig, saveConfig } from '../db'
import { getAllEvents } from '../services/events'

interface BackupData {
  events: Event[]
  config: Config
  exportedAt: string
}

export default function SettingsOtherView() {
  const [message, setMessage] = useState<string | null>(null)
  const [restoring, setRestoring] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleExport() {
    setMessage(null)
    try {
      const [events, config] = await Promise.all([getAllEvents(), getConfig()])
      const configOnly: Config = {
        timeSlots: config.timeSlots,
        pricing: config.pricing,
        eventTypes: config.eventTypes,
      }
      const data: BackupData = {
        events,
        config: configOnly,
        exportedAt: new Date().toISOString(),
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `课表备份_${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setMessage('已下载备份文件')
    } catch (err) {
      console.error(err)
      setMessage('导出失败')
    }
  }

  async function handleRestore() {
    const file = fileRef.current?.files?.[0]
    if (!file) {
      setMessage('请先选择备份文件')
      return
    }
    if (!confirm('恢复备份将覆盖当前所有事件和配置，确定继续？')) return
    setRestoring(true)
    setMessage(null)
    try {
      const text = await file.text()
      const data = JSON.parse(text) as BackupData
      if (!Array.isArray(data.events) || !data.config) {
        setMessage('无效的备份格式')
        return
      }
      await db.events.clear()
      if (data.events.length > 0) {
        await db.events.bulkPut(data.events)
      }
      await saveConfig(data.config)
      setMessage('恢复成功，请刷新页面查看')
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      console.error(err)
      setMessage('恢复失败：文件可能损坏或格式不正确')
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div className="form">
      <h4 style={{ marginBottom: 8 }}>数据备份</h4>
      <p className="form-hint" style={{ marginBottom: 16 }}>
        导出全部事件和配置为 JSON 文件，或从之前的备份文件恢复（会覆盖当前数据）。
      </p>
      <div className="form-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
        <button type="button" className="primary-button" onClick={handleExport}>
          导出备份
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            style={{ fontSize: 14 }}
          />
          <button
            type="button"
            className="secondary-button"
            onClick={handleRestore}
            disabled={restoring}
          >
            {restoring ? '恢复中…' : '从备份恢复'}
          </button>
        </div>
      </div>
      {message && <p className="form-hint" style={{ marginTop: 12 }}>{message}</p>}
    </div>
  )
}
