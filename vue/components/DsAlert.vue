<script setup lang="ts">
import { computed } from "vue";
import type { Tone } from "../types";
const props = withDefaults(defineProps<{ tone?: Tone; dismissible?: boolean }>(), { dismissible: false });
const emit = defineEmits<{ close: [] }>();
const classes = computed(() => ({
  "is-info": props.tone === "info",
  "is-success": props.tone === "success",
  "is-warning": props.tone === "warning",
  "is-danger": props.tone === "danger"
}));
</script>
<template>
  <div class="ds-alert" :class="classes" role="alert">
    <span class="ds-alert-ico"><slot name="icon" /></span>
    <div><slot /></div>
    <button v-if="dismissible" type="button" aria-label="Dismiss" @click="emit('close')">×</button>
  </div>
</template>
