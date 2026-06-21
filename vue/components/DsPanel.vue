<script setup lang="ts">
import { useSlots } from "vue";
defineProps<{ title?: string }>();
const slots = useSlots();
</script>
<template>
  <div class="ds-panel">
    <div v-if="title || slots.header || slots.actions" class="ds-panel-head">
      <slot name="header"><h3 v-if="title">{{ title }}</h3></slot>
      <slot name="actions" />
    </div>
    <div class="ds-panel-body"><slot /></div>
  </div>
</template>
