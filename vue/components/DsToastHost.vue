<script setup lang="ts">
import { useToast } from "../composables/useToast";
import DsIcon from "./DsIcon.vue";
import type { ToastPlacement, ToastTone, ToastAction } from "../types";

withDefaults(defineProps<{ placement?: ToastPlacement }>(), { placement: "bottom-right" });

const { toasts, dismiss, pause, resume } = useToast();

const icons: Record<ToastTone, string> = {
  info: "info",
  success: "check",
  warn: "warning",
  danger: "error",
};

function runAction(id: string, action: ToastAction) {
  action.onClick();
  dismiss(id);
}
</script>

<template>
  <TransitionGroup tag="div" name="ds-toast" :class="['ds-toast-stack', `is-${placement}`]">
    <div
      v-for="t in toasts"
      :key="t.id"
      class="ds-toast"
      :class="`is-${t.tone ?? 'info'}`"
      role="status"
      @mouseenter="pause(t.id)"
      @mouseleave="resume(t.id)"
      @focusin="pause(t.id)"
      @focusout="resume(t.id)"
    >
      <span class="ds-toast-ico"><DsIcon :name="icons[t.tone ?? 'info']" :size="17" /></span>
      <div class="ds-toast-body"><b v-if="t.title">{{ t.title }}</b>{{ t.message }}</div>
      <div class="ds-toast-actions">
        <button
          v-if="t.action"
          type="button"
          class="ds-btn is-ghost is-sm"
          @click="runAction(t.id, t.action)"
        >{{ t.action.label }}</button>
        <button type="button" class="ds-toast-close" aria-label="Dismiss" @click="dismiss(t.id)">×</button>
      </div>
    </div>
  </TransitionGroup>
</template>
