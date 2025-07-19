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

function IndexOptions() {
  const [host1, setHost1] = useState("github.com");
  const [host2, setHost2] = useState("deepwiki.com");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    // Load current settings
    const loadSettings = async () => {
      try {
        const [savedHost1, savedHost2] = await Promise.all([
          storage.get("host1"),
          storage.get("host2"),
        ]);
        setHost1(savedHost1 || "github.com");
        setHost2(savedHost2 || "deepwiki.com");
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("");

    try {
      await Promise.all([
        storage.set("host1", host1),
        storage.set("host2", host2),
      ]);
      setSaveStatus("Settings saved successfully!");
      setTimeout(() => setSaveStatus(""), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setSaveStatus("Error saving settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setHost1("github.com");
    setHost2("deepwiki.com");

    try {
      await Promise.all([
        storage.set("host1", "github.com"),
        storage.set("host2", "deepwiki.com"),
      ]);
      console.log("Defaults have been reset and saved to storage.");
    } catch (error) {
      console.error("Error saving defaults to storage:", error);
    }
  };

  return (
    <div className="options-container">
      <div className="options-header">
        <h1 className="options-title">DeepWiki++ Settings</h1>
        <p className="options-description">
          Configure the hosts for URL switching functionality.
        </p>
      </div>

      <div className="options-content">
        <div className="option-group">
          <label htmlFor="host1" className="option-label">
            Host 1 (Primary):
          </label>
          <input
            id="host1"
            type="text"
            value={host1}
            onChange={(e) => setHost1(e.target.value)}
            className="option-input"
            placeholder="github.com"
          />
          <p className="option-help">The primary host (e.g., github.com)</p>
        </div>

        <div className="option-group">
          <label htmlFor="host2" className="option-label">
            Host 2 (Secondary):
          </label>
          <input
            id="host2"
            type="text"
            value={host2}
            onChange={(e) => setHost2(e.target.value)}
            className="option-input"
            placeholder="deepwiki.com"
          />
          <p className="option-help">The secondary host (e.g., deepwiki.com)</p>
        </div>

        <div className="option-actions">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="save-button"
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
          <button onClick={handleReset} className="reset-button" type="button">
            Reset to Default
          </button>
        </div>

        {saveStatus && (
          <div
            className={`save-status ${
              saveStatus.includes("Error") ? "error" : "success"
            }`}
          >
            {saveStatus}
          </div>
        )}
      </div>

      <div className="options-footer">
        <p className="version-info">DeepWiki++ v0.2.2</p>
        <p className="usage-info">
          The extension will switch between these hosts when you click the
          switch button in the popup.
        </p>
      </div>
    </div>
  );
}

export default IndexOptions;

// Mount the React component
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<IndexOptions />);
}
