export interface AnnounceOptions {
  assertive?: boolean;
}

function ensureRegion(assertive: boolean): HTMLElement {
  const id = assertive ? "ds-live-assertive" : "ds-live-polite";
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("div");
    el.id = id;
    el.className = "ds-live";
    el.setAttribute("aria-live", assertive ? "assertive" : "polite");
    el.setAttribute("aria-atomic", "true");
    document.body.appendChild(el);
  }
  return el;
}

export function useAnnounce() {
  function announce(message: string, opts: AnnounceOptions = {}) {
    const el = ensureRegion(!!opts.assertive);
    el.textContent = "";
    // Re-announce even identical text by clearing then setting on a tick.
    setTimeout(() => {
      el.textContent = message;
    }, 30);
  }
  return { announce };
}
