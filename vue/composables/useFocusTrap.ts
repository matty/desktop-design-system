import { onBeforeUnmount, watch, nextTick, type Ref } from "vue";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),' +
  'select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function focusable(el: HTMLElement): HTMLElement[] {
  return Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (n) =>
      !n.hidden &&
      n.offsetWidth > 0 &&
      n.offsetHeight > 0 &&
      getComputedStyle(n).visibility !== "hidden"
  );
}

export function useFocusTrap(container: Ref<HTMLElement | null>, active: Ref<boolean>): void {
  let prev: HTMLElement | null = null;

  function onKey(e: KeyboardEvent) {
    const el = container.value;
    if (!el || e.key !== "Tab") return;
    const list = focusable(el);
    if (!list.length) return;
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function deactivate() {
    const el = container.value;
    if (el) el.removeEventListener("keydown", onKey);
    if (prev && prev.focus) prev.focus();
    prev = null;
  }

  watch(
    active,
    async (v) => {
      if (v) {
        prev = document.activeElement as HTMLElement;
        await nextTick();
        const el = container.value;
        if (!el) return;
        el.addEventListener("keydown", onKey);
        const list = focusable(el);
        if (list[0]) list[0].focus();
      } else {
        deactivate();
      }
    },
    { immediate: true }
  );

  onBeforeUnmount(() => {
    deactivate();
  });
}
