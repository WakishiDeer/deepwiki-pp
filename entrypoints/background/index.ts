import { transformUrl } from "../../utils/transform";

export default defineBackground(() => {
  console.log("Background script started");

  // Storage utility for chrome.storage.sync
  class StorageUtil {
    async get(key: string): Promise<string | null> {
      try {
        if (!chrome?.storage?.sync) {
          console.warn("Chrome storage API not available");
          return null;
        }
        const result = await chrome.storage.sync.get([key]);
        return result[key] || null;
      } catch (error) {
        console.error("Error getting storage value:", error);
        return null;
      }
    }

    async set(key: string, value: string): Promise<void> {
      try {
        if (!chrome?.storage?.sync) {
          console.warn("Chrome storage API not available");
          return;
        }
        await chrome.storage.sync.set({ [key]: value });
      } catch (error) {
        console.error("Error setting storage value:", error);
      }
    }
  }

  const storage = new StorageUtil();

  // Message types
  interface SwitchTabMessage {
    action: "switchTab";
    tabId: number;
  }

  interface CheckCanSwitchMessage {
    action: "checkCanSwitch";
    url: string;
  }

  type Message = SwitchTabMessage | CheckCanSwitchMessage;

  // Helper function to safely use chrome.action API
  async function setBadge(tabId: number, text: string): Promise<void> {
    try {
      if (chrome?.action?.setBadgeText) {
        await chrome.action.setBadgeText({ text, tabId });
      } else {
        console.warn("chrome.action.setBadgeText not available");
      }
    } catch (error) {
      console.error("Error setting badge:", error);
    }
  }

  // Main switching logic
  async function switchTab(tabId: number, url?: string): Promise<void> {
    try {
      // Get current tab info if URL not provided
      if (!url) {
        const tab = await chrome.tabs.get(tabId);
        if (!tab.url) {
          throw new Error("No URL available");
        }
        url = tab.url;
      }

      // Get host configuration
      const host1 = (await storage.get("host1")) || "github.com";
      const host2 = (await storage.get("host2")) || "deepwiki.com";

      // Transform URL
      const newUrl = transformUrl(url, [[host1, host2]]);

      if (newUrl) {
        await chrome.tabs.update(tabId, { url: newUrl });
        await setBadge(tabId, "");
      } else {
        await setBadge(tabId, "⚠️");
        throw new Error("URL transformation failed");
      }
    } catch (error) {
      console.error("Error in switchTab:", error);
      throw error;
    }
  }

  // Check if a URL can be switched
  async function checkCanSwitch(url: string): Promise<boolean> {
    try {
      const host1 = (await storage.get("host1")) || "github.com";
      const host2 = (await storage.get("host2")) || "deepwiki.com";

      const parsedUrl = new URL(url);
      return parsedUrl.hostname === host1 || parsedUrl.hostname === host2;
    } catch (error) {
      console.error("Error checking URL:", error);
      return false;
    }
  }

  // Helper function to update badge text
  async function updateBadge(tabId: number, canSwitch: boolean): Promise<void> {
    const text = canSwitch ? "" : "⚠️";
    await setBadge(tabId, text);
  }

  // Handle messages from popup
  chrome.runtime.onMessage.addListener(
    (
      request: Message,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response: any) => void
    ) => {
      if (request.action === "switchTab") {
        switchTab(request.tabId)
          .then(() => sendResponse({ success: true }))
          .catch((error) => {
            console.error("Error switching tab:", error);
            sendResponse({ success: false, error: error.message });
          });
        return true; // Will respond asynchronously
      }

      if (request.action === "checkCanSwitch") {
        checkCanSwitch(request.url)
          .then((canSwitch) => sendResponse({ canSwitch }))
          .catch((error) => {
            console.error("Error checking switch capability:", error);
            sendResponse({ canSwitch: false });
          });
        return true; // Will respond asynchronously
      }
    }
  );

  // Update badge when tab changes
  chrome.tabs.onUpdated.addListener(
    async (
      tabId: number,
      changeInfo: chrome.tabs.TabChangeInfo,
      tab: chrome.tabs.Tab
    ) => {
      if (changeInfo.status === "complete" && tab.url) {
        const canSwitch = await checkCanSwitch(tab.url);
        await updateBadge(tabId, canSwitch);
      }
    }
  );

  // Clear badge when tab becomes active
  chrome.tabs.onActivated.addListener(
    async (activeInfo: chrome.tabs.TabActiveInfo) => {
      try {
        const tab = await chrome.tabs.get(activeInfo.tabId);
        if (tab.url) {
          const canSwitch = await checkCanSwitch(tab.url);
          // Clear badge when tab becomes active
          await setBadge(activeInfo.tabId, "");
        }
      } catch (error) {
        console.error("Error handling tab activation:", error);
      }
    }
  );

  console.log("Background script initialization complete");
});
