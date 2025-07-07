import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import "./style.css";

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

function IndexPopup() {
  const [currentUrl, setCurrentUrl] = useState("");
  const [host1, setHost1] = useState("github.com");
  const [host2, setHost2] = useState("deepwiki.com");
  const [canSwitch, setCanSwitch] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    // Load settings and current tab info
    const loadData = async () => {
      try {
        const [savedHost1, savedHost2] = await Promise.all([
          storage.get("host1"),
          storage.get("host2"),
        ]);

        setHost1(savedHost1 || "github.com");
        setHost2(savedHost2 || "deepwiki.com");

        // Get current tab URL
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (tab.url) {
          setCurrentUrl(tab.url);
          const response = await chrome.runtime.sendMessage({
            action: "checkCanSwitch",
            url: tab.url,
          });
          setCanSwitch(response.canSwitch);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSwitch = async () => {
    try {
      setIsSwitching(true);
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab.id) {
        const response = await chrome.runtime.sendMessage({
          action: "switchTab",
          tabId: tab.id,
        });
        if (response.success) {
          window.close();
        }
      }
    } catch (error) {
      console.error("Error switching:", error);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleOpenSettings = () => {
    chrome.runtime.openOptionsPage();
    window.close();
  };

  const getDisplayUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + urlObj.pathname;
    } catch {
      return url;
    }
  };

  if (isLoading) {
    return (
      <div className="popup-container">
        <div className="loading-container">Loading...</div>
      </div>
    );
  }

  return (
    <div className="popup-container">
      <h2 className="popup-title">⚡ DeepWiki++</h2>

      <div className="popup-info">
        <p>Switch between:</p>
        <div className="host-display">
          {host1} ↔ {host2}
        </div>
      </div>

      {canSwitch ? (
        <button
          onClick={handleSwitch}
          disabled={isSwitching}
          className="switch-button"
        >
          {isSwitching ? "Switching..." : "Switch Site"}
        </button>
      ) : (
        <div className="not-switchable">This page cannot be switched</div>
      )}

      <div className="popup-footer">
        <button onClick={handleOpenSettings} className="settings-link">
          ⚙️ Settings
        </button>
      </div>

      {currentUrl && (
        <div className="current-url">Current: {getDisplayUrl(currentUrl)}</div>
      )}
    </div>
  );
}

export default IndexPopup;

// Mount the React component
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<IndexPopup />);
}
