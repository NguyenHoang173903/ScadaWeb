import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/common/Button'
import { FormField } from '@/components/common/FormField'
import { TextField } from '@/components/common/TextField'
import { ToggleSwitch } from '@/components/common/ToggleSwitch'
import {
  getPasswordPolicy,
  setPasswordPolicy,
  subscribePasswordPolicy,
  type PasswordPolicy,
} from '@/settings/passwordPolicy'
import { firstError, validateInteger } from '@/validation'
import styles from './PasswordPolicyForm.module.css'

export function PasswordPolicyForm() {
  const [values, setValues] = useState<PasswordPolicy>(() => getPasswordPolicy())
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => subscribePasswordPolicy(setValues), [])

  const updateNumber = (key: keyof PasswordPolicy, raw: string) => {
    const next = Number(raw)
    setValues((current) => ({
      ...current,
      [key]: Number.isFinite(next) ? next : current[key],
    }))
    setSaved(false)
  }

  const updateFlag = (key: keyof PasswordPolicy, checked: boolean) => {
    setValues((current) => ({ ...current, [key]: checked }))
    setSaved(false)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const check = firstError(
      validateInteger(String(values.minLength), 'Số ký tự tối thiểu', 1, 128),
      validateInteger(String(values.maxLength), 'Số ký tự tối đa', 1, 256),
      validateInteger(String(values.changeIntervalDays), 'Chu kỳ đổi mật khẩu', 1, 3650),
      validateInteger(String(values.validityDays), 'Thời hạn hiệu lực', 1, 3650),
      validateInteger(String(values.maxFailedLogins), 'Số lần đăng nhập sai', 1, 50),
      validateInteger(String(values.failedLoginWindowMinutes), 'Cửa sổ thời gian', 1, 1440),
      validateInteger(String(values.loginLockoutMinutes), 'Thời gian chặn', 1, 10080),
      values.minLength > values.maxLength
        ? { ok: false, message: 'Số ký tự tối thiểu không được lớn hơn tối đa.' }
        : { ok: true },
      values.changeIntervalDays > values.validityDays
        ? { ok: false, message: 'Chu kỳ đổi mật khẩu không được dài hơn thời hạn hiệu lực.' }
        : { ok: true },
    )
    if (!check.ok) {
      setError(check.message)
      return
    }
    setError('')
    setPasswordPolicy(values)
    setValues(getPasswordPolicy())
    setSaved(true)
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.panel}>
        <h3 className={styles.heading}>Độ phức tạp mật khẩu</h3>
        <div className={styles.grid}>
          <FormField label="Số ký tự tối thiểu" htmlFor="minLength" required>
            <TextField
              id="minLength"
              name="minLength"
              inputMode="numeric"
              value={String(values.minLength)}
              onChange={(event) => updateNumber('minLength', event.target.value)}
              required
            />
          </FormField>
          <FormField label="Số ký tự tối đa" htmlFor="maxLength" required>
            <TextField
              id="maxLength"
              name="maxLength"
              inputMode="numeric"
              value={String(values.maxLength)}
              onChange={(event) => updateNumber('maxLength', event.target.value)}
              required
            />
          </FormField>
        </div>

        <div className={styles.flags}>
          <label className={styles.flagRow}>
            <span>Bắt buộc chữ thường</span>
            <ToggleSwitch
              checked={values.requireLowercase}
              onChange={(checked) => updateFlag('requireLowercase', checked)}
              aria-label="Bắt buộc chữ thường"
            />
          </label>
          <label className={styles.flagRow}>
            <span>Bắt buộc chữ hoa</span>
            <ToggleSwitch
              checked={values.requireUppercase}
              onChange={(checked) => updateFlag('requireUppercase', checked)}
              aria-label="Bắt buộc chữ hoa"
            />
          </label>
          <label className={styles.flagRow}>
            <span>Bắt buộc chữ số</span>
            <ToggleSwitch
              checked={values.requireNumber}
              onChange={(checked) => updateFlag('requireNumber', checked)}
              aria-label="Bắt buộc chữ số"
            />
          </label>
          <label className={styles.flagRow}>
            <span>Bắt buộc ký tự đặc biệt</span>
            <ToggleSwitch
              checked={values.requireSpecial}
              onChange={(checked) => updateFlag('requireSpecial', checked)}
              aria-label="Bắt buộc ký tự đặc biệt"
            />
          </label>
        </div>
      </div>

      <div className={styles.panel}>
        <h3 className={styles.heading}>Thời hạn mật khẩu</h3>
        <div className={styles.grid}>
          <FormField label="Chu kỳ bắt buộc đổi mật khẩu (ngày)" htmlFor="changeIntervalDays" required>
            <TextField
              id="changeIntervalDays"
              name="changeIntervalDays"
              inputMode="numeric"
              value={String(values.changeIntervalDays)}
              onChange={(event) => updateNumber('changeIntervalDays', event.target.value)}
              required
            />
          </FormField>
          <FormField label="Thời hạn hiệu lực mật khẩu (ngày)" htmlFor="validityDays" required>
            <TextField
              id="validityDays"
              name="validityDays"
              inputMode="numeric"
              value={String(values.validityDays)}
              onChange={(event) => updateNumber('validityDays', event.target.value)}
              required
            />
          </FormField>
        </div>
        <p className={styles.hint}>
          Hết chu kỳ đổi: người dùng phải đặt mật khẩu mới khi đăng nhập. Hết hạn hiệu lực: tài
          khoản bị khóa và chỉ mở lại sau khi đổi mật khẩu thành công.
        </p>
      </div>

      <div className={styles.panel}>
        <h3 className={styles.heading}>Giới hạn đăng nhập sai</h3>
        <div className={styles.grid}>
          <FormField label="Số lần đăng nhập sai tối đa" htmlFor="maxFailedLogins" required>
            <TextField
              id="maxFailedLogins"
              name="maxFailedLogins"
              inputMode="numeric"
              value={String(values.maxFailedLogins)}
              onChange={(event) => updateNumber('maxFailedLogins', event.target.value)}
              required
            />
          </FormField>
          <FormField label="Trong khoảng thời gian (phút)" htmlFor="failedLoginWindowMinutes" required>
            <TextField
              id="failedLoginWindowMinutes"
              name="failedLoginWindowMinutes"
              inputMode="numeric"
              value={String(values.failedLoginWindowMinutes)}
              onChange={(event) => updateNumber('failedLoginWindowMinutes', event.target.value)}
              required
            />
          </FormField>
          <FormField label="Thời gian chặn đăng nhập (phút)" htmlFor="loginLockoutMinutes" required>
            <TextField
              id="loginLockoutMinutes"
              name="loginLockoutMinutes"
              inputMode="numeric"
              value={String(values.loginLockoutMinutes)}
              onChange={(event) => updateNumber('loginLockoutMinutes', event.target.value)}
              required
            />
          </FormField>
        </div>
        <p className={styles.hint}>
          Vượt số lần sai trong cửa sổ thời gian: cảnh báo người dùng và tạm khóa tài khoản để chặn
          đăng nhập tự động cho đến khi hết thời gian chặn.
        </p>
      </div>

      <div className={styles.actions}>
        {error ? <p className={styles.error}>{error}</p> : saved ? (
          <p className={styles.success}>Đã lưu chính sách mật khẩu.</p>
        ) : (
          <span />
        )}
        <Button type="submit" variant="success">
          Lưu chính sách
        </Button>
      </div>
    </form>
  )
}
