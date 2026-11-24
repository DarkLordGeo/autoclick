const registered = new Set();

async function registerRule(origin) {
  const id = `autoclick-${btoa(origin).replace(/[^a-z0-9]/gi, "").slice(0, 24)}`;
  try {
    const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [id] });
    if (!existing.length) {
      await chrome.scripting.registerContentScripts([{
        id,
        matches: [`${origin}/*`],
        js: ["autoclick.js"],
        runAt: "document_idle",
        persistAcrossSessions: true
      }]);
    }
    registered.add(origin);
  } catch (error) {
    console.error("AutoClick could not register this site:", error);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "SAVE_RULE" && message.rule?.origin && message.rule?.selector) {
    (async () => {
      const { rules = {} } = await chrome.storage.local.get("rules");
      rules[message.rule.origin] = message.rule;
      await chrome.storage.local.set({ rules });
      await registerRule(message.rule.origin);
      // Activate the new rule in the tab where the user selected the button,
      // without requiring a page reload.
      if (sender.tab?.id) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: sender.tab.id },
            files: ["autoclick.js"]
          });
        } catch (error) {
          console.warn("AutoClick saved the rule but could not activate it in the current tab:", error);
        }
      }
      sendResponse({ ok: true });
    })();
    return true;
  }

  if (message?.type === "REMOVE_RULE" && message.origin) {
    (async () => {
      const { rules = {} } = await chrome.storage.local.get("rules");
      delete rules[message.origin];
      await chrome.storage.local.set({ rules });
      const id = `autoclick-${btoa(message.origin).replace(/[^a-z0-9]/gi, "").slice(0, 24)}`;
      try { await chrome.scripting.unregisterContentScripts({ ids: [id] }); } catch {}
      sendResponse({ ok: true });
    })();
    return true;
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  const { rules = {}, enabled } = await chrome.storage.local.get(["rules", "enabled"]);
  if (enabled === undefined) await chrome.storage.local.set({ enabled: true });
  for (const origin of Object.keys(rules)) await registerRule(origin);
});