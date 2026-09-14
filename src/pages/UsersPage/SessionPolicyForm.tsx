import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/common/Button'
import { FormField } from '@/components/common/FormField'
import { TextField } from '@/components/common/TextField'
import { isApiError } from '@/services/api/http'
import {
  fetchSessionPolicy,
  updateSessionPolicy,
} from '@/services/sessionPolicy/sessionPolicyApi'
import {
  getSessionPolicy,
  setSessionPolicy,
  subscribeSessionPolicy,
  type SessionPolicy,
} from '@/settings/sessionPolicy'
import { validateInteger } from '@/validation'
import styles from './PasswordPolicyForm.module.css'

export function SessionPolicyForm() {
  const [values, setValues] = useState<SessionPolicy>(() => getSessionPolicy())
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => subscribeSessionPolicy(setValues), [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const remote = await fetchSessionPolicy()
        if (cancelled) return
        setSessionPolicy({ idleTimeoutMinutes: remote.idleTimeoutMinutes })
        setValues({ idleTimeoutMinutes: remote.idleTimeoutMinutes })
      } catch {
        // Keep local policy.
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const check = validateInteger(String(values.idleTimeoutMinutes), 'Thời gian chờ', 1, 10080)
    if (!check.ok) {
      setError(check.message)
      return
    }

    void (async () => {
      try {
        const remote = await updateSessionPolicy(values.idleTimeoutMinutes)
        setSessionPolicy({ idleTimeoutMinutes: remote.idleTimeoutMinutes })
        setValues({ idleTimeoutMinutes: remote.idleTimeoutMinutes })
        setError('')
        setSaved(true)
      } catch (err) {
        // Fallback local save if BE fails.
        setSessionPolicy(values)
        setValues(getSessionPolicy())
        setError(
          isApiError(err)
            ? `${err.message} — đã lưu tạm trên máy.`
            : 'Không lưu được lên server — đã lưu tạm trên máy.',
        )
        setSaved(true)
      }
    })()
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.panel}>
        <h3 className={styles.heading}>Giới hạn thời gian chờ (timeout)</h3>
        <div className={styles.grid}>
          <FormField label="Đóng phiên khi không thao tác (phút)" htmlFor="idleTimeoutMinutes" required>
            <TextField
              id="idleTimeoutMinutes"
              name="idleTimeoutMinutes"
              inputMode="numeric"
              value={String(values.idleTimeoutMinutes)}
              disabled={loading}
              onChange={(event) => {
                const next = Number(event.target.value)
                setValues({
                  idleTimeoutMinutes: Number.isFinite(next) ? next : values.idleTimeoutMinutes,
                })
                setSaved(false)
              }}
              required
            />
          </FormField>
        </div>
        <p className={styles.hint}>
          Nếu phần mềm không nhận thao tác từ người dùng trong khoảng thời gian này, phiên kết nối
          sẽ bị đóng và yêu cầu đăng nhập lại. Giá trị đồng bộ với backend (`session-policy`).
        </p>
      </div>

      <div className={styles.actions}>
        {error ? <p className={styles.error}>{error}</p> : saved ? (
          <p className={styles.success}>Đã lưu thời gian chờ phiên.</p>
        ) : (
          <span />
        )}
        <Button type="submit" variant="success" disabled={loading}>
          Lưu cấu hình
        </Button>
      </div>
    </form>
  )
}
