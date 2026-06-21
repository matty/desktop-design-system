<script setup lang="ts">
defineProps<{ title?: string }>();
const emit = defineEmits<{ minimize: []; maximize: []; close: [] }>();
</script>
<template>
  <div class="ds-titlebar">
    <div class="ds-titlebar-title"><slot>{{ title }}</slot></div>
    <div class="ds-winbtns">
      <button title="Minimize" aria-label="Minimize" @click="emit('minimize')"><svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14"/></svg></button>
      <button title="Maximize" aria-label="Maximize" @click="emit('maximize')"><svg viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" rx="2"/></svg></button>
      <button class="is-close" title="Close" aria-label="Close" @click="emit('close')"><svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 6L6 18M6 6l12 12"/></svg></button>
    </div>
  </div>
</template>
