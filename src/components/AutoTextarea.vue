<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, useTemplateRef, watch } from 'vue'

interface Props {
  id: string
  placeholder?: string
  ariaLabel?: string
  minRows?: number
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  ariaLabel: '',
  minRows: 2,
  className: '',
})

const model = defineModel<string>({ default: '' })
const textareaRef = useTemplateRef<HTMLTextAreaElement>('textareaEl')

function adjustHeight() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

onMounted(() => {
  adjustHeight()
  window.addEventListener('resize', adjustHeight)
})

onUnmounted(() => {
  window.removeEventListener('resize', adjustHeight)
})

watch(model, () => {
  nextTick(adjustHeight)
})
</script>

<template>
  <textarea
    :id="props.id"
    ref="textareaEl"
    v-model="model"
    :rows="props.minRows"
    :placeholder="props.placeholder"
    :aria-label="props.ariaLabel"
    :class="[
      'w-full overflow-hidden resize-none rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs leading-relaxed text-slate-800 placeholder:text-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20',
      props.className,
    ]"
    @input="adjustHeight"
  />
</template>
