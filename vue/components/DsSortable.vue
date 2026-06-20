<script setup lang="ts" generic="T">
import { onMounted, onBeforeUnmount, ref } from "vue";
import Sortable from "sortablejs";

const props = withDefaults(
  defineProps<{ modelValue: T[]; handle?: string; animation?: number }>(),
  { animation: 150 }
);
const emit = defineEmits<{ "update:modelValue": [T[]] }>();

const list = ref<HTMLElement | null>(null);
let instance: { destroy: () => void } | null = null;

function reorder(oldIndex: number, newIndex: number) {
  const next = props.modelValue.slice();
  const [moved] = next.splice(oldIndex, 1);
  next.splice(newIndex, 0, moved);
  emit("update:modelValue", next);
}

onMounted(() => {
  if (!list.value) return;
  instance = Sortable.create(list.value, {
    animation: props.animation,
    handle: props.handle,
    ghostClass: "ds-drop-placeholder",
    chosenClass: "is-dragging",
    dragClass: "is-dragging",
    onEnd: (e: Sortable.SortableEvent) => {
      if (e.oldIndex != null && e.newIndex != null && e.oldIndex !== e.newIndex) {
        reorder(e.oldIndex, e.newIndex);
      }
    }
  });
});
onBeforeUnmount(() => instance?.destroy());
</script>

<template>
  <div ref="list" data-ds-sortable>
    <div v-for="(item, i) in modelValue" :key="i">
      <slot name="item" :item="item" :index="i" />
    </div>
  </div>
</template>
