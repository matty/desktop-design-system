<script setup lang="ts">
import { computed } from "vue";
const props = defineProps<{ size?: "sm" | "lg"; src?: string; alt?: string }>();
const classes = computed(() => ({ "is-sm": props.size === "sm", "is-lg": props.size === "lg" }));
</script>
<template>
  <span class="ds-avatar" :class="classes">
    <img v-if="src" :src="src" :alt="alt" />
    <slot v-else />
  </span>
</template>
