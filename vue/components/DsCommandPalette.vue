<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import type { CommandItem } from "../types";
import { useFocusTrap } from "../composables/useFocusTrap";
import { useDismiss } from "../composables/useDismiss";

const props = withDefaults(
  defineProps<{ open: boolean; commands: CommandItem[]; placeholder?: string }>(),
  { placeholder: "Type a command…" }
);
const emit = defineEmits<{ "update:open": [boolean]; select: [string] }>();

const panel = ref<HTMLElement | null>(null);
const input = ref<HTMLInputElement | null>(null);
const openRef = ref(props.open);
const query = ref("");
const activeIndex = ref(0);

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  return q ? props.commands.filter((c) => c.label.toLowerCase().includes(q)) : props.commands;
});

watch(
  () => props.open,
  (v) => {
    openRef.value = v;
    if (v) {
      query.value = "";
      activeIndex.value = 0;
      nextTick(() => input.value?.focus());
    }
  }
);
watch(filtered, () => (activeIndex.value = 0));

function close() {
  emit("update:open", false);
}
function choose(c: CommandItem) {
  emit("select", c.id);
  close();
}

useFocusTrap(panel, openRef);
useDismiss({ active: openRef, root: panel, onDismiss: close });

function onKey(e: KeyboardEvent) {
  if (e.key === "ArrowDown") {
    e.preventDefault();
    activeIndex.value = Math.min(activeIndex.value + 1, filtered.value.length - 1);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    activeIndex.value = Math.max(activeIndex.value - 1, 0);
  } else if (e.key === "Enter") {
    e.preventDefault();
    const c = filtered.value[activeIndex.value];
    if (c) choose(c);
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="ds-overlay">
      <div ref="panel" class="ds-command" role="dialog" aria-modal="true" @keydown="onKey">
        <input
          ref="input"
          v-model="query"
          class="ds-command-input"
          :placeholder="placeholder"
          role="combobox"
          aria-expanded="true"
          aria-controls="ds-command-list"
          aria-label="Command"
        />
        <div id="ds-command-list" class="ds-command-list" role="listbox">
          <div
            v-for="(c, i) in filtered"
            :key="c.id"
            class="ds-command-item"
            :class="{ 'is-active': i === activeIndex }"
            role="option"
            :aria-selected="i === activeIndex"
            @click="choose(c)"
            @mousemove="activeIndex = i"
          >
            {{ c.label }}<span v-if="c.hint" class="ds-command-hint">{{ c.hint }}</span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
