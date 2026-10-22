/**
 * Format helpers for the app - Argentine locale
 */

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
  });
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDayNumber(dateStr: string): string {
  return new Date(dateStr).getDate().toString();
}

export function formatMonthShort(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-AR', { month: 'short' }).toUpperCase();
}

export function formatWeekday(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-AR', { weekday: 'short' }).toUpperCase();
}

/**
 * Check if stock is low (< 10% remaining)
 */
export function isLowStock(quota: number, sold: number, reserved: number): boolean {
  const available = quota - sold - reserved;
  return available > 0 && available <= Math.max(quota * 0.1, 5);
}

/**
 * Get available tickets count
 */
export function getAvailable(quota: number, sold: number, reserved: number): number {
  return Math.max(0, quota - sold - reserved);
}

/**
 * Validate Argentine DNI (7-8 digits)
 */
export function isValidDNI(dni: string): boolean {
  return /^\d{7,8}$/.test(dni.replace(/\./g, ''));
}

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Sanitize DNI input (remove dots)
 */
export function sanitizeDNI(dni: string): string {
  return dni.replace(/\./g, '').trim();
}
