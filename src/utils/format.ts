export function formatEGP(amount: number): string {
  return new Intl.NumberFormat('ar-EG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' ج.م';
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ar-EG').format(num);
}

export function formatNumberEn(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}
