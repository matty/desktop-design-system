<script setup lang="ts">
import { computed, provide, useId } from "vue";
import { dsFieldKey } from "./field-context";

const props = defineProps<{ label?: string; hint?: string; error?: string }>();

const id = useId();
const errorId = `${id}-error`;
const hintId = `${id}-hint`;
const invalid = computed(() => !!props.error);
const describedby = computed(() =>
  props.error ? errorId : props.hint ? hintId : undefined
);

provide(dsFieldKey, { id: computed(() => id) as never, describedby, invalid });
</script>

<template>
  <div class="ds-field">
    <label v-if="label" class="ds-field-label" :for="id">{{ label }}</label>
    <slot />
    <div v-if="error" class="ds-field-error" :id="errorId" role="alert">
      <svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
      {{ error }}
    </div>
    <span v-else-if="hint" class="ds-field-hint" :id="hintId">{{ hint }}</span>
  </div>
</template>
