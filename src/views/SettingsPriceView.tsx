import { useEffect, useState, type FormEvent } from 'react'
import type { Config } from '../types'
import { getConfig, saveConfig } from '../db'

export default function SettingsPriceView() {
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

  function setPricing<K extends keyof Config['pricing']>(key: K, value: number) {
    setConfig((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        pricing: { ...prev.pricing, [key]: value },
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <p className="form-hint" style={{ marginBottom: 16 }}>
        设置默认价格，用于添加课程时的参考与自动填充（可选）。
      </p>
      <div className="form-row">
        <label className="form-label">
          时薪（元）
          <input
            type="number"
            min={0}
            className="form-input"
            value={config.pricing.hourlyRate}
            onChange={(e) => setPricing('hourlyRate', Number(e.target.value))}
          />
        </label>
        <label className="form-label">
          标准 3 课时（元）
          <input
            type="number"
            min={0}
            className="form-input"
            value={config.pricing.standard3h}
            onChange={(e) => setPricing('standard3h', Number(e.target.value))}
          />
        </label>
      </div>
      <div className="form-row">
        <label className="form-label">
          全天 5 课时（元）
          <input
            type="number"
            min={0}
            className="form-input"
            value={config.pricing.fullDay5h}
            onChange={(e) => setPricing('fullDay5h', Number(e.target.value))}
          />
        </label>
        <label className="form-label">
          试课价格（元）
          <input
            type="number"
            min={0}
            className="form-input"
            value={config.pricing.trialClass}
            onChange={(e) => setPricing('trialClass', Number(e.target.value))}
          />
        </label>
      </div>
      {message && <p className="form-hint" style={{ marginTop: 8 }}>{message}</p>}
      <div className="modal-actions" style={{ marginTop: 16 }}>
        <button type="submit" className="primary-button" disabled={submitting}>
          {submitting ? '保存中…' : '保存'}
        </button>
      </div>
    </form>
  )
}
