<script setup lang="ts">
import type { SheetTabId } from '../types/timesheet'

interface Props {
  activeTab: SheetTabId
  recordsCount: number
  reviewItemsCount: number
  nov16Diff: number | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:activeTab': [tab: SheetTabId]
}>()
</script>

<template>
  <nav aria-label="工作表切换" class="border-b border-slate-200 bg-white">
    <div class="mx-auto max-w-[1440px] px-4 sm:px-6 flex items-center gap-1 overflow-x-auto">
      <button
        id="tab-sheet1"
        type="button"
        role="tab"
        :aria-selected="props.activeTab === 'sheet1'"
        :class="[
          'relative inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition whitespace-nowrap focus:outline-none',
          props.activeTab === 'sheet1'
            ? 'text-emerald-700'
            : 'text-slate-600 hover:text-slate-900',
        ]"
        @click="emit('update:activeTab', 'sheet1')"
      >
        <span>工作记录表 (Sheet1)</span>
        <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 tabular-nums">
          {{ props.recordsCount }}
        </span>
        <span
          v-if="props.activeTab === 'sheet1'"
          class="absolute inset-x-0 bottom-0 h-0.5 bg-emerald-600"
        />
      </button>

      <button
        id="tab-sheet2"
        type="button"
        role="tab"
        :aria-selected="props.activeTab === 'sheet2'"
        :class="[
          'relative inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition whitespace-nowrap focus:outline-none',
          props.activeTab === 'sheet2'
            ? 'text-emerald-700'
            : 'text-slate-600 hover:text-slate-900',
        ]"
        @click="emit('update:activeTab', 'sheet2')"
      >
        <span>11月16日工时复核</span>
        <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 tabular-nums">
          {{ props.reviewItemsCount }}
        </span>
        <span
          v-if="props.nov16Diff !== null"
          :class="[
            'rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums',
            props.nov16Diff === 0
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-amber-50 text-amber-700',
          ]"
        >
          {{ props.nov16Diff === 0 ? '已核平' : `差额 ${props.nov16Diff}h` }}
        </span>
        <span
          v-if="props.activeTab === 'sheet2'"
          class="absolute inset-x-0 bottom-0 h-0.5 bg-emerald-600"
        />
      </button>
    </div>
  </nav>
</template>
