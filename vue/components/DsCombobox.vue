<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { ComboOption } from "../types";
import { useDismiss } from "../composables/useDismiss";

const props = withDefaults(
  defineProps<{
    modelValue: string | string[] | null;
    options: ComboOption[];
    multiple?: boolean;
    checklist?: boolean;
    filterable?: boolean;
    disabled?: boolean;
    placeholder?: string;
  }>(),
  { multiple: false, checklist: false, filterable: false, disabled: false, placeholder: "Select…" }
);
const emit = defineEmits<{ "update:modelValue": [string | string[] | null] }>();

const root = ref<HTMLElement | null>(null);
const open = ref(false);
const query = ref("");
const activeIndex = ref(-1);

const isMulti = computed(() => props.multiple || props.checklist);
const selected = computed<string[]>(() =>
  Array.isArray(props.modelValue) ? props.modelValue : props.modelValue ? [props.modelValue] : []
);
const visibleOptions = computed(() =>
  props.filterable && query.value
    ? props.options.filter((o) => o.label.toLowerCase().includes(query.value.toLowerCase()))
    : props.options
);
const selectedOptions = computed(() => props.options.filter((o) => selected.value.includes(o.value)));
const buttonLabel = computed(() => {
  if (props.checklist) return selected.value.length ? `${selected.value.length} selected` : props.placeholder;
  if (!isMulti.value) return selectedOptions.value[0]?.label ?? props.placeholder;
  return props.placeholder;
});
const isPlaceholder = computed(() => selected.value.length === 0 && !isMulti.value);

useDismiss({ active: open, root, onDismiss: () => (open.value = false) });

// Reset the active option whenever the menu opens.
watch(open, (v) => {
  if (v) activeIndex.value = -1;
});

function toggleOpen() {
  open.value = !open.value;
  if (open.value && props.filterable) query.value = "";
}
function pick(opt: ComboOption) {
  if (opt.disabled) return;
  if (isMulti.value) {
    const set = new Set(selected.value);
    set.has(opt.value) ? set.delete(opt.value) : set.add(opt.value);
    emit("update:modelValue", [...set]);
  } else {
    emit("update:modelValue", opt.value);
    open.value = false;
  }
}
function removeChip(value: string) {
  emit("update:modelValue", selected.value.filter((v) => v !== value));
}
function isSelected(opt: ComboOption) {
  return selected.value.includes(opt.value);
}

function nextEnabled(from: number, dir: 1 | -1): number {
  const opts = visibleOptions.value;
  for (let i = from; i >= 0 && i < opts.length; i += dir) {
    if (!opts[i].disabled) return i;
  }
  return -1;
}
function firstEnabled(): number {
  return nextEnabled(0, 1);
}
function lastEnabled(): number {
  return nextEnabled(visibleOptions.value.length - 1, -1);
}
function move(dir: 1 | -1) {
  if (!open.value) {
    open.value = true;
    return;
  }
  const start = activeIndex.value < 0 ? (dir === 1 ? 0 : visibleOptions.value.length - 1) : activeIndex.value + dir;
  const found = nextEnabled(start, dir);
  if (found >= 0) activeIndex.value = found;
}
function onKeydown(e: KeyboardEvent) {
  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      move(1);
      break;
    case "ArrowUp":
      e.preventDefault();
      move(-1);
      break;
    case "Home":
      if (open.value) {
        e.preventDefault();
        activeIndex.value = firstEnabled();
      }
      break;
    case "End":
      if (open.value) {
        e.preventDefault();
        activeIndex.value = lastEnabled();
      }
      break;
    case "Enter":
      if (open.value && activeIndex.value >= 0) {
        e.preventDefault();
        pick(visibleOptions.value[activeIndex.value]);
      }
      break;
    case "Escape":
      if (open.value) {
        e.preventDefault();
        open.value = false;
      }
      break;
  }
}
</script>

<template>
  <div
    ref="root"
    class="ds-combo"
    :class="{
      'is-open': open,
      'is-multi': multiple && !checklist,
      'is-checklist': checklist,
      'is-filterable': filterable
    }"
  >
    <button
      type="button"
      class="ds-combo-btn"
      :aria-expanded="open"
      :disabled="disabled || undefined"
      @click.stop="toggleOpen"
      @keydown="onKeydown"
    >
      <template v-if="multiple && !checklist">
        <span v-for="opt in selectedOptions" :key="opt.value" class="ds-chip">
          {{ opt.label }}
          <button type="button" class="ds-chip-x" aria-label="Remove" @click.stop="removeChip(opt.value)">×</button>
        </span>
      </template>
      <span v-else class="ds-combo-value" :class="{ 'is-placeholder': isPlaceholder }">{{ buttonLabel }}</span>
      <span class="ds-combo-chev" aria-hidden="true">▾</span>
    </button>
    <div class="ds-combo-menu" :hidden="!open">
      <input
        v-if="filterable"
        class="ds-combo-filter"
        :value="query"
        placeholder="Filter…"
        aria-label="Filter options"
        @click.stop
        @keydown="onKeydown"
        @input="query = ($event.target as HTMLInputElement).value"
      />
      <div role="listbox">
        <div
          v-for="(opt, i) in visibleOptions"
          :key="opt.value"
          class="ds-combo-option"
          :class="{ 'is-selected': isSelected(opt), 'is-active': i === activeIndex }"
          role="option"
          :aria-selected="isSelected(opt)"
          :aria-disabled="opt.disabled || undefined"
          @click.stop="pick(opt)"
        >
          {{ opt.label }}
          <span class="ds-combo-check"><svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 6L9 17l-5-5"/></svg></span>
        </div>
      </div>
    </div>
  </div>
</template>
