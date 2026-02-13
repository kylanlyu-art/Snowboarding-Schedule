import type { Event, EventType } from '../types'

export interface StudentRankItem {
  name: string
  count: number
}

export interface StatsResult {
  totalDays: number
  courseCount: number
  practiceCount: number
  trainingCount: number
  /** 仅上课（课程）时长，小时 */
  totalTeachingHours: number
  /** 培训总时长，小时 */
  trainingHours: number
  /** 培训花费，元 */
  trainingCost: number
  totalIncome: number
  studentNames: string[]
  studentRanking: StudentRankItem[]
  venueDays: Record<string, number>
}

export function computeStats(events: Event[]): StatsResult {
  const dateSet = new Set<string>()
  const studentSet = new Set<string>()
  const venueDays: Record<string, number> = {}

  let courseCount = 0
  let practiceCount = 0
  let trainingCount = 0
  let totalTeachingHours = 0
  let trainingHours = 0
  let trainingCost = 0
  let totalIncome = 0

  const billableTypes: EventType[] = ['课程']
  const studentCountMap: Record<string, number> = {}
  for (const e of events) {
    dateSet.add(e.date)
    if (billableTypes.includes(e.type)) {
      studentSet.add(e.title)
      studentCountMap[e.title] = (studentCountMap[e.title] ?? 0) + 1
    }
    if (e.venue) {
      venueDays[e.venue] = (venueDays[e.venue] ?? 0) + 1
    }
    switch (e.type) {
      case '课程':
        courseCount++
        totalTeachingHours += e.duration ?? 0
        totalIncome += e.fee ?? 0
        break
      case '练活':
        practiceCount++
        break
      case '培训':
        trainingCount++
        trainingHours += e.duration ?? 0
        trainingCost += e.fee ?? 0
        break
      case '试课':
        courseCount++
        totalTeachingHours += e.duration ?? 0
        totalIncome += e.fee ?? 0
        break
    }
  }

  const studentRanking: StudentRankItem[] = Object.entries(studentCountMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  return {
    totalDays: dateSet.size,
    courseCount,
    practiceCount,
    trainingCount,
    totalTeachingHours,
    trainingHours,
    trainingCost,
    totalIncome,
    studentNames: Array.from(studentSet),
    studentRanking,
    venueDays,
  }
}

export function formatStatsSummary(stats: StatsResult): string {
  return `有安排 ${stats.totalDays} 天 · 教学课时 ${stats.totalTeachingHours.toFixed(1)} 小时 · 总收入 ${stats.totalIncome} 元 · 累计学员 ${stats.studentNames.length} 名`
}
