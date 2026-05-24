// ============================================================
// FormuLab — Utility Functions
// ============================================================

import type { FormulationType } from './types';

/**
 * Format a date string to a human-readable format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date string to relative time (e.g., "2 hours ago")
 */
export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(dateString);
}

/**
 * Generate a URL-safe slug from a string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Safely parse JSON with a fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Get formulation type color for badges/charts
 */
export function getFormulationTypeColor(type: FormulationType | string): string {
  const colors: Record<string, string> = {
    SC: '#6366f1',
    EC: '#f59e0b',
    WDG: '#10b981',
    WP: '#8b5cf6',
    EW: '#3b82f6',
    SL: '#06b6d4',
    CS: '#ec4899',
    SE: '#f97316',
    OD: '#84cc16',
    ZC: '#14b8a6',
    ME: '#a855f7',
    DC: '#ef4444',
  };
  return colors[type] || '#6b7280';
}

/**
 * Truncate text to a max length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '…';
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Generate a random ID (for client-side temp IDs)
 */
export function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Convert CAS number to display format
 */
export function formatCAS(cas: string): string {
  // CAS numbers are typically in format XXXX-XX-X
  if (cas.includes('-')) return cas;
  if (cas.length < 5) return cas;
  const checkDigit = cas.slice(-1);
  const middle = cas.slice(-3, -1);
  const front = cas.slice(0, -3);
  return `${front}-${middle}-${checkDigit}`;
}
