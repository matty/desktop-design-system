<script setup lang="ts">
import { ref, watch, onBeforeUnmount, useId } from "vue";
import { useFocusTrap } from "../composables/useFocusTrap";
import { useDismiss } from "../composables/useDismiss";

const props = withDefaults(
  defineProps<{ open: boolean; side?: "right" | "left"; title?: string }>(),
  { side: "right" }
);
const emit = defineEmits<{ "update:open": [boolean] }>();

const titleId = useId();
const drawer = ref<HTMLElement | null>(null);
const openRef = ref(props.open);
watch(() => props.open, (v) => (openRef.value = v));

function close() {
  emit("update:open", false);
}

useFocusTrap(drawer, openRef);
useDismiss({ active: openRef, root: drawer, onDismiss: close });

watch(
  () => props.open,
  (v) => {
    document.body.style.overflow = v ? "hidden" : "";
  },
  { immediate: true }
);
onBeforeUnmount(() => {
  document.body.style.overflow = "";
});
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="ds-overlay">
      <div
        ref="drawer"
        class="ds-drawer"
        :class="`is-${side}`"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="title ? titleId : undefined"
      >
        <div v-if="title" :id="titleId" class="ds-drawer-head">{{ title }}</div>
        <div class="ds-drawer-body"><slot /></div>
        <div v-if="$slots.footer" class="ds-drawer-foot"><slot name="footer" /></div>
      </div>
    </div>
  </Teleport>
</template>
