/**
 * Tab Switch Settings Domain Entity
 * Configuration entity for tab switching between host pairs
 */

import { ValidationError } from "../shared";

export interface TabSwitchSettings {
  readonly host1: string;
  readonly host2: string;
}

export const DEFAULT_SETTINGS: TabSwitchSettings = {
  host1: "github.com",
  host2: "deepwiki.com",
};

/**
 * Factory function to create tab switch settings with validation
 */
export function createTabSwitchSettings(params: {
  host1: string;
  host2: string;
}): TabSwitchSettings {
  validateHost(params.host1, "host1");
  validateHost(params.host2, "host2");

  if (params.host1 === params.host2) {
    throw new ValidationError("host1 and host2 must be different");
  }

  return {
    host1: params.host1.trim().toLowerCase(),
    host2: params.host2.trim().toLowerCase(),
  };
}

/**
 * Type guard to check if an object is valid TabSwitchSettings
 */
export function isTabSwitchSettings(obj: any): obj is TabSwitchSettings {
  return (
    obj !== null &&
    obj !== undefined &&
    typeof obj === "object" &&
    typeof obj.host1 === "string" &&
    typeof obj.host2 === "string" &&
    obj.host1.trim().length > 0 &&
    obj.host2.trim().length > 0 &&
    obj.host1 !== obj.host2
  );
}

/**
 * Validates tab switch settings
 */
export function validateTabSwitchSettings(settings: TabSwitchSettings): void {
  validateHost(settings.host1, "host1");
  validateHost(settings.host2, "host2");

  if (settings.host1 === settings.host2) {
    throw new ValidationError("host1 and host2 must be different");
  }
}

/**
 * Updates tab switch settings with validation
 */
export function updateTabSwitchSettings(
  current: TabSwitchSettings,
  updates: Partial<Pick<TabSwitchSettings, "host1" | "host2">>
): TabSwitchSettings {
  const newSettings = {
    ...current,
    ...updates,
  };

  validateTabSwitchSettings(newSettings);
  return newSettings;
}

// Private validation helper
function validateHost(host: string, fieldName: string): void {
  if (!host || typeof host !== "string") {
    throw new ValidationError(`${fieldName} is required and must be a string`);
  }

  const trimmed = host.trim();
  if (trimmed.length === 0) {
    throw new ValidationError(`${fieldName} cannot be empty`);
  }

  // Basic hostname validation
  const hostPattern =
    /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!hostPattern.test(trimmed)) {
    throw new ValidationError(`${fieldName} must be a valid hostname`);
  }
}
