<script setup lang="ts">
import { AlertCircle, CheckCircle2, Copy, Plus, Trash2 } from 'lucide-vue-next'
import type { ReviewItemRow } from '../types/timesheet'
import AutoTextarea from './AutoTextarea.vue'

interface Props {
  reviewTitle: string
  reviewTargetDate: string
  reviewItems: ReviewItemRow[]
  extraReviewItems: ReviewItemRow[]
  originalHours: number | null
  checkedHours: number | null
  diffHours: number | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  addItem: [isExtra: boolean]
  duplicateItem: [id: string, isExtra: boolean]
  removeItem: [id: string, isExtra: boolean]
}>()
</script>

<template>
  <div class="space-y-5">
    <!-- Instructions & Reconciliation Summary -->
    <div class="grid gap-4 lg:grid-cols-3">
      <div class="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <h2 class="text-sm font-semibold text-slate-900">{{ props.reviewTitle }}</h2>
        <p class="mt-1 text-xs leading-relaxed text-slate-600">
          按实际发生日期填写。事项跨天时，复制该事项到空白行，逐日填写对应时长。差额仅供复核，实际日期和用时确认后，再更新主表对应日期。
        </p>
      </div>

      <!-- Reconciliation Card -->
      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between">
        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="rounded-lg bg-slate-50 p-2">
            <div class="text-[11px] text-slate-500">11月16日原填报</div>
            <div class="mt-0.5 text-sm font-bold text-slate-900 tabular-nums">
              {{ props.originalHours ?? '—' }} h
            </div>
          </div>
          <div class="rounded-lg bg-slate-50 p-2">
            <div class="text-[11px] text-slate-500">已核对合计</div>
            <div class="mt-0.5 text-sm font-bold text-slate-900 tabular-nums">
              {{ props.checkedHours ?? '—' }} h
            </div>
          </div>
          <div
            :class="[
              'rounded-lg p-2',
              props.diffHours === 0
                ? 'bg-emerald-50 text-emerald-800'
                : 'bg-amber-50 text-amber-800',
            ]"
          >
            <div class="text-[11px] opacity-80">与原填报差额</div>
            <div class="mt-0.5 flex items-center justify-center gap-1 text-sm font-bold tabular-nums">
              <CheckCircle2 v-if="props.diffHours === 0" class="h-3.5 w-3.5" />
              <AlertCircle v-else class="h-3.5 w-3.5" />
              {{ props.diffHours ?? '—' }} h
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Review Table -->
    <div class="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      <div class="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-4 py-2.5">
        <span class="text-xs font-semibold text-slate-700">复核明细（目标日期：{{ props.reviewTargetDate }}）</span>
        <button
          id="btn-add-review-item"
          type="button"
          class="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          @click="emit('addItem', false)"
        >
          <Plus class="h-3.5 w-3.5" />
          新增事项
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-left text-xs">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50 text-slate-700">
              <th class="w-56 px-3 py-2.5 font-semibold">工作事项与可核对记录</th>
              <th class="w-40 px-3 py-2.5 font-semibold">提交 / 实际日期</th>
              <th class="w-24 px-2.5 py-2.5 text-center font-semibold">实际工时(h)</th>
              <th class="min-w-[340px] px-3 py-2.5 font-semibold">任务单或补充说明</th>
              <th class="w-18 px-2 py-2.5 text-center font-semibold">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr
              v-for="item in props.reviewItems"
              :key="item.id"
              class="align-top hover:bg-slate-50/60"
            >
              <td class="px-2.5 py-2.5">
                <div class="space-y-1.5">
                  <AutoTextarea
                    :id="`rev-task-${item.id}`"
                    v-model="item.task"
                    :min-rows="1"
                    placeholder="工作事项"
                    aria-label="工作事项"
                  />
                  <input
                    :id="`rev-commit-${item.id}`"
                    v-model="item.verifiableRecord"
                    type="text"
                    placeholder="Commit / 可核对记录"
                    aria-label="可核对记录"
                    class="w-full rounded-md border border-slate-200 bg-slate-50/70 px-2 py-1 text-[11px] font-mono text-slate-700 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </td>
              <td class="px-2.5 py-2.5">
                <div class="space-y-1.5">
                  <div>
                    <span class="block text-[10px] text-slate-400 mb-0.5">提交日期</span>
                    <input
                      :id="`rev-submit-${item.id}`"
                      v-model="item.submitDate"
                      type="date"
                      aria-label="提交日期"
                      class="w-full rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-700 tabular-nums focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <span class="block text-[10px] text-slate-400 mb-0.5">实际工作日期</span>
                    <input
                      :id="`rev-actual-${item.id}`"
                      v-model="item.actualDate"
                      type="date"
                      aria-label="实际工作日期"
                      class="w-full rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-800 tabular-nums focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              </td>
              <td class="px-2 py-2.5">
                <input
                  :id="`rev-hours-${item.id}`"
                  v-model.number="item.actualHours"
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  placeholder="0"
                  aria-label="实际工时"
                  class="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-center text-xs font-semibold text-slate-900 tabular-nums focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </td>
              <td class="px-2.5 py-2.5">
                <AutoTextarea
                  :id="`rev-notes-${item.id}`"
                  v-model="item.notes"
                  :min-rows="2"
                  placeholder="补充说明..."
                  aria-label="任务单或补充说明"
                />
              </td>
              <td class="px-2 py-2.5">
                <div class="flex items-center justify-center gap-1">
                  <button
                    :id="`rev-dup-${item.id}`"
                    type="button"
                    title="复制事项"
                    aria-label="复制事项"
                    class="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    @click="emit('duplicateItem', item.id, false)"
                  >
                    <Copy class="h-3.5 w-3.5" />
                  </button>
                  <button
                    :id="`rev-del-${item.id}`"
                    type="button"
                    title="删除事项"
                    aria-label="删除事项"
                    class="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    @click="emit('removeItem', item.id, false)"
                  >
                    <Trash2 class="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Extra Review Items (Row 17+) -->
    <div class="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      <div class="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-4 py-2.5">
        <span class="text-xs font-semibold text-slate-700">其他补充复核事项</span>
        <button
          id="btn-add-extra-review"
          type="button"
          class="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          @click="emit('addItem', true)"
        >
          <Plus class="h-3.5 w-3.5" />
          新增补充事项
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-left text-xs">
          <tbody class="divide-y divide-slate-200">
            <tr
              v-for="item in props.extraReviewItems"
              :key="item.id"
              class="align-top hover:bg-slate-50/60"
            >
              <td class="w-56 px-2.5 py-2.5">
                <div class="space-y-1.5">
                  <AutoTextarea
                    :id="`rev-extra-task-${item.id}`"
                    v-model="item.task"
                    :min-rows="1"
                    aria-label="工作事项"
                  />
                  <input
                    :id="`rev-extra-commit-${item.id}`"
                    v-model="item.verifiableRecord"
                    type="text"
                    aria-label="可核对记录"
                    class="w-full rounded-md border border-slate-200 bg-slate-50/70 px-2 py-1 text-[11px] font-mono text-slate-700 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </td>
              <td class="w-40 px-2.5 py-2.5">
                <div class="space-y-1.5">
                  <div>
                    <span class="block text-[10px] text-slate-400 mb-0.5">提交日期</span>
                    <input
                      :id="`rev-extra-submit-${item.id}`"
                      v-model="item.submitDate"
                      type="date"
                      aria-label="提交日期"
                      class="w-full rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-700 tabular-nums focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <span class="block text-[10px] text-slate-400 mb-0.5">实际工作日期</span>
                    <input
                      :id="`rev-extra-actual-${item.id}`"
                      v-model="item.actualDate"
                      type="date"
                      aria-label="实际工作日期"
                      class="w-full rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-800 tabular-nums focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              </td>
              <td class="w-24 px-2 py-2.5">
                <input
                  :id="`rev-extra-hours-${item.id}`"
                  v-model.number="item.actualHours"
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  aria-label="实际工时"
                  class="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-center text-xs font-semibold text-slate-900 tabular-nums focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </td>
              <td class="min-w-[340px] px-2.5 py-2.5">
                <AutoTextarea
                  :id="`rev-extra-notes-${item.id}`"
                  v-model="item.notes"
                  :min-rows="2"
                  aria-label="任务单或补充说明"
                />
              </td>
              <td class="w-18 px-2 py-2.5">
                <div class="flex items-center justify-center gap-1">
                  <button
                    :id="`rev-extra-dup-${item.id}`"
                    type="button"
                    title="复制事项"
                    aria-label="复制事项"
                    class="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    @click="emit('duplicateItem', item.id, true)"
                  >
                    <Copy class="h-3.5 w-3.5" />
                  </button>
                  <button
                    :id="`rev-extra-del-${item.id}`"
                    type="button"
                    title="删除事项"
                    aria-label="删除事项"
                    class="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    @click="emit('removeItem', item.id, true)"
                  >
                    <Trash2 class="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
