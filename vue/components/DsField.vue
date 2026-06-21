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
    <div v-if="error" class="ds-field-error" :id="errorId" role="alert">{{ error }}</div>
    <span v-else-if="hint" class="ds-field-hint" :id="hintId">{{ hint }}</span>
  </div>
</template>
