<script setup lang="ts">
import { Copy, Plus, RotateCcw, Trash2 } from 'lucide-vue-next'
import type { WorkRecordRow } from '../types/timesheet'
import { calcAutoHours, getEffectiveHours } from '../utils/timeCalc'
import AutoTextarea from './AutoTextarea.vue'

interface Props {
  records: WorkRecordRow[]
  breakHours: number
  totalHours: number
  isFiltered: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  addRecord: []
  duplicateRecord: [id: string]
  removeRecord: [id: string]
}>()

function displayHours(row: WorkRecordRow): string {
  const h = getEffectiveHours(row, props.breakHours)
  return h === null ? '' : String(h)
}

function isManualOverride(row: WorkRecordRow): boolean {
  return row.manualHours !== null && !Number.isNaN(row.manualHours)
}

function onHoursInput(row: WorkRecordRow, rawVal: string) {
  const trimmed = rawVal.trim()
  if (trimmed === '') {
    row.manualHours = null
    return
  }
  const num = Number(trimmed)
  if (!Number.isNaN(num)) {
    row.manualHours = num
  }
}

function clearManualOverride(row: WorkRecordRow) {
  row.manualHours = null
}

function getAutoHint(row: WorkRecordRow): string {
  const auto = calcAutoHours(row.startTime, row.endTime, props.breakHours)
  return auto === null ? '待填结束时间' : `自动: ${auto}h`
}
</script>

<template>
  <div class="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full border-collapse text-left text-xs">
        <thead>
          <tr class="border-b border-slate-200 bg-slate-50/90 text-slate-700">
            <th class="w-10 px-2.5 py-3 text-center font-semibold">#</th>
            <th class="w-48 px-3 py-3 font-semibold">日期与工作时段</th>
            <th class="w-24 px-2.5 py-3 text-center font-semibold">工时(h)</th>
            <th class="min-w-[380px] px-3 py-3 font-semibold">工作内容</th>
            <th class="w-60 px-3 py-3 font-semibold">概述与核对依据</th>
            <th class="w-18 px-2 py-3 text-center font-semibold">操作</th>
          </tr>
        </thead>

        <tbody class="divide-y divide-slate-200">
          <tr v-if="props.records.length === 0">
            <td colspan="6" class="px-6 py-12 text-center text-sm text-slate-500">
              {{ props.isFiltered ? '没有匹配的工作记录，请尝试调整搜索关键词。' : '暂无工作记录，点击右上角「新增记录」开始填写。' }}
            </td>
          </tr>

          <tr
            v-for="(row, index) in props.records"
            :key="row.id"
            class="group align-top transition-colors hover:bg-slate-50/60"
          >
            <!-- Row Index -->
            <td class="px-2.5 py-3 text-center text-slate-400 tabular-nums select-none">
              {{ index + 1 }}
            </td>

            <!-- Date & Time Range (stacked for compact width) -->
            <td class="px-2.5 py-2.5">
              <div class="space-y-1.5">
                <input
                  :id="`rec-date-${row.id}`"
                  v-model="row.date"
                  type="date"
                  aria-label="日期"
                  class="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800 tabular-nums focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <div class="flex items-center gap-1">
                  <input
                    :id="`rec-start-${row.id}`"
                    v-model="row.startTime"
                    type="time"
                    aria-label="工作开始时间"
                    class="w-full rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[11px] text-slate-700 tabular-nums focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <span class="text-slate-400 shrink-0">-</span>
                  <input
                    :id="`rec-end-${row.id}`"
                    v-model="row.endTime"
                    type="time"
                    aria-label="工作结束时间"
                    class="w-full rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[11px] text-slate-700 tabular-nums focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
            </td>

            <!-- Hours -->
            <td class="px-2 py-2.5">
              <div class="flex flex-col items-center gap-1">
                <input
                  :id="`rec-hours-${row.id}`"
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  :value="displayHours(row)"
                  placeholder="自动"
                  aria-label="工时"
                  :class="[
                    'w-full rounded-md border px-2 py-1.5 text-center text-xs font-semibold tabular-nums focus:outline-none focus:ring-2',
                    isManualOverride(row)
                      ? 'border-amber-300 bg-amber-50/60 text-amber-900 focus:border-amber-500 focus:ring-amber-500/20'
                      : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-emerald-500 focus:ring-emerald-500/20',
                  ]"
                  @input="onHoursInput(row, ($event.target as HTMLInputElement).value)"
                />
                <div class="flex items-center gap-0.5 text-[11px]">
                  <span v-if="isManualOverride(row)" class="text-amber-700">手动</span>
                  <span v-else class="text-slate-400">{{ getAutoHint(row) }}</span>
                  <button
                    v-if="isManualOverride(row)"
                    :id="`rec-hours-reset-${row.id}`"
                    type="button"
                    title="恢复公式自动计算"
                    aria-label="恢复自动计算工时"
                    class="rounded p-0.5 text-amber-700 hover:bg-amber-100"
                    @click="clearManualOverride(row)"
                  >
                    <RotateCcw class="h-3 w-3" />
                  </button>
                </div>
              </div>
            </td>

            <!-- Work Content (Auto-expanding, full text always visible) -->
            <td class="px-2.5 py-2.5">
              <AutoTextarea
                :id="`rec-content-${row.id}`"
                v-model="row.content"
                :min-rows="2"
                placeholder="填写当日具体工作内容..."
                aria-label="工作内容"
              />
            </td>

            <!-- Summary & Basis (stacked cleanly, auto-expanding) -->
            <td class="px-2.5 py-2.5">
              <div class="space-y-1.5">
                <AutoTextarea
                  :id="`rec-summary-${row.id}`"
                  v-model="row.summary"
                  :min-rows="1"
                  placeholder="概述（可选）"
                  aria-label="概述"
                />
                <AutoTextarea
                  :id="`rec-basis-${row.id}`"
                  v-model="row.basis"
                  :min-rows="1"
                  placeholder="工时口径与核对依据（可选）"
                  aria-label="工时口径与核对依据"
                  class-name="bg-slate-50/60 text-slate-600"
                />
              </div>
            </td>

            <!-- Row Actions -->
            <td class="px-2 py-2.5">
              <div class="flex items-center justify-center gap-1">
                <button
                  :id="`rec-dup-${row.id}`"
                  type="button"
                  title="复制此行"
                  aria-label="复制此行"
                  class="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  @click="emit('duplicateRecord', row.id)"
                >
                  <Copy class="h-3.5 w-3.5" />
                </button>
                <button
                  :id="`rec-del-${row.id}`"
                  type="button"
                  title="删除此行"
                  aria-label="删除此行"
                  class="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  @click="emit('removeRecord', row.id)"
                >
                  <Trash2 class="h-3.5 w-3.5" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>

        <!-- Footer Total -->
        <tfoot>
          <tr class="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-800">
            <td colspan="2" class="px-3 py-3">
              <button
                id="btn-add-record-footer"
                type="button"
                class="inline-flex items-center gap-1.5 rounded-md border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-emerald-400 hover:text-emerald-700"
                @click="emit('addRecord')"
              >
                <Plus class="h-3.5 w-3.5" />
                添加一行记录
              </button>
            </td>
            <td class="px-2.5 py-3 text-center text-sm font-bold text-emerald-700 tabular-nums">
              {{ props.totalHours }} h
            </td>
            <td colspan="3" class="px-3 py-3 text-xs font-normal text-slate-500">
              合计工时（导出 Excel 时保留全部原始列并自动写入 SUM 公式）
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>
