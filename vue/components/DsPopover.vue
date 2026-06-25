<script setup lang="ts">
import { ref } from "vue";
import { useDismiss } from "../composables/useDismiss";
import { useFlip } from "../composables/useFlip";

const open = defineModel<boolean>("open", { default: false });
const props = withDefaults(
  defineProps<{ ariaLabel?: string; placement?: "bottom" | "top" }>(),
  { placement: "bottom" }
);

const root = ref<HTMLElement | null>(null);
const trigger = ref<HTMLElement | null>(null);
const floating = ref<HTMLElement | null>(null);

useDismiss({ active: open, root, onDismiss: () => (open.value = false) });
const { placement: resolved, floatStyle } = useFlip({
  trigger,
  floating,
  open,
  placement: props.placement,
});

function toggle() {
  open.value = !open.value;
}
</script>

<template>
  <div ref="root" class="ds-popover-anchor" :class="{ 'is-open': open }">
    <button ref="trigger" type="button" class="ds-btn" :aria-expanded="open" @click="toggle">
      <slot name="trigger" />
    </button>
    <div
      v-if="open"
      ref="floating"
      class="ds-popover"
      role="dialog"
      :aria-label="ariaLabel"
      :data-placement="resolved"
      :style="floatStyle"
    >
      <slot />
    </div>
  </div>
</template>
