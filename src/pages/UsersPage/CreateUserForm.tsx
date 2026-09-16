import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/common/Button'
import { FormField } from '@/components/common/FormField'
import { SelectField } from '@/components/common/SelectField'
import { TextAreaField } from '@/components/common/TextAreaField'
import { TextField } from '@/components/common/TextField'
import { PasswordRuleList } from '@/components/auth/PasswordRuleList'
import { ToggleSwitch } from '@/components/common/ToggleSwitch'
import { validatePassword } from '@/settings/passwordPolicy'
import {
  firstError,
  validateOptionalInteger,
  validateUsername,
} from '@/validation'
import styles from './CreateUserForm.module.css'

export type CreateUserFormValues = {
  username: string
  password: string
  confirmPassword: string
  fullName: string
  department: string
  position: string
  role: string
  level: string
  active: boolean
  description: string
  forceChangeOnFirstLogin: boolean
}

type CreateUserFormProps = {
  mode?: 'create' | 'edit'
  initialValues?: Partial<CreateUserFormValues>
  submitLabel?: string
  onSubmit?: (values: CreateUserFormValues) => void
  onCancel?: () => void
}

const ROLE_OPTIONS = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'Operator', label: 'Operator' },
  { value: 'Administrator', label: 'Administrator' },
]

const INITIAL_VALUES: CreateUserFormValues = {
  username: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  department: '',
  position: '',
  role: 'viewer',
  level: '',
  active: true,
  description: '',
  forceChangeOnFirstLogin: true,
}

export function CreateUserForm({
  mode = 'create',
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: CreateUserFormProps) {
  const [values, setValues] = useState<CreateUserFormValues>({
    ...INITIAL_VALUES,
    ...initialValues,
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (!initialValues) return
    setValues((current) => ({ ...current, ...initialValues }))
  }, [initialValues])

  const updateField = <K extends keyof CreateUserFormValues>(
    key: K,
    value: CreateUserFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (mode === 'create') {
      const passwordCheck = validatePassword(values.password)
      const check = firstError(
        validateUsername(values.username),
        values.password !== values.confirmPassword
          ? { ok: false, message: 'Mật khẩu xác nhận không khớp.' }
          : { ok: true },
        passwordCheck.ok ? { ok: true } : { ok: false, message: passwordCheck.message },
        validateOptionalInteger(values.level, 'Cấp độ', 1, 100),
      )
      if (!check.ok) {
        setError(check.message)
        return
      }
    } else {
      const check = validateOptionalInteger(values.level, 'Cấp độ', 1, 100)
      if (!check.ok) {
        setError(check.message)
        return
      }
    }

    setError('')
    onSubmit?.(values)
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.panel}>
        <div className={styles.grid}>
          <div className={styles.column}>
            <FormField label="Tên đăng nhập" htmlFor="username" required={mode === 'create'}>
              <TextField
                id="username"
                name="username"
                autoComplete="username"
                maxLength={32}
                value={values.username}
                onChange={(event) => updateField('username', event.target.value)}
                required={mode === 'create'}
                disabled={mode === 'edit'}
              />
            </FormField>

            {mode === 'create' ? (
              <>
                <FormField label="Mật khẩu" htmlFor="password" required>
                  <TextField
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={values.password}
                    onChange={(event) => updateField('password', event.target.value)}
                    required
                  />
                  <PasswordRuleList password={values.password} />
                </FormField>

                <FormField label="Xác nhận mật khẩu" htmlFor="confirmPassword" required>
                  <TextField
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={values.confirmPassword}
                    onChange={(event) =>
                      updateField('confirmPassword', event.target.value)
                    }
                    required
                  />
                </FormField>
              </>
            ) : null}
          </div>

          <div className={styles.column}>
            <FormField label="Họ và tên" htmlFor="fullName">
              <TextField
                id="fullName"
                name="fullName"
                value={values.fullName}
                onChange={(event) => updateField('fullName', event.target.value)}
              />
            </FormField>

            <FormField label="Phòng ban/ Đơn vị" htmlFor="department">
              <TextField
                id="department"
                name="department"
                value={values.department}
                onChange={(event) => updateField('department', event.target.value)}
              />
            </FormField>

            <FormField label="Chức vụ" htmlFor="position">
              <TextField
                id="position"
                name="position"
                value={values.position}
                onChange={(event) => updateField('position', event.target.value)}
              />
            </FormField>
          </div>

          <div className={styles.column}>
            <FormField label="Vai trò" htmlFor="role">
              <SelectField
                id="role"
                name="role"
                options={ROLE_OPTIONS}
                value={values.role}
                onChange={(event) => updateField('role', event.target.value)}
              />
            </FormField>

            <FormField label="Cấp độ" htmlFor="level">
              <TextField
                id="level"
                name="level"
                inputMode="numeric"
                value={values.level}
                onChange={(event) => updateField('level', event.target.value)}
              />
            </FormField>

            <div className={styles.statusRow}>
              <span className={styles.statusLabel}>Trạng thái tài khoản</span>
              <ToggleSwitch
                id="active"
                aria-label="Trạng thái tài khoản"
                checked={values.active}
                onChange={(checked) => updateField('active', checked)}
              />
            </div>

            <div className={styles.statusRow}>
              <span className={styles.statusLabel}>Bắt buộc đổi mật khẩu lần đăng nhập đầu</span>
              <ToggleSwitch
                id="forceChangeOnFirstLogin"
                aria-label="Bắt buộc đổi mật khẩu lần đăng nhập đầu"
                checked={values.forceChangeOnFirstLogin}
                onChange={(checked) => updateField('forceChangeOnFirstLogin', checked)}
              />
            </div>

            <FormField label="Mô tả" htmlFor="description">
              <TextAreaField
                id="description"
                name="description"
                rows={4}
                value={values.description}
                onChange={(event) => updateField('description', event.target.value)}
              />
            </FormField>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        {error ? <p className={styles.error}>{error}</p> : <span />}
        <div style={{ display: 'flex', gap: 12 }}>
          {onCancel ? (
            <Button type="button" variant="secondary" onClick={onCancel}>
              Hủy
            </Button>
          ) : null}
          <Button type="submit" variant="success">
            {submitLabel ?? (mode === 'edit' ? 'Cập nhật' : 'Xác nhận')}
          </Button>
        </div>
      </div>
    </form>
  )
}
