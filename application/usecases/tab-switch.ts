import {
  transformUrl,
  HostPair,
} from "../../domain/tab-switching/transform-url";
import { TabSwitchSettings } from "../../domain/tab-switching/tab-switch-settings";

export interface ISettingsPort {
  getSettings(): Promise<TabSwitchSettings>;
  setSetting(key: keyof TabSwitchSettings, value: string): Promise<void>;
}

export class TabSwitchUseCase {
  constructor(private settingsPort: ISettingsPort) {}

  async canSwitchUrl(url: string): Promise<boolean> {
    try {
      const settings = await this.settingsPort.getSettings();
      const parsedUrl = new URL(url);
      return (
        parsedUrl.hostname === settings.host1 ||
        parsedUrl.hostname === settings.host2
      );
    } catch (error) {
      console.error("Error checking URL:", error);
      return false;
    }
  }

  async transformUrl(url: string): Promise<string | null> {
    try {
      const settings = await this.settingsPort.getSettings();
      return transformUrl(url, [
        { host1: settings.host1, host2: settings.host2 },
      ]);
    } catch (error) {
      console.error("Error transforming URL:", error);
      return null;
    }
  }
}
