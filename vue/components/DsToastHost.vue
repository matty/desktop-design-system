<script setup lang="ts">
import { useToast } from "../composables/useToast";

const { toasts, dismiss } = useToast();
</script>

<template>
  <div class="ds-toast-stack">
    <div
      v-for="t in toasts"
      :key="t.id"
      class="ds-toast"
      :class="`is-${t.tone ?? 'info'}`"
      role="status"
    >
      <div class="ds-toast-body">{{ t.message }}</div>
      <button type="button" class="ds-toast-close" aria-label="Dismiss" @click="dismiss(t.id)">×</button>
    </div>
  </div>
</template>
