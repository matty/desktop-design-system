import { onBeforeUnmount, watch, nextTick, type Ref } from "vue";

export interface RovingOptions {
  selector?: string;
  orientation?: "vertical" | "horizontal" | "both";
  onActivate?: (el: HTMLElement) => void;
}

export function useRovingTabindex(
  container: Ref<HTMLElement | null>,
  active: Ref<boolean>,
  opts: RovingOptions = {}
): void {
  const selector =
    opts.selector || '[role="menuitem"],[role="treeitem"],[role="option"]';
  const orientation = opts.orientation || "vertical";

  function items(el: HTMLElement): HTMLElement[] {
    return Array.from(el.querySelectorAll<HTMLElement>(selector)).filter(
      (n) => n.offsetParent !== null && n.getAttribute("aria-disabled") !== "true"
    );
  }
  function setActive(list: HTMLElement[], idx: number) {
    list.forEach((n, i) => (n.tabIndex = i === idx ? 0 : -1));
    if (list[idx]) list[idx].focus();
  }
  function init() {
    const el = container.value;
    if (!el) return;
    items(el).forEach((n, i) => (n.tabIndex = i === 0 ? 0 : -1));
  }
  function onKey(e: KeyboardEvent) {
    const el = container.value;
    if (!el) return;
    const list = items(el);
    const idx = list.indexOf(document.activeElement as HTMLElement);
    if (idx < 0) return;
    let map: Record<string, number> = {};
    if (orientation === "horizontal") map = { ArrowLeft: idx - 1, ArrowRight: idx + 1 };
    else if (orientation === "vertical") map = { ArrowUp: idx - 1, ArrowDown: idx + 1 };
    else map = { ArrowLeft: idx - 1, ArrowRight: idx + 1, ArrowUp: idx - 1, ArrowDown: idx + 1 };
    if (map[e.key] != null) {
      e.preventDefault();
      setActive(list, (map[e.key] + list.length) % list.length);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(list, 0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(list, list.length - 1);
    } else if ((e.key === "Enter" || e.key === " ") && opts.onActivate) {
      e.preventDefault();
      opts.onActivate(list[idx]);
    }
  }

  watch(
    active,
    async (v) => {
      if (v) {
        await nextTick();
        const el = container.value;
        if (!el) return;
        el.addEventListener("keydown", onKey);
        init();
      } else {
        const el = container.value;
        if (el) el.removeEventListener("keydown", onKey);
      }
    },
    { immediate: true }
  );

  onBeforeUnmount(() => {
    const el = container.value;
    if (el) el.removeEventListener("keydown", onKey);
  });
}
