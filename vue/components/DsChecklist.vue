<script setup lang="ts">
import type { ChecklistItem, ChecklistState } from "../types";
import DsIcon from "./DsIcon.vue";
import DsSpinner from "./DsSpinner.vue";

defineProps<{ items: ChecklistItem[] }>();

const ICON: Partial<Record<ChecklistState, string>> = {
  ok: "check",
  warn: "warning",
  error: "close",
};
</script>

<template>
  <ul class="ds-checklist" aria-live="polite">
    <li
      v-for="item in items"
      :key="item.id"
      class="ds-checklist-item"
      :data-state="item.state"
    >
      <span class="ds-checklist-ico">
        <DsSpinner v-if="item.state === 'running'" />
        <DsIcon v-else-if="ICON[item.state]" :name="ICON[item.state]!" :size="22" />
      </span>
      <span class="ds-checklist-text">
        <span class="ds-checklist-title">{{ item.title }}</span>
        <span v-if="item.note" class="ds-checklist-note">{{ item.note }}</span>
      </span>
    </li>
  </ul>
</template>
