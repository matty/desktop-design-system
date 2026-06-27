import { reactive, readonly } from "vue";
import type { ToastOptions, ToastTone } from "../types";
import { useAnnounce } from "./useAnnounce";

export interface ActiveToast extends ToastOptions {
  id: string;
}

type Timer = { handle: ReturnType<typeof setTimeout>; remaining: number; startedAt: number };

const state = reactive<{ toasts: ActiveToast[] }>({ toasts: [] });
let seq = 0;
const { announce } = useAnnounce();
const timers = new Map<string, Timer>();

type ShorthandOpts = Omit<ToastOptions, "message" | "tone">;
export interface ToastFn {
  (opts: ToastOptions): string;
  success(message: string, opts?: ShorthandOpts): string;
  danger(message: string, opts?: ShorthandOpts): string;
  warn(message: string, opts?: ShorthandOpts): string;
  info(message: string, opts?: ShorthandOpts): string;
}

function arm(id: string, ms: number): void {
  if (timers.has(id)) clearTimeout(timers.get(id)!.handle);
  timers.set(id, { handle: setTimeout(() => dismiss(id), ms), remaining: ms, startedAt: Date.now() });
}

function dismiss(id: string): void {
  const t = timers.get(id);
  if (t) { clearTimeout(t.handle); timers.delete(id); }
  const i = state.toasts.findIndex((x) => x.id === id);
  if (i >= 0) state.toasts.splice(i, 1);
}

function pause(id: string): void {
  const t = timers.get(id);
  if (!t) return;
  clearTimeout(t.handle);
  t.remaining = Math.max(0, t.remaining - (Date.now() - t.startedAt));
}

function resume(id: string): void {
  const t = timers.get(id);
  if (!t) return;
  arm(id, t.remaining);
}

const toast = ((opts: ToastOptions): string => {
  const id = opts.id ?? `toast-${++seq}`;
  const item: ActiveToast = { tone: "info", timeout: 4000, ...opts, id };
  state.toasts.push(item);
  announce(item.message, { assertive: item.assertive });
  if (item.timeout && item.timeout > 0) arm(id, item.timeout);
  return id;
}) as ToastFn;

const make = (tone: ToastTone) => (message: string, opts: ShorthandOpts = {}) =>
  toast({ message, tone, ...opts });
toast.success = make("success");
toast.danger = make("danger");
toast.warn = make("warn");
toast.info = make("info");

export function useToast() {
  return { toasts: readonly(state.toasts), toast, dismiss, pause, resume };
}
