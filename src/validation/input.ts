export type ValidationResult = { ok: true } | { ok: false; message: string }

export function ok(): ValidationResult {
  return { ok: true }
}

export function fail(message: string): ValidationResult {
  return { ok: false, message }
}

export function firstError(...results: ValidationResult[]): ValidationResult {
  return results.find((result) => !result.ok) ?? ok()
}

const USERNAME_PATTERN = /^[A-Za-z][A-Za-z0-9._-]{2,31}$/
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const HTTP_URL_PATTERN = /^https?:\/\/[^\s]+$/i

export function validateRequired(value: string, label: string): ValidationResult {
  if (!value.trim()) return fail(`Vui lòng nhập ${label}.`)
  return ok()
}

export function validateUsername(value: string): ValidationResult {
  const username = value.trim()
  if (!username) return fail('Vui lòng nhập tên đăng nhập.')
  if (username.length < 3 || username.length > 32) {
    return fail('Tên đăng nhập phải từ 3 đến 32 ký tự.')
  }
  if (!USERNAME_PATTERN.test(username)) {
    return fail(
      'Tên đăng nhập không hợp lệ. Bắt đầu bằng chữ cái, chỉ gồm chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.',
    )
  }
  return ok()
}

export function validateLoginPassword(value: string): ValidationResult {
  if (!value) return fail('Vui lòng nhập mật khẩu.')
  if (value.length > 128) return fail('Mật khẩu không được vượt quá 128 ký tự.')
  return ok()
}

export function validateInteger(
  raw: string,
  label: string,
  min: number,
  max: number,
): ValidationResult {
  const trimmed = raw.trim()
  if (!trimmed) return fail(`Vui lòng nhập ${label}.`)
  if (!/^-?\d+$/.test(trimmed)) return fail(`${label} phải là số nguyên.`)
  const value = Number(trimmed)
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    return fail(`${label} phải từ ${min} đến ${max}.`)
  }
  return ok()
}

export function validateOptionalInteger(
  raw: string,
  label: string,
  min: number,
  max: number,
): ValidationResult {
  if (!raw.trim()) return ok()
  return validateInteger(raw, label, min, max)
}

export function validateIsoDate(value: string, label: string): ValidationResult {
  if (!value) return fail(`Vui lòng chọn ${label}.`)
  if (!ISO_DATE_PATTERN.test(value)) return fail(`${label} không đúng định dạng ngày.`)
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return fail(`${label} không hợp lệ.`)
  }
  return ok()
}

export function validateDateRange(fromDate: string, toDate: string): ValidationResult {
  const fromCheck = fromDate ? validateIsoDate(fromDate, 'Từ ngày') : ok()
  if (!fromCheck.ok) return fromCheck
  const toCheck = toDate ? validateIsoDate(toDate, 'Đến ngày') : ok()
  if (!toCheck.ok) return toCheck
  if (fromDate && toDate && fromDate > toDate) {
    return fail('Từ ngày không được lớn hơn đến ngày.')
  }
  return ok()
}

export function validateKeyword(value: string, maxLength = 120): ValidationResult {
  if (value.length > maxLength) {
    return fail(`Từ khóa tìm kiếm không được vượt quá ${maxLength} ký tự.`)
  }
  return ok()
}

export function validateYear(raw: string, label = 'Năm xây dựng'): ValidationResult {
  if (!raw.trim()) return ok()
  const current = new Date().getFullYear()
  return validateInteger(raw, label, 1900, current + 5)
}

export function validateHttpUrl(value: string, label: string): ValidationResult {
  const url = value.trim()
  if (!url) return fail(`Vui lòng nhập ${label}.`)
  if (!HTTP_URL_PATTERN.test(url)) {
    return fail(`${label} phải bắt đầu bằng http:// hoặc https://.`)
  }
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return fail(`${label} không hợp lệ.`)
    }
  } catch {
    return fail(`${label} không hợp lệ.`)
  }
  return ok()
}

export function validateSecretKey(value: string, label: string, minLength = 16): ValidationResult {
  const key = value.trim()
  if (!key) return fail(`Vui lòng nhập ${label}.`)
  if (key.length < minLength) return fail(`${label} quá ngắn (tối thiểu ${minLength} ký tự).`)
  if (/\s/.test(key)) return fail(`${label} không được chứa khoảng trắng.`)
  return ok()
}

export function validateUploadFile(
  file: File | undefined,
  options: { acceptExt: string[]; maxBytes: number; label: string },
): ValidationResult {
  if (!file) return fail(`Vui lòng chọn ${options.label}.`)
  const name = file.name.toLowerCase()
  const okExt = options.acceptExt.some((ext) => name.endsWith(ext.toLowerCase()))
  if (!okExt) {
    return fail(`${options.label} chỉ nhận định dạng: ${options.acceptExt.join(', ')}.`)
  }
  if (file.size > options.maxBytes) {
    const maxMb = Math.round(options.maxBytes / (1024 * 1024))
    return fail(`${options.label} không được vượt quá ${maxMb} MB.`)
  }
  if (file.size <= 0) return fail(`${options.label} không hợp lệ.`)
  return ok()
}

export const IMAGE_UPLOAD = {
  acceptExt: ['.jpg', '.jpeg', '.png', '.webp'],
  maxBytes: 5 * 1024 * 1024,
  label: 'ảnh khu vực',
} as const
