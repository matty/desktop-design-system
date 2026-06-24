<script setup lang="ts">
import { ref, computed, watch } from "vue";

const props = withDefaults(
  defineProps<{ modelValue?: string | null; month?: string }>(),
  { modelValue: null }
);
const emit = defineEmits<{ "update:modelValue": [string]; "update:month": [string] }>();

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function isoOf(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function monthOf(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

const fallbackMonth = props.month ?? (props.modelValue ? props.modelValue.slice(0, 7) : monthOf(new Date()));
const internalMonth = ref(fallbackMonth);
watch(() => props.month, (m) => { if (m) internalMonth.value = m; });

const view = computed(() => {
  const [y, m] = internalMonth.value.split("-").map(Number);
  return { year: y, month: m - 1 }; // month: 0-based
});
const title = computed(() => `${MONTHS[view.value.month]} ${view.value.year}`);

const todayIso = isoOf(new Date());

const cells = computed(() => {
  const { year, month } = view.value;
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // Monday-first: Mon=0 … Sun=6
  const start = new Date(year, month, 1 - offset);
  const out: { iso: string; day: number; outside: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    out.push({ iso: isoOf(d), day: d.getDate(), outside: d.getMonth() !== month });
  }
  return out;
});

const focusedIndex = ref(0);
watch(
  cells,
  (cs) => {
    const selIdx = props.modelValue ? cs.findIndex((c) => c.iso === props.modelValue) : -1;
    const todayIdx = cs.findIndex((c) => c.iso === todayIso && !c.outside);
    const firstInMonth = cs.findIndex((c) => !c.outside);
    focusedIndex.value = selIdx >= 0 ? selIdx : todayIdx >= 0 ? todayIdx : firstInMonth;
  },
  { immediate: true }
);

function setMonth(delta: number) {
  const d = new Date(view.value.year, view.value.month + delta, 1);
  internalMonth.value = monthOf(d);
  emit("update:month", internalMonth.value);
}
function pick(iso: string) {
  emit("update:modelValue", iso);
}

function onKey(e: KeyboardEvent) {
  const map: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7 };
  if (e.key in map) {
    e.preventDefault();
    const next = focusedIndex.value + map[e.key];
    if (next >= 0 && next < 42) focusedIndex.value = next;
  } else if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    pick(cells.value[focusedIndex.value].iso);
  }
}
</script>

<template>
  <div class="ds-calendar">
    <div class="ds-calendar-head">
      <button type="button" class="ds-calendar-nav" aria-label="Previous month" @click="setMonth(-1)">‹</button>
      <span class="ds-calendar-title">{{ title }}</span>
      <button type="button" class="ds-calendar-nav" aria-label="Next month" @click="setMonth(1)">›</button>
    </div>
    <div class="ds-calendar-grid" role="grid" @keydown="onKey">
      <span v-for="wd in WEEKDAYS" :key="wd" class="ds-calendar-weekday">{{ wd }}</span>
      <button
        v-for="(c, i) in cells"
        :key="c.iso"
        type="button"
        class="ds-calendar-day"
        :class="{ 'is-outside': c.outside, 'is-today': c.iso === todayIso, 'is-selected': c.iso === modelValue }"
        :tabindex="i === focusedIndex ? 0 : -1"
        :aria-selected="c.iso === modelValue"
        @click="pick(c.iso)"
      >{{ c.day }}</button>
    </div>
  </div>
</template>
