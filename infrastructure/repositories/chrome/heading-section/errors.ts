/**
 * Chrome storage specific error types
 */

export class ChromeStorageError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = "ChromeStorageError";
  }
}

export class StorageQuotaExceededError extends ChromeStorageError {
  constructor(storageType: "sync" | "local", size: number, limit: number) {
    super(`${storageType} storage quota exceeded: ${size}/${limit} bytes`);
    this.name = "StorageQuotaExceededError";
  }
}

export class StorageUnavailableError extends ChromeStorageError {
  constructor() {
    super("Chrome storage API is not available");
    this.name = "StorageUnavailableError";
  }
}

export class StorageSerializationError extends ChromeStorageError {
  constructor(message: string, cause?: Error) {
    super(`Serialization error: ${message}`, cause);
    this.name = "StorageSerializationError";
  }
}
