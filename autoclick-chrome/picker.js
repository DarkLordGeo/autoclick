(() => {
  if (window.__autoClickPickerActive) return;
  window.__autoClickPickerActive = true;

  const style = document.createElement("style");
  style.id = "__autoclick_picker_style";
  style.textContent = `
    .__autoclick_hover { outline: 3px solid #ef2222 !important; outline-offset: 2px !important; cursor: crosshair !important; }
    #__autoclick_banner {
      position: fixed; z-index: 2147483647; top: 12px; left: 50%; transform: translateX(-50%);
      background: #171717; color: white; padding: 10px 14px; border-radius: 8px;
      font: 13px system-ui,sans-serif; box-shadow: 0 3px 18px #0005; pointer-events: none;
    }`;
  document.documentElement.appendChild(style);

  const banner = document.createElement("div");
  banner.id = "__autoclick_banner";
  banner.textContent = "AutoClick: hover over a button and click to save it · Esc to cancel";
  document.documentElement.appendChild(banner);

  let hovered = null;
  const cleanup = () => {
    if (hovered) hovered.classList.remove("__autoclick_hover");
    style.remove();
    banner.remove();
    document.removeEventListener("mouseover", onOver, true);
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("keydown", onKey, true);
    window.__autoClickPickerActive = false;
  };

  const onOver = event => {
    const el = event.target instanceof Element ? event.target.closest("button, input[type=button], input[type=submit], [role=button], a") : null;
    if (hovered && hovered !== el) hovered.classList.remove("__autoclick_hover");
    hovered = el;
    if (hovered) hovered.classList.add("__autoclick_hover");
  };

  const makeSelector = el => {
    if (el.id) {
      const idSelector = `#${CSS.escape(el.id)}`;
      if (document.querySelectorAll(idSelector).length === 1) return idSelector;
    }
    for (const attr of ["data-testid", "aria-label", "name"]) {
      const value = el.getAttribute(attr);
      if (value) {
        const selector = `${el.tagName.toLowerCase()}[${attr}="${CSS.escape(value)}"]`;
        if (document.querySelectorAll(selector).length === 1) return selector;
      }
    }
    const parts = [];
    let node = el;
    while (node && node !== document.body && parts.length < 6) {
      let part = node.tagName.toLowerCase();
      if (node.id) {
        part = `#${CSS.escape(node.id)}`;
        parts.unshift(part);
        break;
      }
      const parent = node.parentElement;
      if (parent) {
        const sameTag = [...parent.children].filter(child => child.tagName === node.tagName);
        if (sameTag.length > 1) part += `:nth-of-type(${sameTag.indexOf(node) + 1})`;
      }
      parts.unshift(part);
      node = parent;
    }
    return parts.join(" > ");
  };

  const onClick = event => {
    if (!hovered) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    const selector = makeSelector(hovered);
    const label = (hovered.innerText || hovered.getAttribute("aria-label") || hovered.value || "").trim().slice(0, 120);
    cleanup();
    chrome.runtime.sendMessage({
      type: "SAVE_RULE",
      rule: { origin: location.origin, selector, label, savedAt: Date.now() }
    });
  };

  const onKey = event => {
    if (event.key === "Escape") cleanup();
  };

  document.addEventListener("mouseover", onOver, true);
  document.addEventListener("click", onClick, true);
  document.addEventListener("keydown", onKey, true);
})();