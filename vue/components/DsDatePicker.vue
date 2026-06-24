<script setup lang="ts">
import { ref, computed } from "vue";
import DsCalendar from "./DsCalendar.vue";
import { useDismiss } from "../composables/useDismiss";

const props = withDefaults(
  defineProps<{ modelValue?: string | null; placeholder?: string; format?: (iso: string) => string }>(),
  { modelValue: null, placeholder: "YYYY-MM-DD" }
);
const emit = defineEmits<{ "update:modelValue": [string | null] }>();

const root = ref<HTMLElement | null>(null);
const open = ref(false);
useDismiss({ active: open, root, onDismiss: () => (open.value = false) });

const display = computed(() =>
  props.modelValue ? (props.format ? props.format(props.modelValue) : props.modelValue) : ""
);
const calendarMonth = computed(() => (props.modelValue ? props.modelValue.slice(0, 7) : undefined));

function onPick(iso: string) {
  emit("update:modelValue", iso);
  open.value = false;
}
</script>

<template>
  <div ref="root" class="ds-popover-anchor">
    <input
      class="ds-input"
      type="text"
      readonly
      :value="display"
      :placeholder="placeholder"
      :aria-expanded="open ? 'true' : 'false'"
      aria-haspopup="dialog"
      @click="open = !open"
    />
    <div v-if="open" class="ds-popover" role="dialog" aria-label="Choose date">
      <DsCalendar :model-value="modelValue" :month="calendarMonth" @update:model-value="onPick" />
    </div>
  </div>
</template>
