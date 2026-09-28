import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, KeyRound, LockKeyhole } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PasswordRuleList } from '@/components/auth/PasswordRuleList'
import { Button } from '@/components/common/Button'
import { FormField } from '@/components/common/FormField'
import { TextField } from '@/components/common/TextField'
import { AdminHeader } from '@/components/layout/AdminHeader'
import { ROUTES } from '@/constants/routes'
import { logoutCurrentUser } from '@/services/auditLog'
import { isApiError } from '@/services/api/http'
import { changePasswordWithApi } from '@/services/auth/authApi'
import { validatePassword } from '@/settings/passwordPolicy'
import styles from './ChangePasswordPage.module.css'

type PasswordFieldProps = {
  id: string
  value: string
  visible: boolean
  autoComplete: 'current-password' | 'new-password'
  onChange: (value: string) => void
  onToggle: () => void
}

function PasswordField({
  id,
  value,
  visible,
  autoComplete,
  onChange,
  onToggle,
}: PasswordFieldProps) {
  return (
    <div className={styles.passwordField}>
      <TextField
        id={id}
        name={id}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      />
      <button
        type="button"
        className={styles.passwordToggle}
        aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        aria-pressed={visible}
        onClick={onToggle}
      >
        {visible ? <EyeOff size={19} /> : <Eye size={19} />}
      </button>
    </div>
  )
}

export function ChangePasswordPage() {
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!currentPassword) {
      setError('Vui lòng nhập mật khẩu hiện tại.')
      return
    }

    const passwordCheck = validatePassword(newPassword)
    if (!passwordCheck.ok) {
      setError(passwordCheck.message)
      return
    }
    if (newPassword === currentPassword) {
      setError('Mật khẩu mới phải khác mật khẩu hiện tại.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }

    setSubmitting(true)
    try {
      await changePasswordWithApi(currentPassword, newPassword)
      setSuccess('Đổi mật khẩu thành công. Đang chuyển đến trang đăng nhập...')
      window.setTimeout(() => {
        logoutCurrentUser('logout')
        navigate(ROUTES.login, { replace: true })
      }, 1200)
    } catch (requestError) {
      if (isApiError(requestError) && requestError.errorCode === 'Auth.InvalidPassword') {
        setError('Mật khẩu hiện tại không chính xác.')
      } else {
        setError(
          isApiError(requestError)
            ? requestError.message
            : 'Không thể đổi mật khẩu. Vui lòng thử lại.',
        )
      }
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <AdminHeader />

      <main className={styles.main}>
        <section className={styles.card}>
          <div className={styles.heading}>
            <span className={styles.headingIcon}>
              <LockKeyhole size={24} />
            </span>
            <div>
              <h1>Đổi mật khẩu</h1>
              <p>Cập nhật mật khẩu đăng nhập của tài khoản hiện tại.</p>
            </div>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <FormField label="Mật khẩu hiện tại" htmlFor="current-password" required>
              <PasswordField
                id="current-password"
                value={currentPassword}
                visible={showCurrent}
                autoComplete="current-password"
                onChange={setCurrentPassword}
                onToggle={() => setShowCurrent((value) => !value)}
              />
            </FormField>

            <FormField label="Mật khẩu mới" htmlFor="new-password" required>
              <PasswordField
                id="new-password"
                value={newPassword}
                visible={showNew}
                autoComplete="new-password"
                onChange={setNewPassword}
                onToggle={() => setShowNew((value) => !value)}
              />
              <PasswordRuleList password={newPassword} />
            </FormField>

            <FormField label="Xác nhận mật khẩu mới" htmlFor="confirm-password" required>
              <PasswordField
                id="confirm-password"
                value={confirmPassword}
                visible={showConfirm}
                autoComplete="new-password"
                onChange={setConfirmPassword}
                onToggle={() => setShowConfirm((value) => !value)}
              />
            </FormField>

            {error ? <p className={styles.error} role="alert">{error}</p> : null}
            {success ? <p className={styles.success} role="status">{success}</p> : null}

            <div className={styles.actions}>
              <Button
                type="button"
                variant="secondary"
                disabled={submitting}
                onClick={() => navigate(-1)}
              >
                Hủy
              </Button>
              <Button type="submit" variant="primary" disabled={submitting || Boolean(success)}>
                <KeyRound size={17} />
                {submitting ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
              </Button>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}
