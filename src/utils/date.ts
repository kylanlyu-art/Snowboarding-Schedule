export function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayString(): string {
  return toDateString(new Date())
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() || 7 // 周日=0，改成7
  if (day !== 1) {
    d.setDate(d.getDate() - (day - 1))
  }
  d.setHours(0, 0, 0, 0)
  return d
}

export function endOfWeek(date: Date): Date {
  const start = startOfWeek(date)
  const d = new Date(start)
  d.setDate(d.getDate() + 6)
  d.setHours(23, 59, 59, 999)
  return d
}

export function formatWeekdayZh(date: Date): string {
  const day = date.getDay()
  switch (day) {
    case 0:
      return '周日'
    case 1:
      return '周一'
    case 2:
      return '周二'
    case 3:
      return '周三'
    case 4:
      return '周四'
    case 5:
      return '周五'
    case 6:
      return '周六'
    default:
      return ''
  }
}

export function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function formatDateZh(date: Date): string {
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}月${day}日`
}

export function startOfMonth(date: Date): Date {
  const d = new Date(date)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

export function endOfMonth(date: Date): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + 1, 0)
  d.setHours(23, 59, 59, 999)
  return d
}

/** 雪季：当年 11 月 1 日 - 次年 4 月 30 日 */
export function startOfSeason(date: Date): Date {
  const y = date.getFullYear()
  const m = date.getMonth()
  const seasonStartYear = m >= 10 ? y : y - 1
  const d = new Date(seasonStartYear, 10, 1, 0, 0, 0, 0)
  return d
}

export function endOfSeason(date: Date): Date {
  const y = date.getFullYear()
  const m = date.getMonth()
  const seasonEndYear = m >= 10 ? y + 1 : y
  const d = new Date(seasonEndYear, 3, 30, 23, 59, 59, 999)
  return d
}

/** 用于展示的日期，如 "2025年11月1日" */
export function formatDateZhLong(date: Date): string {
  return `${date.getFullYear()}年${formatDateZh(date)}`
}



