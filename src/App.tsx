import { useState } from 'react'
import TodayView from './views/TodayView'
import AddCourseForm from './views/AddCourseForm'
import AddPracticeForm from './views/AddPracticeForm'
import AddTrainingForm from './views/AddTrainingForm'
import WeekView from './views/WeekView'
import ScheduleView from './views/ScheduleView'
import AvailableView from './views/AvailableView'
import ShareAvailableView from './views/ShareAvailableView'
import StatsView from './views/StatsView'
import ImportView from './views/ImportView'
import ExportView from './views/ExportView'
import EventListView from './views/EventListView'
import SettingsTimeView from './views/SettingsTimeView'
import SettingsPriceView from './views/SettingsPriceView'
import SettingsOtherView from './views/SettingsOtherView'
import './App.css'

type MainSection =
  | 'today'
  | 'week'
  | 'schedule'
  | 'add-course'
  | 'add-practice'
  | 'add-training'
  | 'available'
  | 'share-available'
  | 'stats-today'
  | 'stats-week'
  | 'stats-month'
  | 'stats-season'
  | 'import'
  | 'export'
  | 'events-list'
  | 'settings-time'
  | 'settings-price'
  | 'settings-other'

const SECTION_LABELS: Record<MainSection, { title: string; subtitle?: string }> = {
  today: { title: '今日安排', subtitle: '查看今天的所有课程和活动' },
  week: { title: '本周课表', subtitle: '一周视图快速总览' },
  schedule: { title: '未来课表', subtitle: '查看未来 N 天的课表' },
  'add-course': { title: '添加课程', subtitle: '正式教学课程，有收入' },
  'add-practice': { title: '添加练习', subtitle: '教练个人练习，无收入' },
  'add-training': { title: '添加培训', subtitle: '教练培训进修，无收入' },
  available: { title: '查看空余时间', subtitle: '按天查看可约时段' },
  'share-available': { title: '分享空余时间', subtitle: '生成适合发给学员的可约时间文本' },
  'stats-today': { title: '今日统计', subtitle: '今日课时与收入概览' },
  'stats-week': { title: '本周统计', subtitle: '本周课时、收入和场地分布' },
  'stats-month': { title: '本月统计', subtitle: '本月教学和练习统计' },
  'stats-season': { title: '本季统计', subtitle: '整个雪季的核心数据' },
  import: { title: '导入 CSV', subtitle: '从历史表格导入数据' },
  export: { title: '导出 CSV', subtitle: '导出为 CSV 保存或分析' },
  'events-list': { title: '事件列表', subtitle: '查看与编辑全部事件（含历史导入数据）' },
  'settings-time': { title: '时段配置', subtitle: '管理上午/下午/夜场/全天时间段' },
  'settings-price': { title: '价格配置', subtitle: '设置课时价格与默认收费规则' },
  'settings-other': { title: '其他设置', subtitle: '更多偏好与备份设置' },
}

