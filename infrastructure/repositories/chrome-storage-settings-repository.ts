import {
  TabSwitchSettings,
  DEFAULT_SETTINGS,
} from "../../domain/entities/tab-switch-settings";
import { ISettingsPort } from "../../application/usecases/tab-switch";

export class ChromeStorageSettingsRepository implements ISettingsPort {
  async getSettings(): Promise<TabSwitchSettings> {
    try {
      if (!chrome?.storage?.sync) {
        console.warn("Chrome storage API not available");
        return DEFAULT_SETTINGS;
      }

      const result = await chrome.storage.sync.get(["host1", "host2"]);
      return {
        host1: result.host1 || DEFAULT_SETTINGS.host1,
        host2: result.host2 || DEFAULT_SETTINGS.host2,
      };
    } catch (error) {
      console.error("Error getting settings:", error);
      return DEFAULT_SETTINGS;
    }
  }

  async setSetting(key: keyof TabSwitchSettings, value: string): Promise<void> {
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
