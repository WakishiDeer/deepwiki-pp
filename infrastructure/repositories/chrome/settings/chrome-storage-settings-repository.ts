import {
  TabSwitchSettings,
  DEFAULT_SETTINGS,
} from "../../../../domain/tab-switching/tab-switch-settings";
import { ISettingsPort } from "../../../../application/usecases/tab-switch";
import { SETTINGS_STORAGE_KEYS } from "./storage-keys";
import { SettingsStorageError } from "./errors";

/**
 * Chrome Storage implementation of settings repository
 *
 * This repository handles tab switch settings persistence using Chrome's sync storage.
 * It provides fallback to default values when storage is unavailable or corrupted.
 */
export class ChromeStorageSettingsRepository implements ISettingsPort {
  /**
   * Retrieves tab switch settings from Chrome storage
   * Falls back to default settings if storage is unavailable
   */
  async getSettings(): Promise<TabSwitchSettings> {
    try {
      if (!this.isStorageAvailable()) {
        console.warn(
          "Chrome storage API not available, using default settings"
        );
        return DEFAULT_SETTINGS;
      }

      const keys = Object.values(SETTINGS_STORAGE_KEYS);
      const result = await chrome.storage.sync.get(keys);

      return {
        host1: result[SETTINGS_STORAGE_KEYS.HOST1] || DEFAULT_SETTINGS.host1,
        host2: result[SETTINGS_STORAGE_KEYS.HOST2] || DEFAULT_SETTINGS.host2,
      };
    } catch (error) {
      console.error("Error getting settings from storage:", error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Sets a specific setting value in Chrome storage
   */
  async setSetting(key: keyof TabSwitchSettings, value: string): Promise<void> {
    try {
      if (!this.isStorageAvailable()) {
        console.warn("Chrome storage API not available, cannot save setting");
        return;
      }

      this.validateSettingKey(key);
      this.validateSettingValue(value);

      await chrome.storage.sync.set({ [key]: value });
    } catch (error) {
      console.error("Error setting storage value:", error);
      throw new SettingsStorageError(`Failed to save setting ${key}: ${error}`);
    }
  }

  /**
   * Updates multiple settings at once
   */
  async setSettings(settings: Partial<TabSwitchSettings>): Promise<void> {
    try {
      if (!this.isStorageAvailable()) {
        console.warn("Chrome storage API not available, cannot save settings");
        return;
      }

      // Validate all settings before saving
      for (const [key, value] of Object.entries(settings)) {
        this.validateSettingKey(key as keyof TabSwitchSettings);
        this.validateSettingValue(value);
      }

      await chrome.storage.sync.set(settings);
    } catch (error) {
      console.error("Error setting storage values:", error);
      throw new SettingsStorageError(`Failed to save settings: ${error}`);
    }
  }

  /**
   * Resets settings to default values
   */
  async resetSettings(): Promise<void> {
    try {
      if (!this.isStorageAvailable()) {
        console.warn("Chrome storage API not available, cannot reset settings");
        return;
      }

      await chrome.storage.sync.set(DEFAULT_SETTINGS);
    } catch (error) {
      console.error("Error resetting settings:", error);
      throw new SettingsStorageError(`Failed to reset settings: ${error}`);
    }
  }

  /**
   * Checks if Chrome storage API is available
   */
  private isStorageAvailable(): boolean {
    return (
      typeof chrome !== "undefined" &&
      chrome.storage !== undefined &&
      chrome.storage.sync !== undefined
    );
  }

  /**
   * Validates that the setting key is valid
   */
  private validateSettingKey(key: string): void {
    const validKeys = Object.values(SETTINGS_STORAGE_KEYS);
    if (!validKeys.includes(key as any)) {
      throw new SettingsStorageError(`Invalid setting key: ${key}`);
    }
  }

  /**
   * Validates that the setting value is valid
   */
  private validateSettingValue(value: any): void {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new SettingsStorageError(
        `Setting value must be a non-empty string`
      );
    }
  }
}
