import { TabSwitchUseCase } from "../../application/usecases/tab-switch";
import { ChromeStorageSettingsRepository } from "../../infrastructure/repositories/chrome-storage-settings-repository";
import { ChromeTabGateway } from "../../infrastructure/gateways/chrome-tab-gateway";
import { Message } from "../../shared/messaging";

export default defineBackground(() => {
  console.log("Background script started");

  // Initialize dependencies
  const settingsPort = new ChromeStorageSettingsRepository();
  const tabGateway = new ChromeTabGateway();
  const tabSwitchUseCase = new TabSwitchUseCase(settingsPort);

  // Main switching logic
  async function switchTab(tabId: number, url?: string): Promise<void> {
    try {
      // Get current tab info if URL not provided
      if (!url) {
        const tab = await tabGateway.getCurrentTab(tabId);
        if (!tab.url) {
          throw new Error("No URL available");
        }
        url = tab.url;
      }

      // Transform URL using use case
      const newUrl = await tabSwitchUseCase.transformUrl(url);

      if (newUrl) {
        await tabGateway.updateTab(tabId, newUrl);
        await tabGateway.setBadge(tabId, "");
      } else {
        await tabGateway.setBadge(tabId, "⚠️");
        throw new Error("URL transformation failed");
      }
    } catch (error) {
      console.error("Error in switchTab:", error);
      throw error;
    }
  }

  // Check if a URL can be switched
  async function checkCanSwitch(url: string): Promise<boolean> {
    return await tabSwitchUseCase.canSwitchUrl(url);
  }

  // Helper function to update badge text
  async function updateBadge(tabId: number, canSwitch: boolean): Promise<void> {
    const text = canSwitch ? "" : "⚠️";
    await tabGateway.setBadge(tabId, text);
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
        const tab = await tabGateway.getCurrentTab(activeInfo.tabId);
        if (tab.url) {
          const canSwitch = await checkCanSwitch(tab.url);
          // Clear badge when tab becomes active
          await tabGateway.setBadge(activeInfo.tabId, "");
        }
      } catch (error) {
        console.error("Error handling tab activation:", error);
      }
    }
  );

  console.log("Background script initialization complete");
});
