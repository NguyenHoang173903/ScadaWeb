import { MOCK_USERS, type UserAccount } from '@/pages/UsersPage/usersData'
import {
  DEFAULT_PASSWORD,
  getPasswordPolicy,
  type PasswordPolicy,
} from './passwordPolicy'

export type AuthLockReason = 'expired' | 'failed-attempts' | null

export type PasswordChallengeReason = 'default' | 'interval' | 'expired'

export type AuthAccount = UserAccount & {
  password: string
  usingDefaultPassword: boolean
  passwordChangedAt: number | null
  locked: boolean
  lockReason: AuthLockReason
  failedLoginAt: number[]
  loginLockedUntil: number | null
}

export type AuthResult =
  | {
      ok: true
      account: AuthAccount | null
      challenge: PasswordChallengeReason | null
    }
  | {
      ok: false
      message: string
      warning?: string
      blockedUntil?: number
      remainingAttempts?: number
    }

const STORAGE_KEY = 'scadaweb.auth-accounts'
const ATTEMPT_STORAGE_KEY = 'scadaweb.login-attempts'
const DAY_MS = 24 * 60 * 60 * 1000

/** Tài khoản demo + mật khẩu tạm — chỉ để test khi chưa có backend (feature 4.4). */
const INITIAL_ACCOUNTS: AuthAccount[] = [
  {
    ...MOCK_USERS[0],
    password: 'Password1!',
    usingDefaultPassword: false,
    // Quá hạn hiệu lực để demo 1.3đ / 1.3e
    passwordChangedAt: Date.now() - 200 * DAY_MS,
    locked: false,
    lockReason: null,
    status: 'Đang hoạt động',
    failedLoginAt: [],
    loginLockedUntil: null,
  },
  {
    ...MOCK_USERS[1],
    password: DEFAULT_PASSWORD,
    usingDefaultPassword: true,
    passwordChangedAt: null,
    locked: false,
    lockReason: null,
    failedLoginAt: [],
    loginLockedUntil: null,
  },
]

let accounts: AuthAccount[] = INITIAL_ACCOUNTS.map((account) => ({ ...account }))

type Listener = (next: AuthAccount[]) => void
const listeners = new Set<Listener>()

function notify() {
  listeners.forEach((listener) => listener(accounts.map((account) => ({ ...account }))))
}

function readStored(): AuthAccount[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthAccount[]
    if (!Array.isArray(parsed) || parsed.length === 0) return null
    return parsed
  } catch {
    return null
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts))
  } catch {
    // Ignore private mode / quota errors.
  }
}

function normalizeAccount(account: AuthAccount): AuthAccount {
  const usingDefaultPassword = Boolean(account.usingDefaultPassword)
  return {
    ...account,
    usingDefaultPassword,
    password: usingDefaultPassword ? DEFAULT_PASSWORD : (account.password || ''),
    failedLoginAt: Array.isArray(account.failedLoginAt) ? account.failedLoginAt : [],
    loginLockedUntil: account.loginLockedUntil ?? null,
  }
}

function mergeStoredAccounts(stored: AuthAccount[]): AuthAccount[] {
  const byUsername = new Map(
    stored.map((account) => [account.username.toLowerCase(), normalizeAccount(account)]),
  )

  for (const seed of INITIAL_ACCOUNTS) {
    const existing = byUsername.get(seed.username.toLowerCase())
    if (!existing) {
      byUsername.set(seed.username.toLowerCase(), { ...seed })
      continue
    }
    if (existing.usingDefaultPassword) {
      existing.password = DEFAULT_PASSWORD
    }
  }

  return [...byUsername.values()]
}

const stored = readStored()
if (stored) accounts = mergeStoredAccounts(stored)

function formatRemain(ms: number) {
  const totalSec = Math.max(1, Math.ceil(ms / 1000))
  const minutes = Math.floor(totalSec / 60)
  const seconds = totalSec % 60
  if (minutes <= 0) return `${seconds} giây`
  if (seconds === 0) return `${minutes} phút`
  return `${minutes} phút ${seconds} giây`
}

function failedAttemptsInWindow(times: number[], windowMs: number, now: number) {
  return times.filter((time) => now - time < windowMs)
}

type LoginAttemptRecord = {
  times: number[]
  lockedUntil: number | null
}

let attemptsByUsername = new Map<string, LoginAttemptRecord>()

