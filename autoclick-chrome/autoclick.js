(() => {
  // Avoid installing multiple observers if the script is injected more than once.
  if (window.__autoClickControllerInstalled) {
    window.__autoClickControllerRefresh?.();
    return;
  }
  window.__autoClickControllerInstalled = true;

  let enabled = true;
  let selector = null;
  let observer = null;
  let scanQueued = false;
  let visibleLastScan = new Set();

  const isVisible = el => {
    if (!(el instanceof HTMLElement) || !el.isConnected) return false;
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" &&
      Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
  };

  const isDisabled = el => el.matches(":disabled,[aria-disabled='true']");

  const isHighImpact = el => {
    const label = `${el.innerText || ""} ${el.getAttribute("aria-label") || ""} ${el.value || ""}`.toLowerCase();
    return /\b(pay|purchase|buy now|delete|remove account|confirm order|place order)\b/.test(label);
  };

  const scan = () => {
    scanQueued = false;
    if (!enabled || !selector || !document.documentElement) {
      visibleLastScan.clear();
      return;
    }

    let matches;
    try {
      matches = [...document.querySelectorAll(selector)];
    } catch (error) {
      console.warn("AutoClick: saved selector is invalid.", error);
      return;
    }

    // Only click when the saved selector identifies exactly one visible target.
    const visible = matches.filter(el => isVisible(el) && !isDisabled(el));
    const currentVisible = new Set(visible);

    if (visible.length === 1) {
      const button = visible[0];
      // Click once on each appearance. It becomes eligible again after it
      // disappears, is hidden, or is replaced by another matching element.
      if (!visibleLastScan.has(button)) {
        if (isHighImpact(button)) {
          console.warn("AutoClick paused this match because it resembles a high-impact action.");
        } else {
          try {
            button.click();
            console.info("AutoClick: clicked the saved button.");
          } catch (error) {
            console.error("AutoClick: click failed.", error);
          }
        }
      }
    }

    visibleLastScan = currentVisible;
  };

  const scheduleScan = () => {
    if (scanQueued) return;
    scanQueued = true;
    requestAnimationFrame(scan);
  };

  const startObserver = () => {
    if (observer || !document.documentElement) return;
    observer = new MutationObserver(scheduleScan);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "hidden", "disabled", "aria-hidden", "aria-disabled"]
    });
  };

  const stopObserver = () => {
    observer?.disconnect();
    observer = null;
    visibleLastScan.clear();
  };

  const refresh = async () => {
    const { enabled: storedEnabled = true, rules = {} } = await chrome.storage.local.get(["enabled", "rules"]);
    enabled = storedEnabled;
    selector = rules[location.origin]?.selector || null;
    if (enabled && selector) {
      startObserver();
      scheduleScan();
    } else {
      stopObserver();
    }
  };

  window.__autoClickControllerRefresh = refresh;
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && (changes.enabled || changes.rules)) refresh();
  });

  // A page restored from the back/forward cache is a fresh appearance to the user.
  window.addEventListener("pageshow", event => {
    if (event.persisted) {
      visibleLastScan.clear();
      scheduleScan();
    }
  });
  const onClientNavigation = () => {
    // Treat browser back/forward and SPA route changes as a new page view,
    // even when the framework reuses the same DOM button node.
    visibleLastScan.clear();
    scheduleScan();
  };
  window.addEventListener("popstate", onClientNavigation);
  window.addEventListener("hashchange", onClientNavigation);

  for (const method of ["pushState", "replaceState"]) {
    const original = history[method];
    history[method] = function (...args) {
      const result = original.apply(this, args);
      onClientNavigation();
      return result;
    };
  }

  refresh();
})();
