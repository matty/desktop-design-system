<script setup lang="ts">
import { computed, provide, type ComputedRef } from "vue";
import type { TabItem } from "../types";

const props = defineProps<{ modelValue: string; tabs: TabItem[] }>();
const emit = defineEmits<{ "update:modelValue": [string] }>();

const active = computed(() => props.modelValue);
provide<ComputedRef<string>>("dsActiveTab", active);

function select(tab: TabItem) {
  if (tab.disabled) return;
  emit("update:modelValue", tab.id);
}
function onKeydown(e: KeyboardEvent) {
  const idx = props.tabs.findIndex((t) => t.id === props.modelValue);
  if (idx < 0) return;
  let next = idx;
  if (e.key === "ArrowRight") next = (idx + 1) % props.tabs.length;
  else if (e.key === "ArrowLeft") next = (idx - 1 + props.tabs.length) % props.tabs.length;
  else return;
  e.preventDefault();
  emit("update:modelValue", props.tabs[next].id);
}
</script>

<template>
  <div>
    <div class="ds-tabs" role="tablist" @keydown="onKeydown">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="ds-tab"
        :class="{ 'is-active': tab.id === active }"
        role="tab"
        :aria-selected="tab.id === active"
        :tabindex="tab.id === active ? 0 : -1"
        :disabled="tab.disabled || undefined"
        @click="select(tab)"
      >
        {{ tab.label }}
      </button>
    </div>
    <slot />
  </div>
</template>
