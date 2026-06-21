<script setup lang="ts">
import { ref, nextTick } from "vue";
import type { MenuItem } from "../types";
import { useFocusTrap } from "../composables/useFocusTrap";
import { useRovingTabindex } from "../composables/useRovingTabindex";
import { useDismiss } from "../composables/useDismiss";

const props = defineProps<{ items: MenuItem[]; ariaLabel?: string }>();
const emit = defineEmits<{ select: [string] }>();

const open = ref(false);
const x = ref(0);
const y = ref(0);
const menu = ref<HTMLElement | null>(null);


useFocusTrap(menu, open);
useRovingTabindex(menu, open, {
  selector: ":scope > .ds-menu-item",
  onActivate: (el) => el.click()
});
useDismiss({ active: open, root: menu, onDismiss: () => (open.value = false) });

async function onContext(e: MouseEvent) {
  e.preventDefault();
  open.value = true;
  await nextTick();
  const el = menu.value;
  if (!el) return;
  const r = el.getBoundingClientRect();
  const px = e.clientX + r.width > window.innerWidth ? e.clientX - r.width : e.clientX;
  const py = e.clientY + r.height > window.innerHeight ? e.clientY - r.height : e.clientY;
  x.value = Math.max(4, px);
  y.value = Math.max(4, py);
}
function choose(item: MenuItem) {
  if (item.disabled || item.separator) return;
  if (item.children && item.children.length) return;
  item.onSelect?.();
  emit("select", item.id);
  open.value = false;
}
</script>

<template>
  <div style="display: contents" @contextmenu="onContext">
    <slot />
  </div>
  <Teleport to="body">
    <div
      v-if="open"
      ref="menu"
      class="ds-menu ds-context-menu"
      role="menu"
      :aria-label="ariaLabel"
      :style="{ position: 'fixed', left: x + 'px', top: y + 'px' }"
    >
      <template v-for="item in items" :key="item.id">
        <div v-if="item.separator" class="ds-menu-sep"></div>
        <div
          v-else
          class="ds-menu-item"
          :class="{ 'is-danger': item.danger, 'has-submenu': item.children && item.children.length }"
          role="menuitem"
          tabindex="-1"
          :aria-disabled="item.disabled || undefined"
          @click="choose(item)"
        >
          {{ item.label }}
        </div>
      </template>
    </div>
  </Teleport>
</template>
