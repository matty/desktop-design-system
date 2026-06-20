<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from "vue";
import { useFocusTrap } from "../composables/useFocusTrap";
import { useDismiss } from "../composables/useDismiss";

const props = defineProps<{ open: boolean; title: string }>();
const emit = defineEmits<{ "update:open": [boolean] }>();

const dialog = ref<HTMLElement | null>(null);
const openRef = ref(props.open);
watch(
  () => props.open,
  (v) => (openRef.value = v)
);

function close() {
  emit("update:open", false);
}

useFocusTrap(dialog, openRef);
useDismiss({ active: openRef, root: dialog, onDismiss: close });

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
      <div ref="dialog" class="ds-dialog" role="dialog" aria-modal="true" aria-labelledby="ds-dialog-title">
        <div class="ds-dialog-head">
          <h3 id="ds-dialog-title">{{ title }}</h3>
        </div>
        <div class="ds-dialog-body">
          <slot />
        </div>
        <div v-if="$slots.foot" class="ds-dialog-foot">
          <slot name="foot" :close="close" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
