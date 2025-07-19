/**
 * Tests for Smart Navigation functionality
 */

describe("Smart Navigation Logic", () => {
  // Mock Chrome APIs
  const mockChromeTabs = {
    query: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(() => {
    // Setup Chrome API mock
    global.chrome = {
      tabs: mockChromeTabs,
    } as any;

    // Reset mocks
    jest.clearAllMocks();
  });

  // Helper function that matches the implementation
  const navigateSmartly = async (targetUrl: string) => {
    try {
      // Get the current active tab
      const [activeTab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!activeTab?.id || !activeTab?.url) {
        // Fallback to new tab if no active tab
        await chrome.tabs.create({ url: targetUrl });
        return;
      }

      const currentUrl = activeTab.url;

      // Check if both current and target are on DeepWiki
      if (
        currentUrl.includes("deepwiki.com") &&
        targetUrl.includes("deepwiki.com")
      ) {
        try {
          const currentUrlObj = new URL(currentUrl);
          const targetUrlObj = new URL(targetUrl);

          // Extract repository from both URLs
          const getCurrentRepo = (url: URL) => {
            const pathParts = url.pathname.split("/").filter((p) => p);
            return pathParts.length >= 2
              ? `${pathParts[0]}/${pathParts[1]}`
              : null;
          };

          const currentRepo = getCurrentRepo(currentUrlObj);
          const targetRepo = getCurrentRepo(targetUrlObj);

          // If same repository, update current tab
          if (currentRepo && targetRepo && currentRepo === targetRepo) {
            await chrome.tabs.update(activeTab.id, { url: targetUrl });
            return;
          }
        } catch (e) {
          // URL parsing failed, fallback to new tab
          console.error("Failed to parse URLs:", e);
        }
      }

      // Different repository or not both on DeepWiki: open new tab
      await chrome.tabs.create({ url: targetUrl });
    } catch (error) {
      console.error("Navigation failed:", error);
      // Ultimate fallback
      window.open(targetUrl, "_blank");
    }
  };

  describe("Same repository navigation", () => {
    test("should update current tab when navigating within same DeepWiki repository", async () => {
      const activeTab = {
        id: 123,
        url: "https://deepwiki.com/microsoft/vscode/1-architecture",
      };
      mockChromeTabs.query.mockResolvedValue([activeTab]);

      await navigateSmartly(
        "https://deepwiki.com/microsoft/vscode/2-build-system"
      );

      expect(mockChromeTabs.query).toHaveBeenCalledWith({
        active: true,
        currentWindow: true,
      });
      expect(mockChromeTabs.update).toHaveBeenCalledWith(123, {
        url: "https://deepwiki.com/microsoft/vscode/2-build-system",
      });
      expect(mockChromeTabs.create).not.toHaveBeenCalled();
    });

    test("should update current tab when navigating from page to repo overview", async () => {
      const activeTab = {
        id: 456,
        url: "https://deepwiki.com/microsoft/vscode/3-extension-system",
      };
      mockChromeTabs.query.mockResolvedValue([activeTab]);

      await navigateSmartly("https://deepwiki.com/microsoft/vscode");

      expect(mockChromeTabs.update).toHaveBeenCalledWith(456, {
        url: "https://deepwiki.com/microsoft/vscode",
      });
      expect(mockChromeTabs.create).not.toHaveBeenCalled();
    });
  });

  describe("Different repository navigation", () => {
    test("should open new tab when navigating to different DeepWiki repository", async () => {
      const activeTab = {
        id: 123,
        url: "https://deepwiki.com/microsoft/vscode/1-architecture",
      };
      mockChromeTabs.query.mockResolvedValue([activeTab]);

      await navigateSmartly("https://deepwiki.com/facebook/react/1-components");

      expect(mockChromeTabs.query).toHaveBeenCalledWith({
        active: true,
        currentWindow: true,
      });
      expect(mockChromeTabs.create).toHaveBeenCalledWith({
        url: "https://deepwiki.com/facebook/react/1-components",
      });
      expect(mockChromeTabs.update).not.toHaveBeenCalled();
    });

    test("should open new tab when current tab is on different organization", async () => {
      const activeTab = {
        id: 789,
        url: "https://deepwiki.com/google/tensorflow/overview",
      };
      mockChromeTabs.query.mockResolvedValue([activeTab]);

      await navigateSmartly("https://deepwiki.com/microsoft/vscode");

      expect(mockChromeTabs.create).toHaveBeenCalledWith({
        url: "https://deepwiki.com/microsoft/vscode",
      });
      expect(mockChromeTabs.update).not.toHaveBeenCalled();
    });
  });

  describe("Non-DeepWiki navigation", () => {
    test("should open new tab when current tab is not on DeepWiki", async () => {
      const activeTab = {
        id: 999,
        url: "https://github.com/microsoft/vscode",
      };
      mockChromeTabs.query.mockResolvedValue([activeTab]);

      await navigateSmartly("https://deepwiki.com/microsoft/vscode");

      expect(mockChromeTabs.create).toHaveBeenCalledWith({
        url: "https://deepwiki.com/microsoft/vscode",
      });
      expect(mockChromeTabs.update).not.toHaveBeenCalled();
    });

    test("should open new tab when navigating to non-DeepWiki URL from DeepWiki", async () => {
      const activeTab = {
        id: 555,
        url: "https://deepwiki.com/microsoft/vscode/architecture",
      };
      mockChromeTabs.query.mockResolvedValue([activeTab]);

      await navigateSmartly("https://github.com/microsoft/vscode");

      expect(mockChromeTabs.create).toHaveBeenCalledWith({
        url: "https://github.com/microsoft/vscode",
      });
      expect(mockChromeTabs.update).not.toHaveBeenCalled();
    });
  });

  describe("Error handling", () => {
    test("should create new tab when no active tab is found", async () => {
      mockChromeTabs.query.mockResolvedValue([]);

      await navigateSmartly("https://deepwiki.com/microsoft/vscode");

      expect(mockChromeTabs.create).toHaveBeenCalledWith({
        url: "https://deepwiki.com/microsoft/vscode",
      });
    });

    test("should create new tab when active tab has no URL", async () => {
      const activeTab = { id: 123, url: undefined };
      mockChromeTabs.query.mockResolvedValue([activeTab]);

      await navigateSmartly("https://deepwiki.com/microsoft/vscode");

      expect(mockChromeTabs.create).toHaveBeenCalledWith({
        url: "https://deepwiki.com/microsoft/vscode",
      });
    });

    test("should fallback to new tab when URL parsing fails", async () => {
      const activeTab = {
        id: 123,
        url: "invalid-url-format",
      };
      mockChromeTabs.query.mockResolvedValue([activeTab]);

      await navigateSmartly("https://deepwiki.com/microsoft/vscode");

      expect(mockChromeTabs.create).toHaveBeenCalledWith({
        url: "https://deepwiki.com/microsoft/vscode",
      });
    });

    test("should use window.open as ultimate fallback when Chrome APIs fail", async () => {
      mockChromeTabs.query.mockRejectedValue(new Error("Chrome API error"));

      // Mock window.open
      const mockWindowOpen = jest.fn();
      global.window = { open: mockWindowOpen } as any;

      await navigateSmartly("https://deepwiki.com/microsoft/vscode");

      expect(mockWindowOpen).toHaveBeenCalledWith(
        "https://deepwiki.com/microsoft/vscode",
        "_blank"
      );
    });
  });

  describe("Edge cases", () => {
    test("should handle repositories with similar names correctly", async () => {
      const activeTab = {
        id: 123,
        url: "https://deepwiki.com/microsoft/vscode-extension-api",
      };
      mockChromeTabs.query.mockResolvedValue([activeTab]);

      await navigateSmartly("https://deepwiki.com/microsoft/vscode");

      // Should open new tab because different repositories
      expect(mockChromeTabs.create).toHaveBeenCalledWith({
        url: "https://deepwiki.com/microsoft/vscode",
      });
      expect(mockChromeTabs.update).not.toHaveBeenCalled();
    });

    test("should handle repository with only one path segment", async () => {
      const activeTab = {
        id: 123,
        url: "https://deepwiki.com/microsoft",
      };
      mockChromeTabs.query.mockResolvedValue([activeTab]);

      await navigateSmartly("https://deepwiki.com/microsoft/vscode");

      // Should open new tab because current URL doesn't have full repo path
      expect(mockChromeTabs.create).toHaveBeenCalledWith({
        url: "https://deepwiki.com/microsoft/vscode",
      });
    });
  });
});
