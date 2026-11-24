import ExcelJS from 'exceljs'
import type { TimesheetWorkbook } from '../types/timesheet'
import {
  calcAutoHours,
  dateStrToExcelDate,
  dateTimeToExcelDate,
  getEffectiveHours,
} from './timeCalc'

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
}

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF1F5F9' },
}

const TITLE_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE2E8F0' },
}

function estimateRowHeight(text: string, minHeight = 26): number {
  if (!text) return minHeight
  const lines = text.split('\n').reduce((acc, line) => {
    return acc + Math.max(1, Math.ceil(line.length / 34))
  }, 0)
  return Math.max(minHeight, Math.min(260, lines * 18 + 14))
}

export function buildExcelWorkbook(data: TimesheetWorkbook): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook()
  wb.creator = '兼职工作记录表'
  wb.created = new Date()

  // ==================== Sheet 1: 工作记录表 ====================
  const ws1 = wb.addWorksheet('Sheet1')
  ws1.columns = [
    { width: 14 },
    { width: 15 },
    { width: 15 },
    { width: 62 },
    { width: 22 },
    { width: 18 },
    { width: 28 },
  ]

  // Row 1: Title
  ws1.mergeCells('A1:G1')
  const titleCell = ws1.getCell('A1')
  titleCell.value = ` ${data.title || '工作记录表'}`
  titleCell.font = { name: 'PingFang SC', size: 13, bold: true, color: { argb: 'FF0F172A' } }
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' }
  titleCell.fill = TITLE_FILL
  ws1.getRow(1).height = 24

  // Row 2: Month
  const row2 = ws1.getRow(2)
  row2.height = 22
  ws1.getCell('A2').value = '月份'
  ws1.getCell('A2').font = { name: 'PingFang SC', size: 11, bold: true }
  ws1.getCell('A2').alignment = { vertical: 'middle', horizontal: 'center' }
  ws1.getCell('B2').value = data.month
  ws1.getCell('B2').font = { name: 'PingFang SC', size: 11, bold: true }
  ws1.getCell('B2').alignment = { vertical: 'middle', horizontal: 'center' }
  for (let c = 1; c <= 7; c++) {
    ws1.getCell(2, c).border = THIN_BORDER
  }

  // Row 3: Headers
  const headers1 = [
    '日期',
    '工作开始时间',
    '工作结束时间',
    '工作内容',
    '概述',
    '工时(单位: 小时)',
    '工时口径与核对依据',
  ]
  const headerRow1 = ws1.getRow(3)
  headerRow1.height = 24
  headers1.forEach((text, idx) => {
    const cell = headerRow1.getCell(idx + 1)
    cell.value = text
    cell.font = { name: 'PingFang SC', size: 10.5, bold: true, color: { argb: 'FF1E293B' } }
    cell.fill = HEADER_FILL
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = THIN_BORDER
  })

  // Data Rows (starting at row 4)
  let totalHours = 0
  let nov16RowNumber: number | null = null
  let nov16Hours: number | null = null

  data.records.forEach((rec, idx) => {
    const rNum = 4 + idx
    const row = ws1.getRow(rNum)
    row.height = estimateRowHeight(rec.content, 28)

    const dateVal = dateStrToExcelDate(rec.date)
    const startVal = dateTimeToExcelDate(rec.date, rec.startTime)
    const endVal = dateTimeToExcelDate(rec.date, rec.endTime)

    const cellA = row.getCell(1)
    cellA.value = dateVal ?? (rec.date || null)
    if (dateVal) cellA.numFmt = 'yyyy-mm-dd'
    cellA.alignment = { vertical: 'middle', horizontal: 'center' }

    const cellB = row.getCell(2)
    cellB.value = startVal ?? (rec.startTime || null)
    if (startVal) cellB.numFmt = 'hh:mm'
    cellB.alignment = { vertical: 'middle', horizontal: 'center' }

    const cellC = row.getCell(3)
    cellC.value = endVal ?? (rec.endTime || null)
    if (endVal) cellC.numFmt = 'hh:mm'
    cellC.alignment = { vertical: 'middle', horizontal: 'center' }

    const cellD = row.getCell(4)
    cellD.value = rec.content || null
    cellD.alignment = { vertical: 'top', horizontal: 'left', wrapText: true }

    const cellE = row.getCell(5)
    cellE.value = rec.summary || null
    cellE.alignment = { vertical: 'top', horizontal: 'left', wrapText: true }

    const cellF = row.getCell(6)
    const effective = getEffectiveHours(rec, data.breakHours)
    if (effective !== null) {
      totalHours += effective
    }
    if (rec.date === data.reviewTargetDate) {
      nov16RowNumber = rNum
      nov16Hours = effective
    }

    if (rec.manualHours !== null && !Number.isNaN(rec.manualHours)) {
      cellF.value = rec.manualHours
    } else if (startVal && endVal) {
      const autoVal = calcAutoHours(rec.startTime, rec.endTime, data.breakHours)
      cellF.value = {
        formula: `IF(COUNT(B${rNum}:C${rNum})<2,"",ROUND((C${rNum}-B${rNum})*24-${data.breakHours},2))`,
        result: autoVal ?? undefined,
      }
    } else {
      cellF.value = null
    }
    cellF.numFmt = '0.##'
    cellF.alignment = { vertical: 'middle', horizontal: 'center' }

    const cellG = row.getCell(7)
    cellG.value = rec.basis || null
    cellG.alignment = { vertical: 'top', horizontal: 'left', wrapText: true }

    for (let c = 1; c <= 7; c++) {
      const cell = row.getCell(c)
      cell.font = { name: 'PingFang SC', size: 10.5 }
      cell.border = THIN_BORDER
    }
  })

  // Total row
  const lastDataRow = Math.max(4, 3 + data.records.length)
  const totalRowNum = lastDataRow + 1
  const totalRow = ws1.getRow(totalRowNum)
  totalRow.height = 24
  const totalLabelCell = totalRow.getCell(5)
  totalLabelCell.value = '合计工时'
  totalLabelCell.font = { name: 'PingFang SC', size: 11, bold: true }
  totalLabelCell.alignment = { vertical: 'middle', horizontal: 'right' }

  const totalValCell = totalRow.getCell(6)
  totalValCell.value = {
    formula: `SUM(F4:F${lastDataRow})`,
    result: Math.round(totalHours * 100) / 100,
  }
  totalValCell.font = { name: 'PingFang SC', size: 11, bold: true, color: { argb: 'FF0F172A' } }
  totalValCell.alignment = { vertical: 'middle', horizontal: 'center' }
  totalValCell.numFmt = '0.##'
  totalValCell.fill = HEADER_FILL
  totalValCell.border = THIN_BORDER

  // ==================== Sheet 2: 11月16日工时复核 ====================
  const ws2 = wb.addWorksheet('11月16日工时复核')
  ws2.columns = [
    { width: 32 },
    { width: 18 },
    { width: 14 },
    { width: 16 },
    { width: 18 },
    { width: 60 },
  ]

  ws2.mergeCells('A1:F1')
  const s2Title = ws2.getCell('A1')
  s2Title.value = data.reviewTitle || '11 月 16 日工时复核'
  s2Title.font = { name: 'PingFang SC', size: 13, bold: true }
  s2Title.fill = TITLE_FILL
  s2Title.alignment = { vertical: 'middle', horizontal: 'left' }
  ws2.getRow(1).height = 26

  ws2.mergeCells('A2:F2')
  const s2Desc = ws2.getCell('A2')
  s2Desc.value = '按实际发生日期填写。事项跨天时，复制该事项到空白行，逐日填写对应时长。'
  s2Desc.font = { name: 'PingFang SC', size: 10.5, color: { argb: 'FF475569' } }
  s2Desc.alignment = { vertical: 'middle', horizontal: 'left' }
  ws2.getRow(2).height = 24

  ws2.getRow(3).height = 14

  const headers2 = [
    '工作事项',
    '可核对记录',
    '提交日期',
    '实际工作日期',
    '实际工时（小时）',
    '任务单或补充说明',
  ]
  const headerRow2 = ws2.getRow(4)
  headerRow2.height = 26
  headers2.forEach((text, idx) => {
    const cell = headerRow2.getCell(idx + 1)
    cell.value = text
    cell.font = { name: 'PingFang SC', size: 10.5, bold: true }
    cell.fill = HEADER_FILL
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = THIN_BORDER
  })

  const reviewStartRow = 5
  const reviewCount = Math.max(data.reviewItems.length, 1)
  let checkedHoursSum = 0

  data.reviewItems.forEach((item, idx) => {
    const rNum = reviewStartRow + idx
    const row = ws2.getRow(rNum)
    row.height = estimateRowHeight(item.notes, 28)

    row.getCell(1).value = item.task || null
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }

    row.getCell(2).value = item.verifiableRecord || null
    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' }

    const subDate = dateStrToExcelDate(item.submitDate)
    row.getCell(3).value = subDate ?? (item.submitDate || null)
    if (subDate) row.getCell(3).numFmt = 'yyyy-mm-dd'
    row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' }

    const actDate = dateStrToExcelDate(item.actualDate)
    row.getCell(4).value = actDate ?? (item.actualDate || null)
    if (actDate) row.getCell(4).numFmt = 'yyyy-mm-dd'
    row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' }

    row.getCell(5).value =
      item.actualHours !== null && !Number.isNaN(item.actualHours) ? item.actualHours : null
    row.getCell(5).numFmt = '0.##'
    row.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' }

    if (
      item.actualDate === data.reviewTargetDate &&
      item.actualHours !== null &&
      !Number.isNaN(item.actualHours)
    ) {
      checkedHoursSum += item.actualHours
    }

    row.getCell(6).value = item.notes || null
    row.getCell(6).alignment = { vertical: 'top', horizontal: 'left', wrapText: true }

    for (let c = 1; c <= 6; c++) {
      row.getCell(c).font = { name: 'PingFang SC', size: 10.5 }
      row.getCell(c).border = THIN_BORDER
    }
  })

  const reviewEndRow = reviewStartRow + reviewCount - 1
  const origRowNum = reviewEndRow + 1
  const checkedRowNum = reviewEndRow + 2
  const diffRowNum = reviewEndRow + 3

  const [ty, tm, td] = (data.reviewTargetDate || '2026-11-16').split('-').map(Number)

  // Original reported row
  const origRow = ws2.getRow(origRowNum)
  origRow.height = 24
  origRow.getCell(1).value = '11 月 16 日原填报'
  origRow.getCell(1).font = { name: 'PingFang SC', size: 10.5, bold: true }
  origRow.getCell(5).value = nov16RowNumber
    ? { formula: `Sheet1!F${nov16RowNumber}`, result: nov16Hours ?? undefined }
    : nov16Hours
  origRow.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' }
  origRow.getCell(5).font = { name: 'PingFang SC', size: 10.5, bold: true }
  for (let c = 1; c <= 6; c++) origRow.getCell(c).border = THIN_BORDER

  // Checked sum row
  const checkedRow = ws2.getRow(checkedRowNum)
  checkedRow.height = 24
  checkedRow.getCell(1).value = '11 月 16 日已核对'
  checkedRow.getCell(1).font = { name: 'PingFang SC', size: 10.5, bold: true }
  checkedRow.getCell(5).value = {
    formula: `IF(COUNTIFS(D${reviewStartRow}:D${reviewEndRow},DATE(${ty},${tm},${td}),E${reviewStartRow}:E${reviewEndRow},">0")=0,"",SUMIF(D${reviewStartRow}:D${reviewEndRow},DATE(${ty},${tm},${td}),E${reviewStartRow}:E${reviewEndRow}))`,
    result: Math.round(checkedHoursSum * 100) / 100,
  }
  checkedRow.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' }
  checkedRow.getCell(5).font = { name: 'PingFang SC', size: 10.5, bold: true }
  for (let c = 1; c <= 6; c++) checkedRow.getCell(c).border = THIN_BORDER

  // Diff row
  const diffRow = ws2.getRow(diffRowNum)
  diffRow.height = 24
  diffRow.getCell(1).value = '与原填报差额'
  diffRow.getCell(1).font = { name: 'PingFang SC', size: 10.5, bold: true }
  const diffVal =
    nov16Hours !== null ? Math.round((nov16Hours - checkedHoursSum) * 100) / 100 : undefined
  diffRow.getCell(5).value = {
    formula: `IF(ISNUMBER(E${checkedRowNum}),E${origRowNum}-E${checkedRowNum},"")`,
    result: diffVal,
  }
  diffRow.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' }
  diffRow.getCell(5).font = { name: 'PingFang SC', size: 10.5, bold: true }
  for (let c = 1; c <= 6; c++) diffRow.getCell(c).border = THIN_BORDER

  // Spacer + Note
  const noteRowNum = diffRowNum + 2
  ws2.mergeCells(`A${noteRowNum}:F${noteRowNum}`)
  const noteCell = ws2.getCell(`A${noteRowNum}`)
  noteCell.value = '差额仅供复核。实际日期和用时确认后，再更新主表对应日期。'
  noteCell.font = { name: 'PingFang SC', size: 10.5, color: { argb: 'FF475569' } }
  ws2.getRow(noteRowNum).height = 24

  // Extra items
  data.extraReviewItems.forEach((item, idx) => {
    const rNum = noteRowNum + 1 + idx
    const row = ws2.getRow(rNum)
    row.height = estimateRowHeight(item.notes, 28)
    row.getCell(1).value = item.task || null
    row.getCell(2).value = item.verifiableRecord || null
    row.getCell(3).value = dateStrToExcelDate(item.submitDate) ?? (item.submitDate || null)
    if (dateStrToExcelDate(item.submitDate)) row.getCell(3).numFmt = 'yyyy-mm-dd'
    row.getCell(4).value = dateStrToExcelDate(item.actualDate) ?? (item.actualDate || null)
    if (dateStrToExcelDate(item.actualDate)) row.getCell(4).numFmt = 'yyyy-mm-dd'
    row.getCell(5).value =
      item.actualHours !== null && !Number.isNaN(item.actualHours) ? item.actualHours : null
    row.getCell(6).value = item.notes || null
    row.getCell(6).alignment = { vertical: 'top', horizontal: 'left', wrapText: true }

    for (let c = 1; c <= 6; c++) {
      row.getCell(c).font = { name: 'PingFang SC', size: 10.5 }
      row.getCell(c).border = THIN_BORDER
    }
  })

  return wb
}

export async function downloadTimesheetExcel(data: TimesheetWorkbook): Promise<string> {
  const wb = buildExcelWorkbook(data)
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const filename = `兼职工作记录表_${data.month}月.xlsx`

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  return filename
}
