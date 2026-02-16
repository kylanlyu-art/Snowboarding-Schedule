import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

interface Props {
  onSuccess: () => void
}

export default function AuthView({ onSuccess }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) {
      setMessage('未配置 Supabase，请设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY')
      return
    }
    setLoading(true)
    setMessage(null)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage('注册成功，请查收邮件确认（若需）或直接登录')
        setMode('login')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        onSuccess()
      }
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : '操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form" style={{ maxWidth: 360, margin: '40px auto' }}>
      <h2 style={{ marginBottom: 8 }}>登录课表</h2>
      <p className="form-hint" style={{ marginBottom: 16 }}>
        使用 Supabase 账号登录后，课表将同步到云端；首次登录会自动迁移本地数据。
      </p>
      <form onSubmit={handleSubmit}>
        <div className="form-row" style={{ flexDirection: 'column' }}>
          <label className="form-label">
            邮箱
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </label>
          <label className="form-label">
            密码
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
              required
              minLength={6}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
          </label>
        </div>
        {message && (
          <p className="form-hint" style={{ marginTop: 8, color: message.startsWith('注册成功') ? '#059669' : '#b91c1c' }}>
            {message}
          </p>
        )}
        <div className="modal-actions" style={{ marginTop: 16, justifyContent: 'space-between' }}>
          <button
            type="button"
            className="secondary-button"
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage(null) }}
            disabled={loading}
          >
            {mode === 'login' ? '去注册' : '去登录'}
          </button>
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? '处理中…' : mode === 'login' ? '登录' : '注册'}
          </button>
        </div>
      </form>
    </div>
  )
}
