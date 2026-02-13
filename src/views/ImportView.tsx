import { useState, useRef } from 'react'
import { parseCsvToRows, type CsvRow } from '../services/csv'
import { importEventsFromCsv } from '../services/events'

export default function ImportView() {
  const [preview, setPreview] = useState<CsvRow[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [result, setResult] = useState<{ ok: number; err: number } | null>(null)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const rawTextRef = useRef<string>('')

  const seasonYear = new Date().getMonth() >= 10 ? new Date().getFullYear() : new Date().getFullYear() - 1

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setResult(null)
    setParseErrors([])
    const reader = new FileReader()
    reader.onload = () => {
      const text = (reader.result as string) ?? ''
      rawTextRef.current = text
      const { rows, errors } = parseCsvToRows(text, seasonYear)
      setPreview(rows.slice(0, 10))
      setParseErrors(errors)
    }
    reader.readAsText(file, 'UTF-8')
  }

  async function handleConfirmImport() {
    if (!rawTextRef.current) return
    setImporting(true)
    setResult(null)
    try {
      const { rows, errors } = parseCsvToRows(rawTextRef.current, seasonYear)
      if (errors.length > 0) {
        setParseErrors(errors)
        setResult(null)
        return
      }
      const { ok, err } = await importEventsFromCsv(rows)
      setResult({ ok, err })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div>
      <div className="form" style={{ maxWidth: 560 }}>
        <div className="form-row">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="secondary-button"
            onClick={() => fileInputRef.current?.click()}
          >
            选择 CSV 文件
          </button>
          <span style={{ fontSize: 12, color: '#6b7280' }}>
            格式：NO.;日期;雪场;内容;备注;收入;时长（分号分隔，内容为 教学/练活/培训）
          </span>
        </div>

        {parseErrors.length > 0 && (
          <div style={{ marginTop: 8, padding: 8, background: '#fef2f2', borderRadius: 8, fontSize: 12 }}>
            {parseErrors.map((msg, i) => (
              <div key={i}>{msg}</div>
            ))}
          </div>
        )}

        {preview.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>预览（前 10 条）</div>
            <div className="event-card" style={{ padding: 8, fontSize: 12 }}>
              {preview.map((row, i) => (
                <div key={i}>
                  {row.date} {row.venue ?? '-'} {row.type} {row.title} {row.fee ?? '-'} {row.duration ?? '-'}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 8 }}>
              <button
                type="button"
                className="primary-button"
                onClick={handleConfirmImport}
                disabled={importing || parseErrors.length > 0}
              >
                {importing ? '导入中...' : '确认导入'}
              </button>
            </div>
          </div>
        )}

        {result && (
          <div style={{ marginTop: 12, fontSize: 13, color: '#16a34a' }}>
            导入完成：成功 {result.ok} 条，失败 {result.err} 条
          </div>
        )}
      </div>
    </div>
  )
}