function App() {
  const [section, setSection] = useState<MainSection>('today')

  function renderContent() {
    switch (section) {
      case 'today':
        return <TodayView />
      case 'add-course':
        return <AddCourseForm onCreated={() => setSection('today')} />
      case 'add-practice':
        return <AddPracticeForm onCreated={() => setSection('today')} />
      case 'add-training':
        return <AddTrainingForm onCreated={() => setSection('today')} />
      case 'week':
        return <WeekView />
      case 'schedule':
        return <ScheduleView />
      case 'available':
        return <AvailableView />
      case 'share-available':
        return <ShareAvailableView />
      case 'stats-today':
        return <StatsView scope="today" />
      case 'stats-week':
        return <StatsView scope="week" />
      case 'stats-month':
        return <StatsView scope="month" />
      case 'stats-season':
        return <StatsView scope="season" />
      case 'import':
        return <ImportView />
      case 'export':
        return <ExportView />
      case 'events-list':
        return <EventListView />
      case 'settings-time':
        return <SettingsTimeView />
      case 'settings-price':
        return <SettingsPriceView />
      case 'settings-other':
        return <SettingsOtherView />
      default:
        return (
          <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
            当前页面的具体功能还在开发中。
          </p>
        )
    }
  }

  return (
    <div className="app-root">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">滑雪教练课表管理</div>
          <div className="sidebar-subtitle">单人使用 · 本地数据</div>
        </div>

        <div className="nav-group">
          <div className="sidebar-section-title">日程</div>
          <button
            className={`nav-item ${section === 'today' ? 'active' : ''}`}
            onClick={() => setSection('today')}
          >
            <span className="nav-item-icon">📅</span>
            今日
          </button>
          <button
            className={`nav-item ${section === 'week' ? 'active' : ''}`}
            onClick={() => setSection('week')}
          >
            <span className="nav-item-icon">🗓️</span>
            本周
          </button>
          <button
            className={`nav-item ${section === 'schedule' ? 'active' : ''}`}
            onClick={() => setSection('schedule')}
          >
            <span className="nav-item-icon">📆</span>
            未来课表
          </button>
        </div>

        <div className="nav-group">
          <div className="sidebar-section-title">添加事件</div>
          <button
            className={`nav-item ${section === 'add-course' ? 'active' : ''}`}
            onClick={() => setSection('add-course')}
          >
            <span className="nav-item-icon">➕</span>
            添加课程
          </button>
          <button
            className={`nav-item ${section === 'add-practice' ? 'active' : ''}`}
            onClick={() => setSection('add-practice')}
          >
            <span className="nav-item-icon">🏂</span>
            添加练习
          </button>
          <button
            className={`nav-item ${section === 'add-training' ? 'active' : ''}`}
            onClick={() => setSection('add-training')}
          >
            <span className="nav-item-icon">📚</span>
            添加培训
          </button>
        </div>

        <div className="nav-group">
          <div className="sidebar-section-title">空余时间</div>
          <button
            className={`nav-item ${section === 'available' ? 'active' : ''}`}
            onClick={() => setSection('available')}
          >
            <span className="nav-item-icon">⏰</span>
            查看空余
          </button>
          <button
            className={`nav-item ${section === 'share-available' ? 'active' : ''}`}
            onClick={() => setSection('share-available')}
          >
            <span className="nav-item-icon">📤</span>
            分享空余
          </button>
        </div>

        <div className="nav-group">
          <div className="sidebar-section-title">统计</div>
          <button
            className={`nav-item ${section === 'stats-today' ? 'active' : ''}`}
            onClick={() => setSection('stats-today')}
          >
            <span className="nav-item-icon">📊</span>
            今日统计
          </button>
          <button
            className={`nav-item ${section === 'stats-week' ? 'active' : ''}`}
            onClick={() => setSection('stats-week')}
          >
            <span className="nav-item-icon">📈</span>
            本周统计
          </button>
          <button
            className={`nav-item ${section === 'stats-month' ? 'active' : ''}`}
            onClick={() => setSection('stats-month')}
          >
            <span className="nav-item-icon">🗓️</span>
            本月统计
          </button>
          <button
            className={`nav-item ${section === 'stats-season' ? 'active' : ''}`}
            onClick={() => setSection('stats-season')}
          >
            <span className="nav-item-icon">❄️</span>
            本季统计
          </button>
        </div>

        <div className="nav-group">
          <div className="sidebar-section-title">数据</div>
          <button
            className={`nav-item ${section === 'events-list' ? 'active' : ''}`}
            onClick={() => setSection('events-list')}
          >
            <span className="nav-item-icon">📋</span>
            事件列表
          </button>
          <button
            className={`nav-item ${section === 'import' ? 'active' : ''}`}
            onClick={() => setSection('import')}
          >
            <span className="nav-item-icon">📥</span>
            导入 CSV
          </button>
          <button
            className={`nav-item ${section === 'export' ? 'active' : ''}`}
            onClick={() => setSection('export')}
          >
            <span className="nav-item-icon">📤</span>
            导出 CSV
          </button>
        </div>

        <div className="nav-group" style={{ marginTop: 'auto' }}>
          <div className="sidebar-section-title">设置</div>
          <button
            className={`nav-item ${section === 'settings-time' ? 'active' : ''}`}
            onClick={() => setSection('settings-time')}
          >
            <span className="nav-item-icon">⚙️</span>
            时段配置
          </button>
          <button
            className={`nav-item ${section === 'settings-price' ? 'active' : ''}`}
            onClick={() => setSection('settings-price')}
          >
            <span className="nav-item-icon">💵</span>
            价格配置
          </button>
          <button
            className={`nav-item ${section === 'settings-other' ? 'active' : ''}`}
            onClick={() => setSection('settings-other')}
          >
            <span className="nav-item-icon">🔧</span>
            其他设置
          </button>
        </div>
      </aside>

      <main className="main-layout">
        <header className="main-header">
          <div>
            <div className="main-title">{SECTION_LABELS[section].title}</div>
            {SECTION_LABELS[section].subtitle && (
              <div className="main-subtitle">{SECTION_LABELS[section].subtitle}</div>
            )}
          </div>
          <div className="tag">v1.0 · MVP</div>
        </header>

        <section className="main-content">{renderContent()}</section>
      </main>
    </div>
  )
}

export default App
