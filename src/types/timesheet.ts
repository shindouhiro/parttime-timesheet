export interface WorkRecordRow {
  id: string
  date: string
  startTime: string
  endTime: string
  content: string
  summary: string
  /** When null, hours are auto-calculated from startTime/endTime minus breakHours */
  manualHours: number | null
  basis: string
}

export interface ReviewItemRow {
  id: string
  task: string
  verifiableRecord: string
  submitDate: string
  actualDate: string
  actualHours: number | null
  notes: string
}

export interface TimesheetWorkbook {
  title: string
  month: number
  breakHours: number
  records: WorkRecordRow[]
  reviewTitle: string
  reviewTargetDate: string
  reviewItems: ReviewItemRow[]
  extraReviewItems: ReviewItemRow[]
}

export type SheetTabId = 'sheet1' | 'sheet2'