function toLockedUntil(value: unknown) {
  if (value == null || value === '') return null
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function readAttempts() {
  try {
    const raw = localStorage.getItem(ATTEMPT_STORAGE_KEY)
    if (!raw) {
      attemptsByUsername = new Map()
      return
    }
    const parsed = JSON.parse(raw) as Record<string, LoginAttemptRecord>
    attemptsByUsername = new Map(
      Object.entries(parsed).map(([key, value]) => [
        key,
        {
          times: Array.isArray(value.times)
            ? value.times.map((time) => Number(time)).filter((time) => Number.isFinite(time))
            : [],
          lockedUntil: toLockedUntil(value.lockedUntil),
        },
      ]),
    )
  } catch {
    attemptsByUsername = new Map()
  }
}

function persistAttempts() {
  try {
    localStorage.setItem(ATTEMPT_STORAGE_KEY, JSON.stringify(Object.fromEntries(attemptsByUsername)))
  } catch {
    // Ignore private mode / quota errors.
  }
}

readAttempts()

function usernameKey(username: string) {
  return username.trim().toLowerCase()
}

function windowMsOf(policy: PasswordPolicy) {
  return policy.failedLoginWindowMinutes * 60 * 1000
}

function lockoutMsOf(policy: PasswordPolicy) {
  return policy.loginLockoutMinutes * 60 * 1000
}

function resolveLockUntil(record: LoginAttemptRecord, policy: PasswordPolicy, now: number) {
  const lockoutMs = lockoutMsOf(policy)
  if (record.lockedUntil && now < record.lockedUntil) return record.lockedUntil

  const recent = failedAttemptsInWindow(record.times, windowMsOf(policy), now)
  if (recent.length < policy.maxFailedLogins) return null

  const lastFailure = recent[recent.length - 1] ?? now
  const until = lastFailure + lockoutMs
  return now < until ? until : null
}

function peekLoginAttempts(username: string, policy: PasswordPolicy, now = Date.now()) {
  readAttempts()
  const key = usernameKey(username)
  const record = attemptsByUsername.get(key) ?? { times: [], lockedUntil: null }

  if (record.lockedUntil && now >= record.lockedUntil) {
    attemptsByUsername.delete(key)
    persistAttempts()
    return { blocked: false as const, blockedUntil: null, remaining: policy.maxFailedLogins, failedCount: 0 }
  }

  const blockedUntil = resolveLockUntil(record, policy, now)
  if (blockedUntil && record.lockedUntil !== blockedUntil) {
    attemptsByUsername.set(key, { ...record, lockedUntil: blockedUntil })
    persistAttempts()
  }

  const recent = failedAttemptsInWindow(record.times, windowMsOf(policy), now)

  if (blockedUntil) {
    const failedCount = Math.max(recent.length, record.times.length, policy.maxFailedLogins)
    return { blocked: true as const, blockedUntil, remaining: 0, failedCount }
  }

  return {
    blocked: false as const,
    blockedUntil: null,
    remaining: Math.max(0, policy.maxFailedLogins - recent.length),
    failedCount: recent.length,
  }
}

function registerLoginFailure(username: string, policy: PasswordPolicy, now = Date.now()) {
  readAttempts()
  const key = usernameKey(username)
  const retainMs = Math.max(windowMsOf(policy), lockoutMsOf(policy))
  const record = attemptsByUsername.get(key) ?? { times: [], lockedUntil: null }
  const existingLock = resolveLockUntil(record, policy, now)
  if (existingLock) {
    return {
      blocked: true as const,
      blockedUntil: existingLock,
      remaining: 0,
      failedCount: Math.max(record.times.length, policy.maxFailedLogins),
    }
  }

  const recent = [...failedAttemptsInWindow(record.times, retainMs, now), now]
  const inWindow = failedAttemptsInWindow(recent, windowMsOf(policy), now)
  const lockedOut = inWindow.length >= policy.maxFailedLogins
  const next: LoginAttemptRecord = {
    times: recent,
    lockedUntil: lockedOut ? now + lockoutMsOf(policy) : null,
  }
  attemptsByUsername.set(key, next)
  persistAttempts()
  return {
    blocked: lockedOut,
    blockedUntil: next.lockedUntil,
    remaining: Math.max(0, policy.maxFailedLogins - inWindow.length),
    failedCount: inWindow.length,
  }
}

function clearLoginFailures(username: string) {
  readAttempts()
  attemptsByUsername.delete(usernameKey(username))
  persistAttempts()
}

export function getLoginAttemptStatus(username: string) {
  const policy = getPasswordPolicy()
  if (!username.trim()) {
    return {
      blocked: false as const,
      blockedUntil: null as number | null,
      remaining: policy.maxFailedLogins,
      failedCount: 0,
      message: '',
      warning: '',
    }
  }

  const lock = peekLoginAttempts(username, policy)
  if (lock.blocked && lock.blockedUntil) {
    return {
      ...lock,
      message: `Đã vượt quá số lần đăng nhập sai cho phép (${policy.maxFailedLogins} lần/${policy.failedLoginWindowMinutes} phút).`,
      warning: `Hệ thống đang chặn đăng nhập tự động. Thử lại sau ${formatRemain(lock.blockedUntil - Date.now())}.`,
    }
  }

  if (lock.failedCount <= 0) {
    return { ...lock, message: '', warning: '' }
  }

  return {
    ...lock,
    message: '',
    warning: failWarning(lock.failedCount, lock.remaining, policy),
  }
}

function failWarning(failedCount: number, remaining: number, policy: PasswordPolicy) {
  return `Cảnh báo chính sách đăng nhập: đã sai ${failedCount}/${policy.maxFailedLogins} lần. Còn ${remaining} lần thử trong ${policy.failedLoginWindowMinutes} phút.`
}

function applyExpiryLock(account: AuthAccount, policy: PasswordPolicy, now = Date.now()): AuthAccount {
  const current = normalizeAccount(account)

  if (current.loginLockedUntil && now < current.loginLockedUntil) {
    return {
      ...current,
      locked: true,
      lockReason: 'failed-attempts',
      status: 'Bị khóa (đăng nhập sai)',
    }
  }

  const clearedAttempts =
    current.lockReason === 'failed-attempts' && current.loginLockedUntil && now >= current.loginLockedUntil
      ? { locked: false, lockReason: null as AuthLockReason, loginLockedUntil: null, failedLoginAt: [] as number[] }
      : {}

  const base = { ...current, ...clearedAttempts }

  if (base.usingDefaultPassword || base.passwordChangedAt == null) {
    if (base.lockReason === 'failed-attempts' && base.loginLockedUntil && now < base.loginLockedUntil) {
      return base
    }
    return {
      ...base,
      locked: base.lockReason === 'failed-attempts' ? false : false,
      lockReason: base.lockReason === 'expired' ? null : base.lockReason,
      status: base.status === 'Ngưng hoạt động' ? 'Ngưng hoạt động' : 'Đang hoạt động',
    }
  }

  const ageDays = (now - base.passwordChangedAt) / DAY_MS
  if (ageDays >= policy.validityDays) {
    return {
      ...base,
      locked: true,
      lockReason: 'expired',
      status: 'Bị khóa (hết hạn mật khẩu)',
    }
  }

  if (base.lockReason === 'expired') {
    return { ...base, locked: false, lockReason: null, status: 'Đang hoạt động' }
  }

  return base
}

function refreshLocks(policy = getPasswordPolicy()) {
  accounts = accounts.map((account) => applyExpiryLock(account, policy))
  persist()
}

refreshLocks()

export function getAuthAccounts() {
  refreshLocks()
  return accounts.map((account) => ({ ...account }))
}

export function subscribeAuthAccounts(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function findAuthAccount(username: string) {
  refreshLocks()
  const key = username.trim().toLowerCase()
  return accounts.find((account) => account.username.toLowerCase() === key) ?? null
}

export function getPasswordChallenge(
  account: AuthAccount,
  policy = getPasswordPolicy(),
  now = Date.now(),
): PasswordChallengeReason | null {
  const current = applyExpiryLock(account, policy, now)
  if (current.lockReason === 'failed-attempts') return null
  if (current.usingDefaultPassword) return 'default'
  if (current.lockReason === 'expired') return 'expired'
  if (current.passwordChangedAt != null) {
    const ageDays = (now - current.passwordChangedAt) / DAY_MS
    if (ageDays >= policy.changeIntervalDays) return 'interval'
  }
  return null
}

function clearFailedLogins(account: AuthAccount): AuthAccount {
  return {
    ...account,
    failedLoginAt: [],
    loginLockedUntil: account.lockReason === 'failed-attempts' ? null : account.loginLockedUntil,
  }
}

/** Tạm thời: Quên mật khẩu? xóa khóa đăng nhập sai. Mở khóa chính thức sẽ do admin xử lý sau. */
export function unlockFailedLoginLock(username: string) {
  if (!username.trim()) {
    return { ok: false as const, message: 'Nhập tên đăng nhập rồi chọn Quên mật khẩu? để mở khóa tạm thời.' }
  }

  clearLoginFailures(username)

  const account = findAuthAccount(username)
  if (account && (account.lockReason === 'failed-attempts' || account.loginLockedUntil)) {
    upsertAccount({
      ...account,
      locked: account.lockReason === 'expired' ? account.locked : false,
      lockReason: account.lockReason === 'expired' ? 'expired' : null,
      failedLoginAt: [],
      loginLockedUntil: null,
      status:
        account.lockReason === 'expired'
          ? account.status
          : account.status === 'Ngưng hoạt động'
            ? 'Ngưng hoạt động'
            : 'Đang hoạt động',
    })
  }

  return {
    ok: true as const,
    warning: 'Đã mở khóa tạm thời. Bạn có thể đăng nhập lại.',
  }
}

export function authenticateAccount(username: string, password: string): AuthResult {
  if (!username.trim() || !password) {
    return { ok: false, message: 'Vui lòng nhập tên đăng nhập và mật khẩu.' }
  }

  const policy = getPasswordPolicy()
  const now = Date.now()
  const lock = peekLoginAttempts(username, policy, now)

  if (lock.blocked && lock.blockedUntil) {
    const account = findAuthAccount(username)
    if (account) {
      upsertAccount({
        ...account,
        locked: true,
        lockReason: 'failed-attempts',
        loginLockedUntil: lock.blockedUntil,
        status: 'Bị khóa (đăng nhập sai)',
      })
    }
    return {
      ok: false,
      message: `Đã vượt quá số lần đăng nhập sai cho phép (${policy.maxFailedLogins} lần/${policy.failedLoginWindowMinutes} phút).`,
      warning: `Hệ thống đang chặn đăng nhập tự động. Thử lại sau ${formatRemain(lock.blockedUntil - now)}.`,
      blockedUntil: lock.blockedUntil,
      remainingAttempts: 0,
    }
  }

  const account = findAuthAccount(username)
  const passwordOk = Boolean(account && account.password === password)

  if (!passwordOk) {
    const next = registerLoginFailure(username, policy, now)
    if (account) {
      upsertAccount({
        ...account,
        failedLoginAt: [...(account.failedLoginAt ?? []), now],
        locked: next.blocked,
        lockReason: next.blocked ? 'failed-attempts' : account.lockReason,
        loginLockedUntil: next.blockedUntil,
        status: next.blocked ? 'Bị khóa (đăng nhập sai)' : account.status,
      })
    }

    if (next.blocked && next.blockedUntil) {
      return {
        ok: false,
        message: `Bạn đã vượt quá số lần đăng nhập sai cho phép (${policy.maxFailedLogins} lần/${policy.failedLoginWindowMinutes} phút).`,
        warning: `Tài khoản/tên đăng nhập tạm khóa để chống đăng nhập tự động. Thử lại sau ${formatRemain(next.blockedUntil - now)}.`,
        blockedUntil: next.blockedUntil,
        remainingAttempts: 0,
      }
    }

    return {
      ok: false,
      message: 'Tên đăng nhập hoặc mật khẩu không đúng.',
      warning: failWarning(next.failedCount, next.remaining, policy),
      remainingAttempts: next.remaining,
    }
  }

  clearLoginFailures(username)
  const unlocked = applyExpiryLock(clearFailedLogins(account!), policy, now)
  upsertAccount(unlocked)
  const challenge = getPasswordChallenge(unlocked, policy, now)

  return { ok: true, account: unlocked, challenge }
}

export function completePasswordChange(username: string, nextPassword: string) {
  const account = findAuthAccount(username)
  if (!account) return null
  clearLoginFailures(username)

  const updated: AuthAccount = {
    ...account,
    password: nextPassword,
    usingDefaultPassword: false,
    passwordChangedAt: Date.now(),
    locked: false,
    lockReason: null,
    failedLoginAt: [],
    loginLockedUntil: null,
    status: account.status === 'Ngưng hoạt động' ? 'Ngưng hoạt động' : 'Đang hoạt động',
  }
  upsertAccount(updated)
  return updated
}

export function upsertAccount(next: AuthAccount) {
  const index = accounts.findIndex((account) => account.id === next.id)
  if (index >= 0) accounts[index] = { ...next }
  else accounts = [...accounts, { ...next }]
  persist()
  notify()
}

export function addAuthAccount(account: AuthAccount) {
  upsertAccount(account)
}

export const PASSWORD_CHALLENGE_COPY: Record<PasswordChallengeReason, string> = {
  default: 'Đây là lần đăng nhập đầu tiên với mật khẩu mặc định. Vui lòng đặt mật khẩu mới.',
  interval: 'Đã đến kỳ đổi mật khẩu định kỳ. Vui lòng đặt mật khẩu mới để tiếp tục.',
  expired:
    'Tài khoản đã bị khóa vì mật khẩu hết hạn hiệu lực. Đặt mật khẩu mới để tự động mở khóa.',
}
