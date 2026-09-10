export type PasswordPolicy = {
  minLength: number
  maxLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumber: boolean
  requireSpecial: boolean
  /** 1.3c — bắt buộc đổi mật khẩu định kỳ (ngày). */
  changeIntervalDays: number
  /** 1.3d — thời hạn hiệu lực mật khẩu (ngày). */
  validityDays: number
  /** 1.4a — số lần đăng nhập sai tối đa trong cửa sổ thời gian. */
  maxFailedLogins: number
  /** 1.4a — cửa sổ tính số lần đăng nhập sai (phút). */
  failedLoginWindowMinutes: number
  /** 1.4c — thời gian chặn đăng nhập sau khi vi phạm (phút). */
  loginLockoutMinutes: number
}

export type PasswordRule = {
  id: string
  label: string
  passed: boolean
}

export const DEFAULT_PASSWORD = '123456'

export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  maxLength: 32,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  changeIntervalDays: 90,
  validityDays: 180,
  maxFailedLogins: 5,
  failedLoginWindowMinutes: 15,
  loginLockoutMinutes: 15,
}

const STORAGE_KEY = 'scadaweb.password-policy'

let policy: PasswordPolicy = { ...DEFAULT_PASSWORD_POLICY }

function clampPolicy(value: Partial<PasswordPolicy>): PasswordPolicy {
  const minLength = Math.max(1, Math.floor(value.minLength ?? policy.minLength))
  const maxLength = Math.max(minLength, Math.floor(value.maxLength ?? policy.maxLength))
  const changeIntervalDays = Math.max(1, Math.floor(value.changeIntervalDays ?? policy.changeIntervalDays))
  const validityDays = Math.max(changeIntervalDays, Math.floor(value.validityDays ?? policy.validityDays))
  const maxFailedLogins = Math.max(1, Math.floor(value.maxFailedLogins ?? policy.maxFailedLogins))
  const failedLoginWindowMinutes = Math.max(
    1,
    Math.floor(value.failedLoginWindowMinutes ?? policy.failedLoginWindowMinutes),
  )
  const loginLockoutMinutes = Math.max(1, Math.floor(value.loginLockoutMinutes ?? policy.loginLockoutMinutes))

  return {
    minLength,
    maxLength,
    requireUppercase: value.requireUppercase ?? policy.requireUppercase,
    requireLowercase: value.requireLowercase ?? policy.requireLowercase,
    requireNumber: value.requireNumber ?? policy.requireNumber,
    requireSpecial: value.requireSpecial ?? policy.requireSpecial,
    changeIntervalDays,
    validityDays,
    maxFailedLogins,
    failedLoginWindowMinutes,
    loginLockoutMinutes,
  }
}

function readStored(): PasswordPolicy {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_PASSWORD_POLICY }
    return clampPolicy(JSON.parse(raw) as Partial<PasswordPolicy>)
  } catch {
    return { ...DEFAULT_PASSWORD_POLICY }
  }
}

policy = readStored()

type Listener = (next: PasswordPolicy) => void
const listeners = new Set<Listener>()

export function getPasswordPolicy() {
  return { ...policy }
}

export function setPasswordPolicy(next: Partial<PasswordPolicy>) {
  policy = clampPolicy({ ...policy, ...next })
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(policy))
  } catch {
    // Ignore private mode / quota errors.
  }
  listeners.forEach((listener) => listener({ ...policy }))
}

export function subscribePasswordPolicy(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getPasswordRules(password: string, current = getPasswordPolicy()): PasswordRule[] {
  const rules: PasswordRule[] = [
    {
      id: 'length',
      label: `Từ ${current.minLength} đến ${current.maxLength} ký tự`,
      passed: password.length >= current.minLength && password.length <= current.maxLength,
    },
  ]

  if (current.requireLowercase) {
    rules.push({
      id: 'lower',
      label: 'Có chữ thường (a-z)',
      passed: /[a-z]/.test(password),
    })
  }
  if (current.requireUppercase) {
    rules.push({
      id: 'upper',
      label: 'Có chữ hoa (A-Z)',
      passed: /[A-Z]/.test(password),
    })
  }
  if (current.requireNumber) {
    rules.push({
      id: 'number',
      label: 'Có chữ số (0-9)',
      passed: /\d/.test(password),
    })
  }
  if (current.requireSpecial) {
    rules.push({
      id: 'special',
      label: 'Có ký tự đặc biệt (!@#$%^&*…)',
      passed: /[^A-Za-z0-9]/.test(password),
    })
  }

  return rules
}

export function validatePassword(password: string, current = getPasswordPolicy()) {
  const rules = getPasswordRules(password, current)
  const failed = rules.filter((rule) => !rule.passed)
  return {
    ok: failed.length === 0,
    rules,
    message: failed[0]?.label ? `Mật khẩu chưa đạt: ${failed[0].label.toLowerCase()}.` : '',
  }
}
