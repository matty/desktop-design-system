<script setup lang="ts">
import type { TreeNode } from "../types";

defineProps<{
  node: TreeNode;
  selected: string | null;
  expandedSet: Set<string>;
}>();
const emit = defineEmits<{ select: [TreeNode]; toggle: [TreeNode] }>();
</script>

<template>
  <li
    class="ds-tree-item"
    :class="{
      'is-leaf': !node.children || node.children.length === 0,
      'is-expanded': expandedSet.has(node.id),
      'is-selected': selected === node.id
    }"
    :data-node-id="node.id"
  >
    <div
      class="ds-tree-row"
      role="treeitem"
      :aria-selected="selected === node.id"
      :aria-expanded="node.children && node.children.length ? expandedSet.has(node.id) : undefined"
      tabindex="-1"
      @click="emit('select', node)"
    >
      <span
        v-if="node.children && node.children.length"
        class="ds-tree-twisty"
        aria-hidden="true"
        @click.stop="emit('toggle', node)"
      ><svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 18l6-6l-6-6"/></svg></span>
      <span class="ds-tree-label">{{ node.label }}</span>
    </div>
    <ul v-if="node.children && node.children.length && expandedSet.has(node.id)">
      <DsTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :selected="selected"
        :expanded-set="expandedSet"
        @select="emit('select', $event)"
        @toggle="emit('toggle', $event)"
      />
    </ul>
  </li>
</template>
