import type { Event, EventType } from '../types'

const TYPE_TO_CSV: Record<EventType, string> = {
  课程: '教学',
  试课: '试课',
  练活: '练活',
  培训: '培训',
}

/** 导入仅支持：教学、练活、培训（无试课） */
const CSV_TO_TYPE: Record<string, EventType> = {
  教学: '课程',
  练活: '练活',
  培训: '培训',
}

function formatDateForCsv(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${m}月${d}日`
}

function escapeCsvCell(s: string): string {
  if (/[;\r\n"]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function exportEventsToCsv(events: Event[]): string {
  const header = 'NO.;日期;雪场;内容;备注;收入;时长'
  const rows = events.map((e, i) => {
    const no = i + 1
    const date = formatDateForCsv(e.date)
    const venue = e.venue ?? ''
    const content = TYPE_TO_CSV[e.type]
    const notes = e.title
    const fee = e.fee ?? ''
    const duration = e.duration ?? ''
    return [no, date, venue, content, notes, fee, duration].map(String).map(escapeCsvCell).join(';')
  })
  return [header, ...rows].join('\n')
}

export function downloadCsv(content: string, filename: string) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** 解析 "M月D日" 为 YYYY-MM-DD，年份用当前雪季（11月-次年4月） */
function parseDateZh(str: string, seasonYear: number): string | null {
  const match = str.match(/^(\d{1,2})月(\d{1,2})日$/)
  if (!match) return null
  const m = parseInt(match[1], 10)
  const d = parseInt(match[2], 10)
  if (m < 1 || m > 12 || d < 1 || d > 31) return null
  const year = m >= 11 ? seasonYear : seasonYear + 1
  const date = new Date(year, m - 1, d)
  const y = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${y}-${mm}-${dd}`
}

export interface CsvRow {
  date: string
  venue?: string
  type: EventType
  title: string
  fee?: number
  duration?: number
}

export function parseCsvToRows(csvText: string, seasonYear: number): { rows: CsvRow[]; errors: string[] } {
  const errors: string[] = []
  const lines = csvText.replace(/\uFEFF/g, '').split(/\r?\n/).filter((line) => line.trim())
  const rows: CsvRow[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const cells = (() => {
      const result: string[] = []
      let cur = ''
      let inQuotes = false
      for (let j = 0; j < line.length; j++) {
        const c = line[j]
        if (c === '"') {
          inQuotes = !inQuotes
        } else if (inQuotes) {
          if (c === '"' && line[j + 1] === '"') {
            cur += '"'
            j++
          } else cur += c
        } else if (c === ';') {
          result.push(cur.trim())
          cur = ''
        } else {
          cur += c
        }
      }
      result.push(cur.trim())
      return result
    })()
    const rawDate = cells[1] ?? ''
    const venue = (cells[2] ?? '').trim() || undefined
    const content = (cells[3] ?? '').trim()
    const notes = (cells[4] ?? '').trim()
    const feeStr = (cells[5] ?? '').trim()
    const durationStr = (cells[6] ?? '').trim()

    const firstCell = (cells[0] ?? '').replace(/^\uFEFF/, '').trim()
    if (firstCell === 'NO.' || firstCell === '序号' || content === '内容' || content === '') continue
    const type = CSV_TO_TYPE[content] ?? null
    if (!type) {
      errors.push(`第 ${i + 1} 行：未知内容「${content}」，应为 教学/练活/培训`)
      continue
    }
    const date = parseDateZh(rawDate, seasonYear)
    if (!date) {
      errors.push(`第 ${i + 1} 行：日期格式无效「${rawDate}」，应为 M月D日`)
      continue
    }
    const fee = feeStr ? parseFloat(feeStr) : undefined
    const duration = durationStr ? parseFloat(durationStr) : undefined
    rows.push({ date, venue, type, title: notes, fee, duration })
  }
  return { rows, errors }
}
