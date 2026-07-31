export function formatNumber(value: number, fractionDigits = 2): string {
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: fractionDigits,
  }).format(value)
}
