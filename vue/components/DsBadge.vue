<script setup lang="ts">
import { computed } from "vue";
import type { Tone } from "../types";
const props = withDefaults(defineProps<{ tone?: Tone; solid?: boolean }>(), { solid: false });
const classes = computed(() => ({
  "is-info": props.tone === "info",
  "is-success": props.tone === "success",
  "is-warning": props.tone === "warning",
  "is-danger": props.tone === "danger",
  "is-solid": props.solid
}));
</script>
<template>
  <span class="ds-badge" :class="classes"><slot name="icon" /><slot /></span>
</template>
