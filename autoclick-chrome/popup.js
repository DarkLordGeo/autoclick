const enabledEl = document.getElementById("enabled");
const chooseBtn = document.getElementById("choose");
const removeBtn = document.getElementById("remove");
const siteEl = document.getElementById("site");
const savedEl = document.getElementById("saved");
const selectorEl = document.getElementById("selector");
const statusEl = document.getElementById("status");

let currentOrigin = null;
let currentTabId = null;

function showStatus(message, error = true) {
  statusEl.textContent = message;
  statusEl.style.color = error ? "#b42318" : "#16803c";
}

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) throw new Error("Could not identify the current tab.");
  const url = new URL(tab.url);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("AutoClick works on regular HTTP and HTTPS websites, not browser internal pages.");
  }
  currentTabId = tab.id;
  currentOrigin = url.origin;
  siteEl.textContent = currentOrigin;
}

async function refresh() {
  const { enabled = true, rules = {} } = await chrome.storage.local.get(["enabled", "rules"]);
  enabledEl.checked = enabled;
  const rule = currentOrigin ? rules[currentOrigin] : null;
  savedEl.hidden = !rule;
  selectorEl.textContent = rule?.selector || "";
}

enabledEl.addEventListener("change", async () => {
  await chrome.storage.local.set({ enabled: enabledEl.checked });
  showStatus(enabledEl.checked ? "AutoClick enabled." : "AutoClick disabled.", false);
});

chooseBtn.addEventListener("click", async () => {
  try {
    showStatus("");
    const originPattern = `${currentOrigin}/*`;
    const granted = await chrome.permissions.request({ origins: [originPattern] });
    if (!granted) {
      showStatus("Site permission was not granted.");
      return;
    }
    await chrome.scripting.executeScript({
      target: { tabId: currentTabId },
      files: ["picker.js"]
    });
    showStatus("Hover over the target button, then click it.", false);
    window.close();
  } catch (error) {
    showStatus(error.message || "Could not start selection mode.");
  }
});

removeBtn.addEventListener("click", async () => {
  if (!currentOrigin) return;
  await chrome.runtime.sendMessage({ type: "REMOVE_RULE", origin: currentOrigin });
  await refresh();
  showStatus("Saved button removed.", false);
});

(async () => {
  try {
    await getCurrentTab();
    await refresh();
  } catch (error) {
    chooseBtn.disabled = true;
    showStatus(error.message);
    siteEl.textContent = "Unsupported page";
  }
})();