import { describe, expect, it } from 'vitest'
import { createInitialTimesheet } from '../../data/initialTimesheet'
import { buildExcelWorkbook } from '../excelExport'
import { parseExcelBufferToTimesheet } from '../excelImport'
import { calcAutoHours, getEffectiveHours, parseTimeToMinutes } from '../timeCalc'

describe('timeCalc', () => {
  it('parses valid HH:mm strings', () => {
    expect(parseTimeToMinutes('09:30')).toBe(570)
    expect(parseTimeToMinutes('20:30')).toBe(1230)
    expect(parseTimeToMinutes('')).toBeNull()
    expect(parseTimeToMinutes('25:00')).toBeNull()
  })

  it('calculates auto hours with 1.5h break matching Excel formula', () => {
    expect(calcAutoHours('09:30', '20:30', 1.5)).toBe(9.5)
    expect(calcAutoHours('09:30', '19:30', 1.5)).toBe(8.5)
    expect(calcAutoHours('09:30', '21:00', 1.5)).toBe(10)
    expect(calcAutoHours('14:00', '', 1.5)).toBeNull()
  })

  it('prefers manualHours over auto calculation when set', () => {
    const row = {
      id: '1',
      date: '2026-11-10',
      startTime: '09:30',
      endTime: '20:30',
      content: '',
      summary: '',
      manualHours: 8,
      basis: '',
    }
    expect(getEffectiveHours(row, 1.5)).toBe(8)
  })
})

describe('excelExport', () => {
  it('builds a valid two-sheet ExcelJS workbook from initial data', async () => {
    const data = createInitialTimesheet()
    const wb = buildExcelWorkbook(data)

    expect(wb.worksheets.map((ws) => ws.name)).toEqual(['Sheet1', '11月16日工时复核'])

    const ws1 = wb.getWorksheet('Sheet1')!
    expect(ws1.getCell('A1').value).toContain('工作记录表')
    expect(ws1.getCell('B2').value).toBe(11)
    expect(ws1.getCell('D4').value).toContain('题库与考试')

    // Total row is at 4 + 11 = 15
    const totalCell = ws1.getCell('F15').value as { formula: string; result: number }
    expect(totalCell.formula).toBe('SUM(F4:F14)')
    expect(totalCell.result).toBe(89.5)

    const buffer = await wb.xlsx.writeBuffer()
    expect(buffer.byteLength).toBeGreaterThan(5000)
  })

  it('round-trips exported Excel buffer back into TimesheetWorkbook', async () => {
    const initial = createInitialTimesheet()
    const wb = buildExcelWorkbook(initial)
    const buffer = (await wb.xlsx.writeBuffer()) as ArrayBuffer

    const imported = await parseExcelBufferToTimesheet(buffer)
    expect(imported.month).toBe(11)
    expect(imported.records).toHaveLength(initial.records.length)
    expect(imported.records[0].date).toBe('2026-11-10')
    expect(imported.records[0].startTime).toBe('09:30')
    expect(imported.records[0].endTime).toBe('20:30')
    expect(imported.reviewItems).toHaveLength(initial.reviewItems.length)
    expect(imported.extraReviewItems).toHaveLength(initial.extraReviewItems.length)
  })
})
