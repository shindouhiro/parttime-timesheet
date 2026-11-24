<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { Check, Download, FileSpreadsheet, Plus, RotateCcw, Save, Search, Upload } from 'lucide-vue-next'

interface Props {
  title: string
  month: number
  breakHours: number
  totalHours: number
  filledDaysCount: number
  avgDailyHours: number
  searchQuery: string
  isExporting: boolean
  isImporting: boolean
  lastSavedAt: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:month': [val: number]
  'update:breakHours': [val: number]
  'update:searchQuery': [val: string]
  addRecord: []
  requestReset: []
  saveNow: []
  exportExcel: []
  importExcel: [file: File]
}>()

const fileInputRef = useTemplateRef<HTMLInputElement>('excelFileInput')

function triggerImport() {
  fileInputRef.value?.click()
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    emit('importExcel', file)
    input.value = ''
  }
}
</script>

<template>
  <header class="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-20">
    <div class="mx-auto max-w-[1440px] px-4 py-3.5 sm:px-6">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <!-- Brand & Title -->
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <FileSpreadsheet class="h-5 w-5" />
          </div>
          <div>
            <div class="flex items-center gap-2.5 flex-wrap">
              <h1 class="text-lg font-semibold tracking-tight text-slate-900">
                {{ props.title }}
              </h1>
              <span class="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                已预填 兼职.xlsx 数据
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">
              支持在线编辑、自动计算工时（默认扣除午休 {{ props.breakHours }} 小时），并导出标准 Excel (.xlsx)
            </p>
          </div>
        </div>

        <!-- KPI Summary & Controls -->
        <div class="flex flex-wrap items-center gap-2.5">
          <!-- KPI Pills -->
          <div class="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
            <div>
              <span class="text-slate-500">合计工时</span>
              <span class="ml-1.5 font-semibold text-slate-900 tabular-nums">{{ props.totalHours }} h</span>
            </div>
            <span class="h-3.5 w-px bg-slate-300" aria-hidden="true" />
            <div>
              <span class="text-slate-500">记录天数</span>
              <span class="ml-1.5 font-semibold text-slate-900 tabular-nums">{{ props.filledDaysCount }} 天</span>
            </div>
            <span class="h-3.5 w-px bg-slate-300" aria-hidden="true" />
            <div>
              <span class="text-slate-500">日均</span>
              <span class="ml-1.5 font-semibold text-slate-900 tabular-nums">{{ props.avgDailyHours }} h</span>
            </div>
          </div>

          <!-- Month & Break Config -->
          <div class="flex items-center gap-2">
            <label for="month-select" class="text-xs font-medium text-slate-600">月份</label>
            <select
              id="month-select"
              :value="props.month"
              class="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 shadow-xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              @change="emit('update:month', Number(($event.target as HTMLSelectElement).value))"
            >
              <option v-for="m in 12" :key="m" :value="m">{{ m }} 月</option>
            </select>
          </div>

          <!-- Action Buttons -->
          <button
            id="btn-add-record"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            @click="emit('addRecord')"
          >
            <Plus class="h-3.5 w-3.5" />
            新增记录
          </button>

          <button
            id="btn-import-excel"
            type="button"
            :disabled="props.isImporting"
            class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-60"
            @click="triggerImport"
          >
            <Upload class="h-3.5 w-3.5" />
            {{ props.isImporting ? '导入中...' : '导入 Excel' }}
          </button>
          <input
            id="input-import-excel"
            ref="excelFileInput"
            type="file"
            accept=".xlsx"
            class="hidden"
            aria-label="导入 Excel 文件"
            @change="handleFileChange"
          />

          <button
            id="btn-reset-data"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-xs transition hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            @click="emit('requestReset')"
          >
            <RotateCcw class="h-3.5 w-3.5" />
            重置初始
          </button>

          <button
            id="btn-manual-save"
            type="button"
            title="立即保存到浏览器本地 (Ctrl/Cmd + S)"
            class="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 shadow-xs transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            @click="emit('saveNow')"
          >
            <Save class="h-3.5 w-3.5" />
            保存
          </button>

          <button
            id="btn-export-excel"
            type="button"
            :disabled="props.isExporting"
            class="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 disabled:opacity-60"
            @click="emit('exportExcel')"
          >
            <Download class="h-3.5 w-3.5" />
            {{ props.isExporting ? '正在生成...' : '下载 Excel' }}
          </button>
        </div>
      </div>

      <!-- Search Bar Row -->
      <div class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div class="relative max-w-sm flex-1">
          <Search class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            id="search-records-input"
            type="search"
            :value="props.searchQuery"
            placeholder="搜索日期、工作内容或概述..."
            aria-label="搜索工作记录"
            class="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
          />
        </div>
        <div class="flex items-center gap-2 text-xs text-slate-500">
          <label for="break-hours-input" class="whitespace-nowrap">午休扣除(小时):</label>
          <input
            id="break-hours-input"
            type="number"
            step="0.5"
            min="0"
            max="6"
            :value="props.breakHours"
            class="w-16 rounded-md border border-slate-200 bg-white px-2 py-1 text-center text-xs font-medium text-slate-800 tabular-nums focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            @input="emit('update:breakHours', Number(($event.target as HTMLInputElement).value) || 0)"
          />
          <span class="inline-flex items-center gap-1 text-emerald-700">
            <Check class="h-3.5 w-3.5" />
            {{ props.lastSavedAt ? `已自动保存 (${props.lastSavedAt})` : '已启用本地自动保存' }}
          </span>
        </div>
      </div>
    </div>
  </header>
</template>
