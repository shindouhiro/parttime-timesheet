<script setup lang="ts">
import { onMounted, onUnmounted, shallowRef } from 'vue'
import { CheckCircle2, AlertTriangle } from 'lucide-vue-next'
import AppHeader from './components/AppHeader.vue'
import ReviewSheetTable from './components/ReviewSheetTable.vue'
import SheetTabs from './components/SheetTabs.vue'
import WorkRecordTable from './components/WorkRecordTable.vue'
import { useTimesheet } from './composables/useTimesheet'

const {
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
  saveNow,
  exportExcel,
  exportJson,
  exportMarkdown,
  importFile,
} = useTimesheet()

const isResetDialogOpen = shallowRef(false)

function handleKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
    e.preventDefault()
    saveNow()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

function handleConfirmReset() {
  resetToInitial()
  isResetDialogOpen.value = false
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
    <AppHeader
      :title="workbook.title"
      :month="workbook.month"
      :break-hours="workbook.breakHours"
      :total-hours="totalHours"
      :filled-days-count="filledDaysCount"
      :avg-daily-hours="avgDailyHours"
      :search-query="searchQuery"
      :is-exporting="isExporting"
      :is-importing="isImporting"
      :last-saved-at="lastSavedAt"
      @update:month="workbook.month = $event"
      @update:break-hours="workbook.breakHours = $event"
      @update:search-query="searchQuery = $event"
      @add-record="addWorkRecord"
      @request-reset="isResetDialogOpen = true"
      @save-now="saveNow"
      @export-excel="exportExcel"
      @export-json="exportJson"
      @export-markdown="exportMarkdown"
      @import-file="importFile"
    />

    <SheetTabs
      :active-tab="activeTab"
      :records-count="workbook.records.length"
      :review-items-count="workbook.reviewItems.length + workbook.extraReviewItems.length"
      :nov16-diff="nov16Diff"
      @update:active-tab="activeTab = $event"
    />

    <main class="mx-auto w-full max-w-[1440px] flex-1 px-4 py-5 sm:px-6">
      <WorkRecordTable
        v-if="activeTab === 'sheet1'"
        :records="filteredRecords"
        :break-hours="workbook.breakHours"
        :total-hours="totalHours"
        :is-filtered="searchQuery.trim().length > 0"
        @add-record="addWorkRecord"
        @duplicate-record="duplicateWorkRecord"
        @remove-record="removeWorkRecord"
      />

      <ReviewSheetTable
        v-else
        :review-title="workbook.reviewTitle"
        :review-target-date="workbook.reviewTargetDate"
        :review-items="workbook.reviewItems"
        :extra-review-items="workbook.extraReviewItems"
        :original-hours="nov16OriginalHours"
        :checked-hours="nov16CheckedHours"
        :diff-hours="nov16Diff"
        @add-item="addReviewItem"
        @duplicate-item="duplicateReviewItem"
        @remove-item="removeReviewItem"
      />
    </main>

    <!-- Reset Confirmation Dialog -->
    <div
      v-if="isResetDialogOpen"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-dialog-title"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
    >
      <div class="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
        <div class="flex items-start gap-3">
          <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <AlertTriangle class="h-5 w-5" />
          </div>
          <div>
            <h2 id="reset-dialog-title" class="text-sm font-semibold text-slate-900">
              确认重置为初始数据？
            </h2>
            <p class="mt-1 text-xs leading-relaxed text-slate-600">
              当前页面上的所有修改将被清除，并恢复为最初导入的 兼职.xlsx 内容。此操作不可撤销。
            </p>
          </div>
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <button
            id="btn-reset-cancel"
            type="button"
            class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            @click="isResetDialogOpen = false"
          >
            取消
          </button>
          <button
            id="btn-reset-confirm"
            type="button"
            class="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
            @click="handleConfirmReset"
          >
            确认重置
          </button>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div
      v-if="toastMessage"
      role="status"
      aria-live="polite"
      :class="[
        'fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-medium shadow-lg transition-all',
        toastType === 'error'
          ? 'bg-rose-600 text-white'
          : 'bg-slate-900 text-white',
      ]"
    >
      <CheckCircle2 v-if="toastType === 'success'" class="h-4 w-4 text-emerald-400" />
      <AlertTriangle v-else class="h-4 w-4 text-rose-200" />
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>
