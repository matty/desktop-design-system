import { onBeforeUnmount, watch, type Ref } from "vue";

export interface DismissOptions {
  active: Ref<boolean>;
  root: Ref<HTMLElement | null>;
  onDismiss: () => void;
  escape?: boolean;
}

export function useDismiss(opts: DismissOptions): void {
  const escape = opts.escape ?? true;

  function onPointer(e: MouseEvent) {
    const root = opts.root.value;
    if (root && !root.contains(e.target as Node)) opts.onDismiss();
  }
  function onKey(e: KeyboardEvent) {
    if (escape && e.key === "Escape") opts.onDismiss();
  }
  function attach() {
    document.addEventListener("pointerdown", onPointer, true);
    document.addEventListener("keydown", onKey);
  }
  function detach() {
    document.removeEventListener("pointerdown", onPointer, true);
    document.removeEventListener("keydown", onKey);
  }

  watch(opts.active, (v) => (v ? attach() : detach()), { immediate: true });
  onBeforeUnmount(detach);
}
