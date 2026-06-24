<script setup lang="ts">
import { ref, computed } from "vue";
import type { MenubarMenu, MenuItem } from "../types";
import { useDismiss } from "../composables/useDismiss";

const props = defineProps<{ menus: MenubarMenu[]; ariaLabel?: string }>();
const emit = defineEmits<{ select: [string] }>();

const root = ref<HTMLElement | null>(null);
const openId = ref<string | null>(null);
const active = computed(() => openId.value !== null);

useDismiss({ active, root, onDismiss: () => (openId.value = null) });

function toggle(id: string) {
  openId.value = openId.value === id ? null : id;
}
function choose(item: MenuItem) {
  if (item.disabled || item.separator) return;
  item.onSelect?.();
  emit("select", item.id);
  openId.value = null;
}

function topItems(): HTMLElement[] {
  return Array.from(root.value?.querySelectorAll<HTMLElement>(".ds-menubar-item") ?? []);
}
function openMenuItems(): HTMLElement[] {
  return Array.from(root.value?.querySelectorAll<HTMLElement>(".ds-menubar-item.is-open .ds-menu-item") ?? []);
}

function onKey(e: KeyboardEvent) {
  const tops = topItems();
  const topIndex = tops.findIndex((el) => el.contains(document.activeElement) || el === document.activeElement);

  if (e.key === "Escape") {
    openId.value = null;
    tops[topIndex >= 0 ? topIndex : 0]?.focus();
    return;
  }
  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
    e.preventDefault();
    if (topIndex < 0) return;
    const dir = e.key === "ArrowRight" ? 1 : -1;
    const next = (topIndex + dir + tops.length) % tops.length;
    tops[next].focus();
    if (openId.value) openId.value = props.menus[next].id;
    return;
  }
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    const mItems = openMenuItems();
    if (!mItems.length) {
      if (e.key === "ArrowDown" && topIndex >= 0) {
        e.preventDefault();
        openId.value = props.menus[topIndex].id;
      }
      return;
    }
    e.preventDefault();
    const cur = mItems.findIndex((el) => el === document.activeElement);
    const dir = e.key === "ArrowDown" ? 1 : -1;
    const next = (cur + dir + mItems.length) % mItems.length;
    mItems[next].focus();
  }
}
</script>

<template>
  <div ref="root" class="ds-menubar" role="menubar" :aria-label="ariaLabel" @keydown="onKey">
    <div
      v-for="menu in menus"
      :key="menu.id"
      class="ds-menubar-item"
      :class="{ 'is-open': openId === menu.id }"
      role="menuitem"
      tabindex="0"
      aria-haspopup="true"
      :aria-expanded="openId === menu.id"
      @click="toggle(menu.id)"
    >
      {{ menu.label }}
      <div v-if="openId === menu.id" class="ds-menu" role="menu" :aria-label="menu.label" @click.stop>
        <template v-for="item in menu.items" :key="item.id">
          <div v-if="item.separator" class="ds-menu-sep"></div>
          <div
            v-else
            class="ds-menu-item"
            :class="{ 'is-danger': item.danger }"
            role="menuitem"
            tabindex="-1"
            :aria-disabled="item.disabled || undefined"
            @click="choose(item)"
          >
            {{ item.label }}
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
