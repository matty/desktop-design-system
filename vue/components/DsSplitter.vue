<script setup lang="ts">
import { computed, onBeforeUnmount } from "vue";

const props = withDefaults(
  defineProps<{ size: number; horizontal?: boolean; min?: number; max?: number; step?: number }>(),
  { horizontal: false, min: 0, max: Number.POSITIVE_INFINITY, step: 16 }
);
const emit = defineEmits<{ "update:size": [number] }>();

const basis = computed(() => `${props.size}px`);

function clamp(px: number): number {
  return Math.min(props.max, Math.max(props.min, px));
}
function setSize(px: number) {
  emit("update:size", Math.round(clamp(px)));
}

let startPos = 0;
let startSize = 0;
function onMove(e: MouseEvent) {
  const p = props.horizontal ? e.clientY : e.clientX;
  setSize(startSize + (p - startPos));
}
function onUp() {
  document.removeEventListener("mousemove", onMove);
  document.removeEventListener("mouseup", onUp);
  document.body.style.userSelect = "";
}
function onDown(e: MouseEvent) {
  e.preventDefault();
  startPos = props.horizontal ? e.clientY : e.clientX;
  startSize = props.size;
  document.body.style.userSelect = "none";
  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
}
onBeforeUnmount(onUp);

function onKeydown(e: KeyboardEvent) {
  const dec = props.horizontal ? "ArrowUp" : "ArrowLeft";
  const inc = props.horizontal ? "ArrowDown" : "ArrowRight";
  if (e.key === dec) {
    e.preventDefault();
    setSize(props.size - props.step);
  } else if (e.key === inc) {
    e.preventDefault();
    setSize(props.size + props.step);
  }
}
</script>

<template>
  <div class="ds-resizable" :class="{ 'is-horizontal': horizontal }">
    <div class="ds-pane-first" :style="{ flexBasis: basis }">
      <slot name="first" />
    </div>
    <div
      data-ds-splitter
      role="separator"
      tabindex="0"
      :aria-orientation="horizontal ? 'horizontal' : 'vertical'"
      :aria-valuenow="size"
      :aria-valuemin="min"
      :aria-valuemax="Number.isFinite(max) ? max : undefined"
      @mousedown="onDown"
      @keydown="onKeydown"
    ></div>
    <div class="ds-pane-rest">
      <slot name="second" />
    </div>
  </div>
</template>
