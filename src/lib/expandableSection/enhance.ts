const enhanceExpandableSections = () => {
  const sections = document.querySelectorAll<HTMLElement>(
    ".expandable-section[data-expandable-section]:not([data-enhanced])",
  );

  for (const root of sections) {
    const region = root.querySelector<HTMLElement>("[data-expandable-content]");
    const button = root.querySelector<HTMLButtonElement>(
      "[data-expandable-toggle]",
    );

    if (!region || !button) {
      root.removeAttribute("data-preparing");
      console.error(
        "Expandable Section enhancement could not find its control region.",
      );
      continue;
    }

    let timer: ReturnType<typeof setTimeout>;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const finish = () => {
      clearTimeout(timer);
      const expanded = root.hasAttribute("data-expanded");
      region.style.height = expanded ? "" : "0px";
      if (!expanded) {
        region.setAttribute("aria-hidden", "true");
        region.inert = true;
        button.setAttribute("aria-expanded", "false");
        button.textContent = button.dataset.labelMore ?? "";
      }
    };

    const toggle = () => {
      clearTimeout(timer);
      const expanding = !root.hasAttribute("data-expanded");
      region.style.height = `${region.getBoundingClientRect().height}px`;
      void region.offsetHeight;

      if (expanding) {
        region.removeAttribute("aria-hidden");
        region.inert = false;
        root.setAttribute("data-expanded", "");
        button.setAttribute("aria-expanded", "true");
        button.textContent = button.dataset.labelLess ?? "";
        region.style.height = `${region.scrollHeight}px`;
      } else {
        root.removeAttribute("data-expanded");
        region.setAttribute("aria-hidden", "true");
        region.inert = true;
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

    region.setAttribute("aria-hidden", "true");
    region.inert = true;
    root.setAttribute("data-enhanced", "");
    root.removeAttribute("data-preparing");
    requestAnimationFrame(() => root.setAttribute("data-ready", ""));
    button.addEventListener("click", toggle);
    region.addEventListener("transitionend", (event) => {
      if (event.target === region && event.propertyName === "height") finish();
    });
  }
};

enhanceExpandableSections();
