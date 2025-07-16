/**
 * Tab Switching Bounded Context
 * Public API for tab switching and URL transformation functionality
 */

// Core entity and factory
export type { TabSwitchSettings } from "./tab-switch-settings";
export {
  DEFAULT_SETTINGS,
  createTabSwitchSettings,
  validateTabSwitchSettings,
  isTabSwitchSettings,
  updateTabSwitchSettings,
} from "./tab-switch-settings";

// URL transformation service
export type { HostPair } from "./transform-url";
export {
  transformUrl,
  canTransformUrl,
  getSupportedHosts,
} from "./transform-url";
