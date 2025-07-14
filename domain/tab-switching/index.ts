// Tab Switching Bounded Context
// Exports for tab switching and URL transformation functionality

// Entities
export * from "./entities/tab-switch-settings";

// Services
export * from "./services/transform-url";

// Re-exports for convenience
export type { TabSwitchSettings } from "./entities/tab-switch-settings";

export { DEFAULT_SETTINGS } from "./entities/tab-switch-settings";

export { transformUrl } from "./services/transform-url";
