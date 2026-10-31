import { EXPANDABLE_SECTION_PREVIEW_LINES } from "./normalize.ts";

const getLineHeight = (body: HTMLElement): number => {
  const textElement = body.querySelector<HTMLElement>("p, li") ?? body;
  const styles = window.getComputedStyle(textElement);
  const lineHeight = Number.parseFloat(styles.lineHeight);
  if (Number.isFinite(lineHeight) && lineHeight > 0) return lineHeight;

  const fontSize = Number.parseFloat(styles.fontSize);
  return Number.isFinite(fontSize) && fontSize > 0
    ? fontSize * (document.documentElement.lang === "ne" ? 1.95 : 1.8)
    : 28;
};

const enhanceExpandableSections = () => {
  const sections = document.querySelectorAll<HTMLElement>(
    ".expandable-section[data-expandable-section]:not([data-initialized])",
  );

  for (const root of sections) {
    const region = root.querySelector<HTMLElement>("[data-expandable-content]");
    const body = root.querySelector<HTMLElement>("[data-expandable-body]");
    const preview = root.querySelector<HTMLElement>(
      "[data-expandable-preview]",
    );
    const button = root.querySelector<HTMLButtonElement>(
      "[data-expandable-toggle]",
    );

    if (!region || !body || !preview || !button) {
      root.removeAttribute("data-preparing");
      button?.remove();
      console.error(
        "Expandable Section enhancement could not find its preview or content.",
      );
      continue;
    }

    root.setAttribute("data-initialized", "");

    let timer: ReturnType<typeof setTimeout>;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const previewLines =
      EXPANDABLE_SECTION_PREVIEW_LINES[
        root.dataset
          .previewSize as keyof typeof EXPANDABLE_SECTION_PREVIEW_LINES
      ] ?? EXPANDABLE_SECTION_PREVIEW_LINES.standard;

    const updatePreviewMetrics = () => {
      const lineHeight = getLineHeight(body);
      root.style.setProperty("--preview-line-height", `${lineHeight}px`);
      return { lineHeight, previewHeight: lineHeight * previewLines };
    };

    const finish = () => {
      clearTimeout(timer);
      const expanded = root.hasAttribute("data-expanded");
      region.style.height = expanded ? "" : "0px";
      root.removeAttribute("data-transitioning");
      if (expanded) {
        region.removeAttribute("aria-hidden");
        region.inert = false;
        preview.setAttribute("aria-hidden", "true");
        button.setAttribute("aria-expanded", "true");
        button.textContent = button.dataset.labelLess ?? "";
      } else {
        region.setAttribute("aria-hidden", "true");
        region.inert = true;
        preview.removeAttribute("aria-hidden");
        button.setAttribute("aria-expanded", "false");
        button.textContent = button.dataset.labelMore ?? "";
      }
    };

    const enableToggle = () => {
      if (root.hasAttribute("data-enhanced")) return;

      region.setAttribute("aria-hidden", "true");
      region.inert = true;
      preview.removeAttribute("aria-hidden");
      button.setAttribute("aria-expanded", "false");
      button.hidden = false;
      root.setAttribute("data-enhanced", "");
      root.removeAttribute("data-preparing");
      requestAnimationFrame(() => root.setAttribute("data-ready", ""));

      const toggle = () => {
        clearTimeout(timer);
        const expanding = !root.hasAttribute("data-expanded");
        region.style.height = `${region.getBoundingClientRect().height}px`;
        void region.offsetHeight;

        if (expanding) {
          preview.setAttribute("aria-hidden", "true");
          region.removeAttribute("aria-hidden");
          region.inert = false;
          root.removeAttribute("data-transitioning");
          root.setAttribute("data-expanded", "");
          button.setAttribute("aria-expanded", "true");
          button.textContent = button.dataset.labelLess ?? "";
          region.style.height = `${region.scrollHeight}px`;
        } else {
          region.setAttribute("aria-hidden", "true");
          region.inert = true;
          preview.setAttribute("aria-hidden", "true");
          root.setAttribute("data-transitioning", "");
          root.removeAttribute("data-expanded");
          button.setAttribute("aria-expanded", "false");
          button.textContent = button.dataset.labelMore ?? "";
          region.style.height = "0px";
        }

        if (reduceMotion.matches) {
          finish();
        } else {
          timer = setTimeout(finish, 380);
        }
      };

      button.addEventListener("click", toggle);
      region.addEventListener("transitionend", (event) => {
        if (event.target === region && event.propertyName === "height")
          finish();
      });
    };

    const prepare = () => {
      const { previewHeight } = updatePreviewMetrics();
      const contentHeight = body.getBoundingClientRect().height;

      if (
        !root.hasAttribute("data-enhanced") &&
        contentHeight <= previewHeight
      ) {
        root.removeAttribute("data-preparing");
        return;
      }

      enableToggle();
    };

    try {
      prepare();
      if (typeof ResizeObserver !== "undefined") {
        new ResizeObserver(() => prepare()).observe(root);
      } else {
        window.addEventListener("resize", prepare, { passive: true });
      }
      void document.fonts?.ready.then(prepare);
    } catch (error) {
      root.removeAttribute("data-preparing");
      button.remove();
      console.error("Expandable Section enhancement failed.", error);
    }
  }
};

enhanceExpandableSections();
