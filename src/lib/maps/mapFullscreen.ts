import type { Map as LeafletMap } from "leaflet";

type FullscreenState = {
  root: HTMLElement;
  stage: HTMLElement;
  placeholder: Comment;
  dialog: HTMLDialogElement;
  opener: HTMLButtonElement;
  map: LeafletMap;
  bodyOverflow: string;
  bodyPriority: string;
  htmlOverflow: string;
  htmlPriority: string;
};

export function createMapFullscreen(doc: Document, win: Window) {
  let active: FullscreenState | undefined;

  const resize = () => {
    if (!active) return;
    const { map } = active;
    const center = map.getCenter();
    const zoom = map.getZoom();
    map.invalidateSize({ pan: false, animate: false });
    map.setView(center, zoom, { animate: false });
  };

  const restoreOverflow = (element: HTMLElement, value: string, priority: string) => {
    if (value) element.style.setProperty("overflow", value, priority);
    else element.style.removeProperty("overflow");
  };

  const close = (root?: HTMLElement, restoreFocus = true): boolean => {
    if (!active || (root && active.root !== root)) return false;
    const state = active;
    let center: ReturnType<LeafletMap["getCenter"]> | undefined;
    let zoom: number | undefined;
    try {
      center = state.map.getCenter();
      zoom = state.map.getZoom();
    } finally {
      active = undefined;
      win.removeEventListener("resize", resize);
      win.visualViewport?.removeEventListener("resize", resize);
      doc.removeEventListener("keydown", onKeyDown, true);
      state.dialog.removeEventListener("cancel", onCancel);
      state.dialog.removeEventListener("close", onDialogClose);
      state.dialog.removeEventListener("click", onDialogClick);
      try {
        if (state.dialog.open) state.dialog.close();
      } finally {
        try {
          if (state.placeholder.parentNode) {
            state.placeholder.parentNode.replaceChild(state.stage, state.placeholder);
          }
        } finally {
          restoreOverflow(doc.body, state.bodyOverflow, state.bodyPriority);
          restoreOverflow(doc.documentElement, state.htmlOverflow, state.htmlPriority);
          try {
            state.map.invalidateSize({ pan: false, animate: false });
            if (center && zoom !== undefined) state.map.setView(center, zoom, { animate: false });
          } finally {
            if (restoreFocus && state.opener.isConnected) state.opener.focus();
          }
        }
      }
    }
    return true;
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    close();
  };
  const onCancel = (event: Event) => {
    event.preventDefault();
    close();
  };
  const onDialogClose = () => {
    if (active && !active.dialog.open) close();
  };
  const onDialogClick = (event: Event) => {
    if (event.target === active?.dialog.querySelector("[data-map-fullscreen-exit]")) close();
  };

  const open = (root: HTMLElement, map: LeafletMap) => {
    const stage = root.querySelector<HTMLElement>("[data-map-stage]");
    const dialog = root.querySelector<HTMLDialogElement>("[data-map-fullscreen-dialog]");
    const opener = root.querySelector<HTMLButtonElement>("[data-map-fullscreen-open]");
    const exit = dialog?.querySelector<HTMLButtonElement>("[data-map-fullscreen-exit]");
    if (!stage?.parentNode || !dialog || !opener || !exit || stage.contains(dialog)) {
      throw new Error("Fullscreen map controls are incomplete.");
    }
    if (active?.root === root) return;
    close();
    const state: FullscreenState = {
      root, stage, placeholder: doc.createComment("map fullscreen"), dialog, opener, map,
      bodyOverflow: doc.body.style.getPropertyValue("overflow"),
      bodyPriority: doc.body.style.getPropertyPriority("overflow"),
      htmlOverflow: doc.documentElement.style.getPropertyValue("overflow"),
      htmlPriority: doc.documentElement.style.getPropertyPriority("overflow"),
    };
    const center = map.getCenter();
    const zoom = map.getZoom();
    const parent = stage.parentNode;
    try {
      parent.insertBefore(state.placeholder, stage);
      active = state;
      dialog.append(stage);
      dialog.showModal();
      doc.body.style.setProperty("overflow", "hidden");
      doc.documentElement.style.setProperty("overflow", "hidden");
      doc.addEventListener("keydown", onKeyDown, true);
      dialog.addEventListener("cancel", onCancel);
      dialog.addEventListener("close", onDialogClose);
      dialog.addEventListener("click", onDialogClick);
      win.addEventListener("resize", resize);
      win.visualViewport?.addEventListener("resize", resize);
      map.invalidateSize({ pan: false, animate: false });
      map.setView(center, zoom, { animate: false });
      exit.focus();
    } catch (error) {
      if (active === state) {
        try {
          close(root);
        } catch (rollbackError) {
          throw new AggregateError([error, rollbackError], "Fullscreen map rollback failed.");
        }
      }
      throw error;
    }
  };

  return { open, close };
}
