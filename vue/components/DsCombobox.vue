<script setup lang="ts">
import { ref, computed } from "vue";
import type { ComboOption } from "../types";
import { useDismiss } from "../composables/useDismiss";

const props = withDefaults(
  defineProps<{
    modelValue: string | string[] | null;
    options: ComboOption[];
    multiple?: boolean;
    checklist?: boolean;
    filterable?: boolean;
    placeholder?: string;
  }>(),
  { multiple: false, checklist: false, filterable: false, placeholder: "Select…" }
);
const emit = defineEmits<{ "update:modelValue": [string | string[] | null] }>();

const root = ref<HTMLElement | null>(null);
const open = ref(false);
const query = ref("");

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
    <button type="button" class="ds-combo-btn" :aria-expanded="open" @click.stop="toggleOpen">
      <template v-if="multiple && !checklist">
        <span v-for="opt in selectedOptions" :key="opt.value" class="ds-chip">
          {{ opt.label }}
          <span class="ds-chip-x" @click.stop="removeChip(opt.value)">×</span>
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
        @input="query = ($event.target as HTMLInputElement).value"
      />
      <div role="listbox">
        <div
          v-for="opt in visibleOptions"
          :key="opt.value"
          class="ds-combo-option"
          :class="{ 'is-selected': isSelected(opt) }"
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
