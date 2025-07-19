import { TabSwitchUseCase } from "../../application/usecases/tab-switch";
import { ChromeStorageSettingsRepository } from "../../infrastructure/repositories/chrome/settings/chrome-storage-settings-repository";
import { ChromeStorageHeadingSectionRepository } from "../../infrastructure/repositories/chrome/heading-section/chrome-storage-heading-section-repository";
import { ChromeTabGateway } from "../../infrastructure/gateways/tab/chrome-tab-gateway";
import {
  AddHeadingSectionUseCase,
  GetHeadingSectionsUseCase,
  RemoveHeadingSectionUseCase,
  ClearAllHeadingSectionsUseCase,
} from "../../application/usecases/heading-collection";
import { Message } from "../../shared/messaging";

export default defineBackground(() => {
  console.log("Background script started");

  // Initialize dependencies
  const settingsPort = new ChromeStorageSettingsRepository();
  const headingSectionRepository = new ChromeStorageHeadingSectionRepository();
  const tabGateway = new ChromeTabGateway();
  const tabSwitchUseCase = new TabSwitchUseCase(settingsPort);
  const addHeadingSectionUseCase = new AddHeadingSectionUseCase(
    headingSectionRepository
  );
  const getHeadingSectionsUseCase = new GetHeadingSectionsUseCase(
    headingSectionRepository
  );
  const removeHeadingSectionUseCase = new RemoveHeadingSectionUseCase(
    headingSectionRepository
  );
  const clearAllHeadingSectionsUseCase = new ClearAllHeadingSectionsUseCase(
    headingSectionRepository
  );

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

  // Handle messages from popup and content scripts
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

      if (request.action === "addHeadingSection") {
        console.log(
          "Background: Adding heading section:",
          request.headingSection
        );

        addHeadingSectionUseCase
          .execute(request.headingSection)
          .then((result) => {
            console.log(
              "Background: Heading section operation result:",
              result
            );

            if (result.success) {
              sendResponse({ success: true, sectionId: result.sectionId });
            } else {
              sendResponse({
                success: false,
                error: result.message,
                errorCode: result.errorCode,
              });
            }
          })
          .catch((error) => {
            console.error("Background: Error adding heading section:", error);
            sendResponse({
              success: false,
              error: error.message || "Failed to add heading section",
            });
          });
        return true; // Will respond asynchronously
      }

      if (request.action === "getHeadingSections") {
        console.log("Background: Getting heading sections");

        getHeadingSectionsUseCase
          .execute(request.input || {})
          .then((result) => {
            console.log("Background: Get heading sections result:", result);

            if (result.success) {
              sendResponse({
                success: true,
                sections: result.sections,
                totalCount: result.totalCount,
                metadata: result.metadata,
              });
            } else {
              sendResponse({
                success: false,
                error: result.message,
                errorCode: result.errorCode,
              });
            }
          })
          .catch((error) => {
            console.error("Background: Error getting heading sections:", error);
            sendResponse({
              success: false,
              error: error.message || "Failed to get heading sections",
              sections: [],
            });
          });
        return true; // Will respond asynchronously
      }

      if (request.action === "clearAllHeadingSections") {
        console.log("Background: Clearing all heading sections");

        clearAllHeadingSectionsUseCase
          .execute()
          .then((result) => {
            console.log("Background: Clear all sections result:", result);

            if (result.success) {
              console.log(
                `Background: ${result.clearedCount} heading sections cleared successfully`
              );
              sendResponse({
                success: true,
                clearedCount: result.clearedCount,
              });
            } else {
              sendResponse({
                success: false,
                error: result.message,
                errorCode: result.errorCode,
              });
            }
          })
          .catch((error) => {
            console.error(
              "Background: Error clearing heading sections:",
              error
            );
            sendResponse({
              success: false,
              error: error.message || "Failed to clear heading sections",
            });
          });
        return true; // Will respond asynchronously
      }

      if (request.action === "removeHeadingSection") {
        console.log("Background: Removing heading section:", request.sectionId);

        removeHeadingSectionUseCase
          .execute({ sectionId: request.sectionId })
          .then((result) => {
            console.log("Background: Section removal result:", result);

            if (result.success) {
              sendResponse({
                success: true,
                removedSectionId: result.removedSectionId,
              });
            } else {
              sendResponse({
                success: false,
                error: result.message,
                errorCode: result.errorCode,
              });
            }
          })
          .catch((error) => {
            console.error("Background: Error removing heading section:", error);
            sendResponse({
              success: false,
              error: error.message || "Failed to remove heading section",
            });
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
