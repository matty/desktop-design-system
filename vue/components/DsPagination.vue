<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{ total: number; pageSize: number; siblingCount?: number }>(),
  { siblingCount: 1 }
);
const page = defineModel<number>("page", { default: 1 });

const pageCount = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)));

const items = computed<(number | "…")[]>(() => {
  const last = pageCount.value;
  const cur = page.value;
  const sib = props.siblingCount;
  // show at least sib+1 pages on each side of current, clamped to [2, last-1]
  const start = Math.max(2, Math.min(cur - sib, last - 1 - sib * 2));
  const end = Math.min(last - 1, Math.max(cur + sib, 2 + sib * 2));
  const out: (number | "…")[] = [1];
  if (start > 2) out.push("…");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < last - 1) out.push("…");
  if (last > 1) out.push(last);
  return out;
});

function go(p: number) {
  if (p >= 1 && p <= pageCount.value && p !== page.value) page.value = p;
}
</script>

<template>
  <nav class="ds-pagination" aria-label="Pagination">
    <button type="button" class="ds-page" :disabled="page <= 1" aria-label="Previous page" @click="go(page - 1)">‹</button>
    <template v-for="(it, i) in items" :key="i">
      <span v-if="it === '…'" class="ds-pagination-ellipsis">…</span>
      <button
        v-else
        type="button"
        class="ds-page"
        :class="{ 'is-active': it === page }"
        :aria-current="it === page ? 'page' : undefined"
        @click="go(it as number)"
      >{{ it }}</button>
    </template>
    <button type="button" class="ds-page" :disabled="page >= pageCount" aria-label="Next page" @click="go(page + 1)">›</button>
  </nav>
</template>
