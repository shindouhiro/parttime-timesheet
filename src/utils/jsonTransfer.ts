import { createInitialTimesheet } from '../data/initialTimesheet'
import type { ReviewItemRow, TimesheetWorkbook, WorkRecordRow } from '../types/timesheet'

function ensureId(id: unknown, prefix: string, idx: number): string {
  return typeof id === 'string' && id.trim() !== ''
    ? id
    : `${prefix}-${idx}-${Date.now().toString(36)}`
}

export function serializeTimesheetToJson(workbook: TimesheetWorkbook): string {
  return JSON.stringify(workbook, null, 2)
}

export function downloadTimesheetJson(workbook: TimesheetWorkbook): string {
  const json = serializeTimesheetToJson(workbook)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const filename = `兼职工作记录表_${workbook.month}月.json`

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  return filename
}

export function parseJsonToTimesheet(text: string): TimesheetWorkbook {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('JSON 格式无效，无法解析')
  }

  if (!raw || typeof raw !== 'object') {
    throw new Error('JSON 根节点必须为对象')
  }

  const obj = raw as Record<string, unknown>
  if (!Array.isArray(obj.records)) {
    throw new Error('JSON 缺少 records 工作记录数组')
  }

  const base = createInitialTimesheet()

  const records: WorkRecordRow[] = obj.records.map((item, idx) => {
    const r = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
    return {
      id: ensureId(r.id, 'rec-json', idx),
      date: typeof r.date === 'string' ? r.date : '',
      startTime: typeof r.startTime === 'string' ? r.startTime : '',
      endTime: typeof r.endTime === 'string' ? r.endTime : '',
      content: typeof r.content === 'string' ? r.content : '',
      summary: typeof r.summary === 'string' ? r.summary : '',
      manualHours: typeof r.manualHours === 'number' && !Number.isNaN(r.manualHours) ? r.manualHours : null,
      basis: typeof r.basis === 'string' ? r.basis : '',
    }
  })

  const normalizeReviewList = (list: unknown, prefix: string): ReviewItemRow[] => {
    if (!Array.isArray(list)) return []
    return list.map((item, idx) => {
      const r = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
      return {
        id: ensureId(r.id, prefix, idx),
        task: typeof r.task === 'string' ? r.task : '',
        verifiableRecord: typeof r.verifiableRecord === 'string' ? r.verifiableRecord : '',
        submitDate: typeof r.submitDate === 'string' ? r.submitDate : '',
        actualDate: typeof r.actualDate === 'string' ? r.actualDate : '',
        actualHours: typeof r.actualHours === 'number' && !Number.isNaN(r.actualHours) ? r.actualHours : null,
        notes: typeof r.notes === 'string' ? r.notes : '',
      }
    })
  }

  return {
    title: typeof obj.title === 'string' && obj.title.trim() ? obj.title : base.title,
    month: typeof obj.month === 'number' && obj.month >= 1 && obj.month <= 12 ? obj.month : base.month,
    breakHours: typeof obj.breakHours === 'number' && obj.breakHours >= 0 ? obj.breakHours : base.breakHours,
    records,
    reviewTitle: typeof obj.reviewTitle === 'string' && obj.reviewTitle.trim() ? obj.reviewTitle : base.reviewTitle,
    reviewTargetDate:
      typeof obj.reviewTargetDate === 'string' && obj.reviewTargetDate.trim()
        ? obj.reviewTargetDate
        : base.reviewTargetDate,
    reviewItems: Array.isArray(obj.reviewItems) ? normalizeReviewList(obj.reviewItems, 'rev-json') : base.reviewItems,
    extraReviewItems: Array.isArray(obj.extraReviewItems)
      ? normalizeReviewList(obj.extraReviewItems, 'rev-extra-json')
      : base.extraReviewItems,
  }
}
