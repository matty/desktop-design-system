<script setup lang="ts">
import { ref, computed } from "vue";
import type { TreeNode } from "../types";
import DsTreeNode from "./DsTreeNode.vue";

const props = withDefaults(
  defineProps<{ nodes: TreeNode[]; selected?: string | null; expanded?: string[] }>(),
  { selected: null, expanded: () => [] }
);
const emit = defineEmits<{ "update:selected": [string]; "update:expanded": [string[]] }>();

const root = ref<HTMLElement | null>(null);
const expandedSet = computed(() => new Set(props.expanded ?? []));

function select(node: TreeNode) {
  emit("update:selected", node.id);
}
function toggle(node: TreeNode) {
  const set = new Set(expandedSet.value);
  set.has(node.id) ? set.delete(node.id) : set.add(node.id);
  emit("update:expanded", [...set]);
}

function rows(): HTMLElement[] {
  const el = root.value;
  if (!el) return [];
  return Array.from(el.querySelectorAll<HTMLElement>(".ds-tree-row")).filter(
    (r) => r.offsetParent !== null
  );
}
function focusRow(r: HTMLElement) {
  rows().forEach((x) => (x.tabIndex = x === r ? 0 : -1));
  r.focus();
}
function onKeydown(e: KeyboardEvent) {
  const list = rows();
  const row = (e.target as HTMLElement).closest<HTMLElement>(".ds-tree-row");
  if (!row) return;
  const idx = list.indexOf(row);
  if (e.key === "ArrowDown") {
    e.preventDefault();
    if (list[idx + 1]) focusRow(list[idx + 1]);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    if (list[idx - 1]) focusRow(list[idx - 1]);
  } else if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    row.click();
  }
}
</script>

<template>
  <ul ref="root" class="ds-tree" role="tree" @keydown="onKeydown">
    <DsTreeNode
      v-for="node in nodes"
      :key="node.id"
      :node="node"
      :selected="selected"
      :expanded-set="expandedSet"
      @select="select"
      @toggle="toggle"
    />
  </ul>
</template>
