import ExcelJS from 'exceljs'
import { createInitialTimesheet } from '../data/initialTimesheet'
import type { ReviewItemRow, TimesheetWorkbook, WorkRecordRow } from '../types/timesheet'
import { calcAutoHours } from './timeCalc'

function cellText(val: ExcelJS.CellValue): string {
  if (val === null || val === undefined) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'number' || typeof val === 'boolean') return String(val)
  if (val instanceof Date) return val.toISOString()
  if (typeof val === 'object') {
    if ('richText' in val && Array.isArray(val.richText)) {
      return val.richText.map((part) => part.text ?? '').join('')
    }
    if ('text' in val && typeof val.text === 'string') {
      return val.text
    }
    if ('result' in val && val.result !== undefined) {
      return cellText(val.result as ExcelJS.CellValue)
    }
  }
  return ''
}

function parseExcelDate(val: ExcelJS.CellValue): string {
  if (val === null || val === undefined) return ''
  if (val instanceof Date) {
    const y = val.getUTCFullYear()
    const m = String(val.getUTCMonth() + 1).padStart(2, '0')
    const d = String(val.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  if (typeof val === 'number') {
    const base = Date.UTC(1899, 11, 30)
    const dt = new Date(base + Math.round(val) * 86400000)
    return dt.toISOString().slice(0, 10)
  }
  const str = cellText(val).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10)
  }
  return str
}

function parseExcelTime(val: ExcelJS.CellValue): string {
  if (val === null || val === undefined) return ''
  if (val instanceof Date) {
    const h = String(val.getUTCHours()).padStart(2, '0')
    const m = String(val.getUTCMinutes()).padStart(2, '0')
    return `${h}:${m}`
  }
  if (typeof val === 'number') {
    const fraction = val % 1
    const totalMins = Math.round(fraction * 24 * 60)
    const h = String(Math.floor(totalMins / 60) % 24).padStart(2, '0')
    const m = String(totalMins % 60).padStart(2, '0')
    return `${h}:${m}`
  }
  const str = cellText(val).trim()
  const match = str.match(/(\d{1,2}):(\d{2})/)
  if (match) {
    return `${match[1].padStart(2, '0')}:${match[2]}`
  }
  return ''
}

function parseExcelNumber(val: ExcelJS.CellValue): number | null {
  if (val === null || val === undefined) return null
  if (typeof val === 'number') return Number.isNaN(val) ? null : val
  if (typeof val === 'object' && 'result' in val && typeof val.result === 'number') {
    return Number.isNaN(val.result) ? null : val.result
  }
  const n = Number(cellText(val).trim())
  return Number.isNaN(n) || cellText(val).trim() === '' ? null : n
}

export async function parseExcelBufferToTimesheet(
  buffer: ArrayBuffer,
): Promise<TimesheetWorkbook> {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buffer)

  const base = createInitialTimesheet()
  const ws1 = wb.getWorksheet('Sheet1') ?? wb.worksheets[0]
  if (!ws1) {
    throw new Error('未找到有效的工作表')
  }

  const titleText = cellText(ws1.getCell('A1').value).trim()
  if (titleText) base.title = titleText

  const monthNum = parseExcelNumber(ws1.getCell('B2').value)
  if (monthNum && monthNum >= 1 && monthNum <= 12) {
    base.month = monthNum
  }

  const records: WorkRecordRow[] = []
  for (let r = 4; r <= ws1.rowCount; r++) {
    const row = ws1.getRow(r)
    const colE = cellText(row.getCell(5).value).trim()
    if (colE === '合计工时') break

    const date = parseExcelDate(row.getCell(1).value)
    const startTime = parseExcelTime(row.getCell(2).value)
    const endTime = parseExcelTime(row.getCell(3).value)
    const content = cellText(row.getCell(4).value)
    const summary = colE
    const basis = cellText(row.getCell(7).value)

    if (!date && !startTime && !endTime && !content && !summary && !basis) {
      continue
    }

    const rawF = row.getCell(6).value
    const isFormula = typeof rawF === 'object' && rawF !== null && 'formula' in rawF
    const numHours = parseExcelNumber(rawF)
    const autoHours = calcAutoHours(startTime, endTime, base.breakHours)

    let manualHours: number | null = null
    if (!isFormula && numHours !== null && numHours !== autoHours) {
      manualHours = numHours
    }

    records.push({
      id: `rec-imp-${r}-${Date.now().toString(36)}`,
      date,
      startTime,
      endTime,
      content,
      summary,
      manualHours,
      basis,
    })
  }

  if (records.length > 0) {
    base.records = records
  }

  const ws2 = wb.getWorksheet('11月16日工时复核') ?? wb.worksheets[1]
  if (ws2) {
    const revTitle = cellText(ws2.getCell('A1').value).trim()
    if (revTitle) base.reviewTitle = revTitle

    const reviewItems: ReviewItemRow[] = []
    const extraReviewItems: ReviewItemRow[] = []
    let inExtraSection = false

    for (let r = 5; r <= ws2.rowCount; r++) {
      const row = ws2.getRow(r)
      const task = cellText(row.getCell(1).value).trim()

      if (task.startsWith('11 月 16 日原填报') || task.startsWith('11 月 16 日已核对') || task.startsWith('与原填报差额')) {
        continue
      }
      if (task.startsWith('差额仅供复核')) {
        inExtraSection = true
        continue
      }

      const verifiableRecord = cellText(row.getCell(2).value).trim()
      const submitDate = parseExcelDate(row.getCell(3).value)
      const actualDate = parseExcelDate(row.getCell(4).value)
      const actualHours = parseExcelNumber(row.getCell(5).value)
      const notes = cellText(row.getCell(6).value)

      if (!task && !verifiableRecord && !submitDate && !actualDate && actualHours === null && !notes) {
        continue
      }

      const item: ReviewItemRow = {
        id: `rev-imp-${r}-${Date.now().toString(36)}`,
        task,
        verifiableRecord,
        submitDate,
        actualDate,
        actualHours,
        notes,
      }

      if (inExtraSection) {
        extraReviewItems.push(item)
      } else {
        reviewItems.push(item)
      }
    }

    if (reviewItems.length > 0) base.reviewItems = reviewItems
    if (extraReviewItems.length > 0) base.extraReviewItems = extraReviewItems
  }

  return base
}
