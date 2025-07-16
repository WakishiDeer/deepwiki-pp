export interface ITabGateway {
  getCurrentTab(tabId: number): Promise<chrome.tabs.Tab>;
  updateTab(tabId: number, url: string): Promise<void>;
  setBadge(tabId: number, text: string): Promise<void>;
}

export class ChromeTabGateway implements ITabGateway {
  async getCurrentTab(tabId: number): Promise<chrome.tabs.Tab> {
    return await chrome.tabs.get(tabId);
  }

  async updateTab(tabId: number, url: string): Promise<void> {
    await chrome.tabs.update(tabId, { url });
  }

  async setBadge(tabId: number, text: string): Promise<void> {
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
}
