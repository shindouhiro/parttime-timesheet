import type { WorkRecordRow } from '../types/timesheet'

/**
 * Parse "HH:mm" into total minutes from midnight. Returns null if invalid.
 */
export function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr || !/^\d{1,2}:\d{2}$/.test(timeStr.trim())) {
    return null
  }
  const [hStr, mStr] = timeStr.trim().split(':')
  const hours = Number(hStr)
  const minutes = Number(mStr)
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null
  }
  return hours * 60 + minutes
}

/**
 * Compute work hours matching Excel formula:
 * IF(COUNT(B:C)<2, "", ROUND((C-B)*24 - breakHours, 2))
 */
export function calcAutoHours(
  startTime: string,
  endTime: string,
  breakHours = 1.5,
): number | null {
  const startMin = parseTimeToMinutes(startTime)
  const endMin = parseTimeToMinutes(endTime)
  if (startMin === null || endMin === null) {
    return null
  }
  const rawHours = (endMin - startMin) / 60 - breakHours
  return Math.round(rawHours * 100) / 100
}

/**
 * Get effective hours for a work record row (manual override takes precedence).
 */
export function getEffectiveHours(row: WorkRecordRow, breakHours = 1.5): number | null {
  if (row.manualHours !== null && !Number.isNaN(row.manualHours)) {
    return Math.round(row.manualHours * 100) / 100
  }
  return calcAutoHours(row.startTime, row.endTime, breakHours)
}

/**
 * Convert "HH:mm" to Excel day fraction (0..1)
 */
export function timeToExcelFraction(timeStr: string): number | null {
  const mins = parseTimeToMinutes(timeStr)
  if (mins === null) return null
  return mins / (24 * 60)
}

/**
 * Convert "YYYY-MM-DD" to a UTC Date object suitable for ExcelJS date cells
 * without timezone shift.
 */
export function dateStrToExcelDate(dateStr: string): Date | null {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
    return null
  }
  const [y, m, d] = dateStr.trim().split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

/**
 * Combine "YYYY-MM-DD" and "HH:mm" into a UTC Date object for Excel datetime cells.
 */
export function dateTimeToExcelDate(dateStr: string, timeStr: string): Date | null {
  const mins = parseTimeToMinutes(timeStr)
  if (mins === null) return null
  const base = dateStrToExcelDate(dateStr) ?? new Date(Date.UTC(1899, 11, 30))
  const hours = Math.floor(mins / 60)
  const remMins = mins % 60
  return new Date(base.getTime() + (hours * 60 + remMins) * 60 * 1000)
}
