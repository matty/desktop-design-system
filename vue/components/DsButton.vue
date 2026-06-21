<script setup lang="ts">
import { computed } from "vue";
import type { Size } from "../types";

const props = withDefaults(
  defineProps<{
    variant?: "primary" | "ghost" | "danger";
    size?: Exclude<Size, "md">;
    icon?: boolean;
    loading?: boolean;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
  }>(),
  { icon: false, loading: false, disabled: false, type: "button" }
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
  <button class="ds-btn" :class="classes" :type="type" :disabled="disabled || loading || undefined">
    <span v-if="loading" class="ds-spinner" aria-hidden="true"></span>
    <slot />
  </button>
</template>
