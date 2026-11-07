// One activation per map at a time, whether requested by the observer or a reader.
export function createMapActivator<T extends object>(
  activate: (root: T) => Promise<void>,
) {
  const pending = new WeakMap<T, Promise<void>>();
  return (root: T): Promise<void> => {
    const existing = pending.get(root);
    if (existing) return existing;
    const request = Promise.resolve()
      .then(() => activate(root))
      .finally(() => pending.delete(root));
    pending.set(root, request);
    return request;
  };
}

export const MAP_LAZY_ROOT_MARGIN = "300px 0px";

export function setMapListLoaded(root: HTMLElement, loaded: boolean): void {
  if (loaded && root.dataset.showLocationList === "false") {
    root.dataset.mapListCollapsed = "true";
  } else {
    delete root.dataset.mapListCollapsed;
  }
}

export function observeAutomaticMaps(
  roots: Iterable<HTMLElement>,
  activate: (root: HTMLElement) => Promise<void>,
  Observer:
    typeof IntersectionObserver | undefined = typeof IntersectionObserver ===
  "undefined"
    ? undefined
    : IntersectionObserver,
): () => void {
  if (!Observer) return () => {};
  const observer = new Observer(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        void activate(entry.target as HTMLElement);
      }
    },
    { rootMargin: MAP_LAZY_ROOT_MARGIN },
  );
  for (const root of roots) {
    if (root.dataset.loadingBehavior === "automatic") observer.observe(root);
  }
  return () => observer.disconnect();
}
