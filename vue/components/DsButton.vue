<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    variant?: "primary" | "ghost" | "danger";
    size?: "sm" | "lg";
    icon?: boolean;
    loading?: boolean;
    disabled?: boolean;
  }>(),
  { icon: false, loading: false, disabled: false }
);

const classes = computed(() => ({
  "is-primary": props.variant === "primary",
  "is-ghost": props.variant === "ghost",
  "is-danger": props.variant === "danger",
  "is-sm": props.size === "sm",
  "is-lg": props.size === "lg",
  "is-icon": props.icon
}));
</script>

<template>
  <button class="ds-btn" :class="classes" :disabled="disabled || loading || undefined">
    <span v-if="loading" class="ds-spinner" aria-hidden="true"></span>
    <slot />
  </button>
</template>
