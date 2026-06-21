import { reactive, readonly } from "vue";
import type { ToastOptions } from "../types";
import { useAnnounce } from "./useAnnounce";

export interface ActiveToast extends ToastOptions {
  id: string;
}

const state = reactive<{ toasts: ActiveToast[] }>({ toasts: [] });
let seq = 0;
const { announce } = useAnnounce();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

export function useToast() {
  function toast(opts: ToastOptions): string {
    const id = opts.id ?? `toast-${++seq}`;
    const item: ActiveToast = { tone: "info", timeout: 4000, ...opts, id };
    state.toasts.push(item);
    announce(item.message, { assertive: item.assertive });
    if (item.timeout && item.timeout > 0) {
      if (timers.has(id)) clearTimeout(timers.get(id));
      timers.set(id, setTimeout(() => dismiss(id), item.timeout));
    }
    return id;
  }
  function dismiss(id: string): void {
    const t = timers.get(id);
    if (t) { clearTimeout(t); timers.delete(id); }
    const i = state.toasts.findIndex((t) => t.id === id);
    if (i >= 0) state.toasts.splice(i, 1);
  }
  return { toasts: readonly(state.toasts), toast, dismiss };
}
