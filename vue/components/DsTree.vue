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
function toggleById(id: string) {
  const set = new Set(expandedSet.value);
  set.has(id) ? set.delete(id) : set.add(id);
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
  const item = row.parentElement as HTMLElement | null;
  if (e.key === "ArrowDown") {
    e.preventDefault();
    if (list[idx + 1]) focusRow(list[idx + 1]);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    if (list[idx - 1]) focusRow(list[idx - 1]);
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    if (item && !item.classList.contains("is-leaf") && !item.classList.contains("is-expanded")) {
      // Collapsed expandable node — expand it
      const nodeId = item.dataset.nodeId;
      if (nodeId) toggleById(nodeId);
    } else {
      // Already expanded or leaf — move focus to next visible row
      if (list[idx + 1]) focusRow(list[idx + 1]);
    }
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    if (item && !item.classList.contains("is-leaf") && item.classList.contains("is-expanded")) {
      // Expanded node — collapse it
      const nodeId = item.dataset.nodeId;
      if (nodeId) toggleById(nodeId);
    } else {
      // Collapsed or leaf — move focus to parent row
      const parentItem = item?.parentElement?.closest<HTMLElement>(".ds-tree-item");
      if (parentItem) {
        const parentRow = parentItem.querySelector<HTMLElement>(":scope > .ds-tree-row");
        if (parentRow) focusRow(parentRow);
      }
    }
  } else if (e.key === "Home") {
    e.preventDefault();
    if (list[0]) focusRow(list[0]);
  } else if (e.key === "End") {
    e.preventDefault();
    if (list[list.length - 1]) focusRow(list[list.length - 1]);
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
