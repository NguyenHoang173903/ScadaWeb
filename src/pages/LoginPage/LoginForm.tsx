import { useEffect, useState, type FormEvent } from 'react'
import { ArrowRight, Eye, EyeOff, Lock, ShieldCheck, UserRound } from 'lucide-react'
import { firstError, validateLoginPassword, validateUsername } from '@/validation'
import styles from './LoginPage.module.css'

type LoginFormProps = {
  onSubmit?: (payload: {
    username: string
    password: string
    remember: boolean
  }) => void
  onUsernameChange?: (username: string) => void
  onForgotPassword?: (username: string) => void
  error?: string
  warning?: string
  blockedUntil?: number | null
}

export function LoginForm({
  onSubmit,
  onUsernameChange,
  onForgotPassword,
  error,
  warning,
  blockedUntil = null,
}: LoginFormProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [formatError, setFormatError] = useState('')

  useEffect(() => {
    if (!blockedUntil || blockedUntil <= Date.now()) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [blockedUntil])

  const blockedMs = blockedUntil ? Math.max(0, blockedUntil - now) : 0
  const isBlocked = blockedMs > 0

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isBlocked) return
    const check = firstError(validateUsername(username), validateLoginPassword(password))
    if (!check.ok) {
      setFormatError(check.message)
      return
    }
    setFormatError('')
    onSubmit?.({ username, password, remember })
  }

  return (
    <section className={styles.loginCard}>
      <div className={styles.brand}>
        <p className={styles.eyebrow}>CỔNG ĐIỀU HÀNH THỦY LỢI</p>
        <h2 className={styles.title}>ĐĂNG NHẬP HỆ THỐNG</h2>
        <p className={styles.subtitle}>
          Đăng nhập để truy cập bảng điều khiển giám sát và vận hành.
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Tên đăng nhập</span>
          <UserRound size={18} className={styles.fieldIcon} />
          <input
            type="text"
            name="username"
            autoComplete="username"
            maxLength={32}
            placeholder="Tên đăng nhập"
            value={username}
            onChange={(event) => {
              const next = event.target.value
              setUsername(next)
              setFormatError('')
              onUsernameChange?.(next)
            }}
            required
            disabled={isBlocked}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Mật khẩu</span>
          <Lock size={18} className={styles.fieldIcon} />
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            autoComplete="current-password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={isBlocked}
          />
          <button
            type="button"
            className={styles.eyeButton}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </label>

        <div className={styles.formMeta}>
          <label className={styles.remember}>
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
            />
            <span>Ghi nhớ đăng nhập</span>
          </label>
          <button
            type="button"
            className={styles.forgot}
            onClick={() => onForgotPassword?.(username)}
          >
            Quên mật khẩu?
          </button>
        </div>

        {formatError ? <p className={styles.formError}>{formatError}</p> : error ? (
          <p className={styles.formError}>{error}</p>
        ) : null}
        {warning ? <p className={styles.policyNotice}>{warning}</p> : null}

        <button type="submit" className={styles.primaryButton} disabled={isBlocked}>
          {isBlocked ? `TẠM KHÓA (${Math.ceil(blockedMs / 1000)}s)` : 'VÀO HỆ THỐNG'}
          <ArrowRight size={17} />
        </button>

        <p className={styles.sessionNote}>
          <ShieldCheck size={16} />
          Phiên làm việc được ghi nhận theo ca trực
        </p>

        <p className={styles.copyrightNote}>
          Bản quyền thuộc CTY VASCO. Version 1.0
        </p>
      </form>
    </section>
  )
}
