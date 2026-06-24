<script setup lang="ts">
import type { WindowControl } from "../types";

const props = withDefaults(
  defineProps<{
    title?: string;
    controls?: WindowControl[];
    maximized?: boolean;
  }>(),
  {
    controls: () => ["minimize", "maximize", "close"],
    maximized: false,
  }
);

const emit = defineEmits<{
  minimize: [];
  maximize: [];
  restore: [];
  close: [];
}>();

function labelFor(c: WindowControl): string {
  if (c === "minimize") return "Minimize";
  if (c === "close") return "Close";
  return props.maximized ? "Restore" : "Maximize";
}

function onControl(c: WindowControl): void {
  if (c === "minimize") emit("minimize");
  else if (c === "close") emit("close");
  else if (props.maximized) emit("restore");
  else emit("maximize");
}
</script>

<template>
  <div class="ds-titlebar">
    <div v-if="$slots.leading" class="ds-titlebar-leading"><slot name="leading" /></div>
    <div class="ds-titlebar-title"><slot>{{ title }}</slot></div>
    <div v-if="$slots.actions" class="ds-titlebar-actions"><slot name="actions" /></div>
    <slot name="controls">
      <div class="ds-winbtns">
        <button
          v-for="c in controls"
          :key="c"
          :class="{ 'is-close': c === 'close' }"
          :title="labelFor(c)"
          :aria-label="labelFor(c)"
          @click="onControl(c)"
        >
          <svg v-if="c === 'minimize'" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14"/></svg>
          <svg v-else-if="c === 'maximize' && !maximized" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" rx="2"/></svg>
          <svg v-else-if="c === 'maximize' && maximized" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2"/><rect width="12" height="12" x="4" y="8" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" rx="2"/></svg>
          <svg v-else viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
    </slot>
  </div>
</template>
