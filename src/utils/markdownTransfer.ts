import { createInitialTimesheet } from '../data/initialTimesheet'
import type { ReviewItemRow, TimesheetWorkbook, WorkRecordRow } from '../types/timesheet'
import { calcAutoHours, getEffectiveHours } from './timeCalc'

function escapeMdCell(text: string): string {
  return text
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br>')
}

function unescapeMdCell(cell: string): string {
  return cell
    .trim()
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\\\|/g, '|')
}

function splitMdRow(line: string): string[] {
  const trimmed = line.trim()
  const inner = trimmed.replace(/^\|/, '').replace(/\|$/, '')
  const cells: string[] = []
  let current = ''
  for (let i = 0; i < inner.length; i++) {
    if (inner[i] === '\\' && inner[i + 1] === '|') {
      current += '\\|'
      i++
    } else if (inner[i] === '|') {
      cells.push(current)
      current = ''
    } else {
      current += inner[i]
    }
  }
  cells.push(current)
  return cells
}

function isSeparatorRow(line: string): boolean {
  const cells = splitMdRow(line)
  return cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c.trim()))
}

export function serializeTimesheetToMarkdown(workbook: TimesheetWorkbook): string {
  const totalHours = workbook.records.reduce((acc, rec) => {
    const h = getEffectiveHours(rec, workbook.breakHours)
    return acc + (h ?? 0)
  }, 0)
  const roundedTotal = Math.round(totalHours * 100) / 100

  const lines: string[] = [
    `# ${workbook.title || '工作记录表'}`,
    '',
    `- 月份: ${workbook.month}`,
    `- 午休扣除(小时): ${workbook.breakHours}`,
    `- 合计工时(小时): ${roundedTotal}`,
    '',
    '## 工作记录',
    '',
    '| 日期 | 开始时间 | 结束时间 | 工时(h) | 工作内容 | 概述 | 核对依据 |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  ]

  for (const rec of workbook.records) {
    const hours = getEffectiveHours(rec, workbook.breakHours)
    const hoursStr = hours === null ? '' : String(hours)
    lines.push(
      `| ${escapeMdCell(rec.date)} | ${escapeMdCell(rec.startTime)} | ${escapeMdCell(rec.endTime)} | ${hoursStr} | ${escapeMdCell(rec.content)} | ${escapeMdCell(rec.summary)} | ${escapeMdCell(rec.basis)} |`,
    )
  }

  lines.push(
    '',
    `## ${workbook.reviewTitle || '11 月 16 日工时复核'}`,
    '',
    `- 复核目标日期: ${workbook.reviewTargetDate}`,
    '',
    '| 工作事项 | 可核对记录 | 提交日期 | 实际工作日期 | 实际工时(h) | 任务单或补充说明 |',
    '| --- | --- | --- | --- | --- | --- |',
  )

  for (const item of workbook.reviewItems) {
    const hStr = item.actualHours === null ? '' : String(item.actualHours)
    lines.push(
      `| ${escapeMdCell(item.task)} | ${escapeMdCell(item.verifiableRecord)} | ${escapeMdCell(item.submitDate)} | ${escapeMdCell(item.actualDate)} | ${hStr} | ${escapeMdCell(item.notes)} |`,
    )
  }

  if (workbook.extraReviewItems.length > 0) {
    lines.push(
      '',
      '### 其他补充复核事项',
      '',
      '| 工作事项 | 可核对记录 | 提交日期 | 实际工作日期 | 实际工时(h) | 任务单或补充说明 |',
      '| --- | --- | --- | --- | --- | --- |',
    )
    for (const item of workbook.extraReviewItems) {
      const hStr = item.actualHours === null ? '' : String(item.actualHours)
      lines.push(
        `| ${escapeMdCell(item.task)} | ${escapeMdCell(item.verifiableRecord)} | ${escapeMdCell(item.submitDate)} | ${escapeMdCell(item.actualDate)} | ${hStr} | ${escapeMdCell(item.notes)} |`,
      )
    }
  }

  lines.push('')
  return lines.join('\n')
}

export function downloadTimesheetMarkdown(workbook: TimesheetWorkbook): string {
  const md = serializeTimesheetToMarkdown(workbook)
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const filename = `兼职工作记录表_${workbook.month}月.md`

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  return filename
}

export function parseMarkdownToTimesheet(mdText: string): TimesheetWorkbook {
  const base = createInitialTimesheet()
  const lines = mdText.split(/\r?\n/)

  let section: 'root' | 'records' | 'review' | 'extra' = 'root'
  const recordRows: string[][] = []
  const reviewRows: string[][] = []
  const extraRows: string[][] = []

  const pushTableRow = (target: string[][], line: string) => {
    if (!line.trim().startsWith('|')) return
    if (isSeparatorRow(line)) return
    target.push(splitMdRow(line))
  }

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed.startsWith('# ') && section === 'root') {
      const t = trimmed.slice(2).trim()
      if (t) base.title = t
      continue
    }

    if (trimmed.startsWith('## ')) {
      const heading = trimmed.slice(3).trim()
      if (heading.includes('工作记录')) {
        section = 'records'
      } else if (heading.includes('复核')) {
        section = 'review'
        base.reviewTitle = heading
      }
      continue
    }

    if (trimmed.startsWith('### ')) {
      const sub = trimmed.slice(4).trim()
      if (sub.includes('补充')) {
        section = 'extra'
      }
      continue
    }

    // Parse metadata bullets
    const monthMatch = trimmed.match(/^-\s*月份[:：]\s*(\d+)/)
    if (monthMatch) {
      const m = Number(monthMatch[1])
      if (m >= 1 && m <= 12) base.month = m
      continue
    }
    const breakMatch = trimmed.match(/^-\s*午休扣除[^:：]*[:：]\s*([\d.]+)/)
    if (breakMatch) {
      const b = Number(breakMatch[1])
      if (!Number.isNaN(b) && b >= 0) base.breakHours = b
      continue
    }
    const targetMatch = trimmed.match(/^-\s*复核目标日期[:：]\s*(\d{4}-\d{2}-\d{2})/)
    if (targetMatch) {
      base.reviewTargetDate = targetMatch[1]
      continue
    }

    if (section === 'records') pushTableRow(recordRows, line)
    else if (section === 'review') pushTableRow(reviewRows, line)
    else if (section === 'extra') pushTableRow(extraRows, line)
  }

  // Skip header rows (first row of each parsed table)
  const dataRecordRows = recordRows.length > 1 ? recordRows.slice(1) : []
  if (dataRecordRows.length === 0) {
    throw new Error('Markdown 中未找到有效的工作记录表格')
  }

  const stamp = Date.now().toString(36)
  base.records = dataRecordRows.map((cells, idx): WorkRecordRow => {
    const date = unescapeMdCell(cells[0] ?? '')
    const startTime = unescapeMdCell(cells[1] ?? '')
    const endTime = unescapeMdCell(cells[2] ?? '')
    const hoursRaw = unescapeMdCell(cells[3] ?? '')
    const content = unescapeMdCell(cells[4] ?? '')
    const summary = unescapeMdCell(cells[5] ?? '')
    const basis = unescapeMdCell(cells[6] ?? '')

    const parsedHours = hoursRaw !== '' && !Number.isNaN(Number(hoursRaw)) ? Number(hoursRaw) : null
    const auto = calcAutoHours(startTime, endTime, base.breakHours)
    const manualHours = parsedHours !== null && parsedHours !== auto ? parsedHours : null

    return {
      id: `rec-md-${idx}-${stamp}`,
      date,
      startTime,
      endTime,
      content,
      summary,
      manualHours,
      basis,
    }
  })

  const parseReviewRows = (rows: string[][], prefix: string): ReviewItemRow[] => {
    const dataRows = rows.length > 1 ? rows.slice(1) : []
    return dataRows.map((cells, idx) => {
      const hRaw = unescapeMdCell(cells[4] ?? '')
      const actualHours = hRaw !== '' && !Number.isNaN(Number(hRaw)) ? Number(hRaw) : null
      return {
        id: `${prefix}-${idx}-${stamp}`,
        task: unescapeMdCell(cells[0] ?? ''),
        verifiableRecord: unescapeMdCell(cells[1] ?? ''),
        submitDate: unescapeMdCell(cells[2] ?? ''),
        actualDate: unescapeMdCell(cells[3] ?? ''),
        actualHours,
        notes: unescapeMdCell(cells[5] ?? ''),
      }
    })
  }

  if (reviewRows.length > 1) {
    base.reviewItems = parseReviewRows(reviewRows, 'rev-md')
  }
  if (extraRows.length > 1) {
    base.extraReviewItems = parseReviewRows(extraRows, 'rev-extra-md')
  }

  return base
}
