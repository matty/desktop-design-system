<script setup lang="ts">
import { computed } from "vue";
const props = defineProps<{ state?: "on" | "off" | "busy" | "error" | "info" | "success" | "warning" }>();
const classes = computed(() => (props.state ? { [`is-${props.state}`]: true } : {}));
</script>
<template>
  <span class="ds-status" :class="classes"><span class="ds-dot"></span><slot /></span>
</template>
