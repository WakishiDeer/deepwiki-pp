/**
 * Settings-specific error types for Chrome storage
 */

export class SettingsStorageError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'SettingsStorageError';
  }
}

export class SettingsValidationError extends SettingsStorageError {
  constructor(setting: string, value: any) {
    super(`Invalid setting value for ${setting}: ${value}`);
    this.name = 'SettingsValidationError';
  }
}
