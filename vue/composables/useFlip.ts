import { onBeforeUnmount, nextTick, ref, watch, type Ref } from "vue";

export interface FlipInput {
  rect: { top: number; bottom: number; left: number };
  floatW: number;
  floatH: number;
  vw: number;
  vh: number;
  preferred: "bottom" | "top";
  gap: number;
  padding: number;
}

export interface FlipResult {
  placement: "bottom" | "top";
  left: number;
}

export function computeFlip(i: FlipInput): FlipResult {
  const roomBelow = i.vh - i.rect.bottom - i.gap;
  const roomAbove = i.rect.top - i.gap;

  let placement: "bottom" | "top";
  if (i.preferred === "bottom") {
    placement = i.floatH > roomBelow && roomAbove > roomBelow ? "top" : "bottom";
  } else {
    placement = i.floatH > roomAbove && roomBelow > roomAbove ? "bottom" : "top";
  }

  let left = 0;
  const overflowRight = i.rect.left + i.floatW + i.padding - i.vw;
  if (overflowRight > 0) left = -overflowRight;
  if (i.rect.left + left < i.padding) left += i.padding - (i.rect.left + left);

  return { placement, left: Math.round(left) };
}

export interface UseFlipOptions {
  trigger: Ref<HTMLElement | null>;
  floating: Ref<HTMLElement | null>;
  open: Ref<boolean>;
  placement?: "bottom" | "top";
  gap?: number;
  padding?: number;
}

export interface UseFlipReturn {
  placement: Ref<"bottom" | "top">;
  floatStyle: Ref<{ left: string }>;
}

export function useFlip(opts: UseFlipOptions): UseFlipReturn {
  const preferred = opts.placement ?? "bottom";
  const gap = opts.gap ?? 6;
  const padding = opts.padding ?? 8;

  const placement = ref<"bottom" | "top">(preferred);
  const floatStyle = ref<{ left: string }>({ left: "0px" });

  let raf = 0;

  function measure() {
    if (typeof window === "undefined") return;
    const t = opts.trigger.value;
    const f = opts.floating.value;
    if (!t || !f) return;
    const rect = t.getBoundingClientRect();
    const res = computeFlip({
      rect: { top: rect.top, bottom: rect.bottom, left: rect.left },
      floatW: f.offsetWidth,
      floatH: f.offsetHeight,
      vw: window.innerWidth,
      vh: window.innerHeight,
      preferred,
      gap,
      padding,
    });
    placement.value = res.placement;
    floatStyle.value = { left: `${res.left}px` };
  }

  function schedule() {
    if (typeof window === "undefined") return;
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(measure);
  }

  function attach() {
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
  }

  function detach() {
    window.removeEventListener("scroll", schedule, true);
    window.removeEventListener("resize", schedule);
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  watch(
    opts.open,
    (v) => {
      if (v) {
        attach();
        nextTick(measure);
      } else {
        detach();
        placement.value = preferred;
        floatStyle.value = { left: "0px" };
      }
    },
    { immediate: true }
  );

  onBeforeUnmount(detach);

  return { placement, floatStyle };
}
