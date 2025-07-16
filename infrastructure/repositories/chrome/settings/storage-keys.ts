/**
 * Storage keys for Chrome settings repository
 */

export const SETTINGS_STORAGE_KEYS = {
  HOST1: "host1",
  HOST2: "host2",
} as const;

export type SettingsStorageKey =
  (typeof SETTINGS_STORAGE_KEYS)[keyof typeof SETTINGS_STORAGE_KEYS];
