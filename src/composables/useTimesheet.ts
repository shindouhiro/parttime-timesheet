import { computed, ref, shallowRef, watch } from 'vue'
import { createInitialTimesheet } from '../data/initialTimesheet'
import type { ReviewItemRow, SheetTabId, TimesheetWorkbook, WorkRecordRow } from '../types/timesheet'
import { getEffectiveHours } from '../utils/timeCalc'

const STORAGE_KEY = 'parttime-timesheet-v1'

function loadStoredWorkbook(): TimesheetWorkbook {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createInitialTimesheet()
    const parsed = JSON.parse(raw) as TimesheetWorkbook
    if (!parsed || !Array.isArray(parsed.records)) {
      return createInitialTimesheet()
    }
    return parsed
  } catch {
    return createInitialTimesheet()
  }
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export function useTimesheet() {
  const workbook = ref<TimesheetWorkbook>(loadStoredWorkbook())
  const activeTab = shallowRef<SheetTabId>('sheet1')
  const searchQuery = shallowRef('')
  const isExporting = shallowRef(false)
  const isImporting = shallowRef(false)
  const lastSavedAt = shallowRef('')
  const toastMessage = shallowRef('')
  const toastType = shallowRef<'success' | 'error'>('success')
  let toastTimer: ReturnType<typeof setTimeout> | null = null

  function formatNowTime(): string {
    const now = new Date()
    return now.toTimeString().slice(0, 8)
  }

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    toastMessage.value = message
    toastType.value = type
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      toastMessage.value = ''
    }, 3200)
  }

  watch(
    workbook,
    (val) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
        lastSavedAt.value = formatNowTime()
      } catch {
        // Ignore storage quota errors
      }
    },
    { deep: true },
  )

  const totalHours = computed(() => {
    const sum = workbook.value.records.reduce((acc, rec) => {
      const h = getEffectiveHours(rec, workbook.value.breakHours)
      return acc + (h ?? 0)
    }, 0)
    return Math.round(sum * 100) / 100
  })

  const filledDaysCount = computed(() => {
    return workbook.value.records.filter(
      (r) => r.date.trim() !== '' || r.content.trim() !== '',
    ).length
  })

  const completedDaysCount = computed(() => {
    return workbook.value.records.filter(
      (r) => getEffectiveHours(r, workbook.value.breakHours) !== null,
    ).length
  })

  const avgDailyHours = computed(() => {
    if (completedDaysCount.value === 0) return 0
    return Math.round((totalHours.value / completedDaysCount.value) * 100) / 100
  })

  const filteredRecords = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return workbook.value.records
    return workbook.value.records.filter(
      (r) =>
        r.date.toLowerCase().includes(q) ||
        r.content.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q) ||
        r.basis.toLowerCase().includes(q),
    )
  })

  // Sheet 2 reconciliation metrics
  const nov16OriginalHours = computed(() => {
    const target = workbook.value.records.find(
      (r) => r.date === workbook.value.reviewTargetDate,
    )
    if (!target) return null
    return getEffectiveHours(target, workbook.value.breakHours)
  })

  const nov16CheckedHours = computed(() => {
    const matching = workbook.value.reviewItems.filter(
      (item) =>
        item.actualDate === workbook.value.reviewTargetDate &&
        item.actualHours !== null &&
        !Number.isNaN(item.actualHours) &&
        item.actualHours > 0,
    )
    if (matching.length === 0) return null
    const sum = matching.reduce((acc, item) => acc + (item.actualHours ?? 0), 0)
    return Math.round(sum * 100) / 100
  })

  const nov16Diff = computed(() => {
    if (nov16OriginalHours.value === null || nov16CheckedHours.value === null) return null
    return Math.round((nov16OriginalHours.value - nov16CheckedHours.value) * 100) / 100
  })

  function addWorkRecord() {
    const last = workbook.value.records[workbook.value.records.length - 1]
    let nextDate = ''
    if (last?.date && /^\d{4}-\d{2}-\d{2}$/.test(last.date)) {
      const d = new Date(`${last.date}T00:00:00Z`)
      d.setUTCDate(d.getUTCDate() + 1)
      nextDate = d.toISOString().slice(0, 10)
    }
    const newRow: WorkRecordRow = {
      id: generateId('rec'),
      date: nextDate,
      startTime: '09:30',
      endTime: '',
      content: '',
      summary: '',
      manualHours: null,
      basis: '',
    }
    workbook.value.records.push(newRow)
    showToast('已新增一行工作记录')
  }

  function duplicateWorkRecord(id: string) {
    const idx = workbook.value.records.findIndex((r) => r.id === id)
    if (idx === -1) return
    const src = workbook.value.records[idx]
    const copy: WorkRecordRow = {
      ...src,
      id: generateId('rec'),
    }
    workbook.value.records.splice(idx + 1, 0, copy)
    showToast('已复制该行记录')
  }

  function removeWorkRecord(id: string) {
    const idx = workbook.value.records.findIndex((r) => r.id === id)
    if (idx === -1) return
    workbook.value.records.splice(idx, 1)
    showToast('已删除该行记录')
  }

  function addReviewItem(isExtra = false) {
    const targetList = isExtra
      ? workbook.value.extraReviewItems
      : workbook.value.reviewItems
    const newItem: ReviewItemRow = {
      id: generateId(isExtra ? 'rev-extra' : 'rev'),
      task: '',
      verifiableRecord: '',
      submitDate: workbook.value.reviewTargetDate,
      actualDate: workbook.value.reviewTargetDate,
      actualHours: null,
      notes: '',
    }
    targetList.push(newItem)
    showToast('已新增复核事项')
  }

  function duplicateReviewItem(id: string, isExtra = false) {
    const targetList = isExtra
      ? workbook.value.extraReviewItems
      : workbook.value.reviewItems
    const idx = targetList.findIndex((item) => item.id === id)
    if (idx === -1) return
    const src = targetList[idx]
    targetList.splice(idx + 1, 0, {
      ...src,
      id: generateId(isExtra ? 'rev-extra' : 'rev'),
    })
    showToast('已复制复核事项')
  }

  function removeReviewItem(id: string, isExtra = false) {
    const targetList = isExtra
      ? workbook.value.extraReviewItems
      : workbook.value.reviewItems
    const idx = targetList.findIndex((item) => item.id === id)
    if (idx === -1) return
    targetList.splice(idx, 1)
    showToast('已删除复核事项')
  }

  function resetToInitial() {
    workbook.value = createInitialTimesheet()
    searchQuery.value = ''
    showToast('已恢复为 兼职.xlsx 初始内容')
  }

  async function exportExcel() {
    if (isExporting.value) return
    isExporting.value = true
    try {
      const { downloadTimesheetExcel } = await import('../utils/excelExport')
      const filename = await downloadTimesheetExcel(workbook.value)
      showToast(`已导出 ${filename}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '导出失败'
      showToast(`导出失败：${msg}`, 'error')
    } finally {
      isExporting.value = false
    }
  }

  async function importExcelFile(file: File) {
    if (isImporting.value) return
    isImporting.value = true
    try {
      const buffer = await file.arrayBuffer()
      const { parseExcelBufferToTimesheet } = await import('../utils/excelImport')
      workbook.value = await parseExcelBufferToTimesheet(buffer)
      searchQuery.value = ''
      showToast(`已导入 ${file.name}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '导入失败'
      showToast(`导入失败：${msg}`, 'error')
    } finally {
      isImporting.value = false
    }
  }

  return {
    workbook,
    activeTab,
    searchQuery,
    isExporting,
    isImporting,
    lastSavedAt,
    toastMessage,
    toastType,
    totalHours,
    filledDaysCount,
    completedDaysCount,
    avgDailyHours,
    filteredRecords,
    nov16OriginalHours,
    nov16CheckedHours,
    nov16Diff,
    addWorkRecord,
    duplicateWorkRecord,
    removeWorkRecord,
    addReviewItem,
    duplicateReviewItem,
    removeReviewItem,
    resetToInitial,
    exportExcel,
    importExcelFile,
  }
}
