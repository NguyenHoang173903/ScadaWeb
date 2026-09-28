import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, Lock, KeyRound } from 'lucide-react'
import { PasswordRuleList } from '@/components/auth/PasswordRuleList'
import { DEFAULT_PASSWORD, validatePassword } from '@/settings/passwordPolicy'
import styles from './LoginPage.module.css'

type Props = {
  username: string
  message: string
  onSubmit: (password: string) => void | Promise<void>
  onCancel: () => void
}

export function ChangePasswordForm({ username, message, onSubmit, onCancel }: Props) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const check = validatePassword(password)
    if (!check.ok) {
      setError(check.message)
      return
    }
    if (password === DEFAULT_PASSWORD) {
      setError('Không được dùng lại mật khẩu mặc định.')
      return
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }
    setError('')
    void Promise.resolve(onSubmit(password)).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Không cập nhật được mật khẩu.')
    })
  }

  return (
    <section className={styles.loginCard}>
      <div className={styles.brand}>
        <h1 className={styles.title}>Đặt mật khẩu mới</h1>
        <p className={styles.subtitle}>{username}</p>
      </div>

      <p className={styles.policyNotice}>{message}</p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <Lock size={18} className={styles.fieldIcon} />
          <input
            type={showPassword ? 'text' : 'password'}
            name="new-password"
            autoComplete="new-password"
            placeholder="Mật khẩu mới"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button
            type="button"
            className={styles.eyeButton}
            aria-label={showPassword ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((visible) => !visible)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </label>

        <label className={styles.field}>
          <KeyRound size={18} className={styles.fieldIcon} />
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirm-password"
            autoComplete="new-password"
            placeholder="Xác nhận mật khẩu mới"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
          <button
            type="button"
            className={styles.eyeButton}
            aria-label={
              showConfirmPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'
            }
            aria-pressed={showConfirmPassword}
            onClick={() => setShowConfirmPassword((visible) => !visible)}
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </label>

        <PasswordRuleList password={password} />

        {error ? <p className={styles.formError}>{error}</p> : null}

        <button type="submit" className={styles.primaryButton}>
          CẬP NHẬT MẬT KHẨU
        </button>
        <button type="button" className={styles.forgot} onClick={onCancel}>
          Quay lại đăng nhập
        </button>
      </form>
    </section>
  )
}
