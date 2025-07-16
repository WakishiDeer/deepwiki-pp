import { RepositoryError } from "../../../../domain/shared";
import { STORAGE_CONFIG } from "./storage-keys";

/**
 * Utilities for managing Chrome storage quota and validation
 */
export class StorageQuotaUtils {
  /**
   * Validates if data size is within Chrome storage limits
   */
  static validateStorageSize(data: any[], useSync: boolean): void {
    const serializedData = JSON.stringify(data);
    const dataSize = new Blob([serializedData]).size;
    const config = useSync ? STORAGE_CONFIG.SYNC : STORAGE_CONFIG.LOCAL;

    if (dataSize > config.MAX_SIZE) {
      throw new RepositoryError(
        `Storage size (${dataSize} bytes) exceeds ${
          useSync ? "sync" : "local"
        } storage limit (${config.MAX_SIZE} bytes)`
      );
    }
  }

  /**
   * Checks if the error is a quota exceeded error
   */
  static isQuotaExceededError(error: any): boolean {
    return (
      error instanceof Error &&
      (error.message.includes("QUOTA_EXCEEDED") ||
        error.message.includes("quota exceeded"))
    );
  }

  /**
   * Gets storage usage information
   */
  static async getStorageInfo(
    storage: chrome.storage.StorageArea,
    storageKey: string,
    useSync: boolean
  ): Promise<{
    sectionsCount: number;
    estimatedSize: number;
    maxSize: number;
    usagePercentage: number;
  }> {
    try {
      const result = await storage.get(storageKey);
      const sectionsData = result[storageKey] || [];
      const estimatedSize = JSON.stringify(sectionsData).length;
      const config = useSync ? STORAGE_CONFIG.SYNC : STORAGE_CONFIG.LOCAL;

      return {
        sectionsCount: Array.isArray(sectionsData) ? sectionsData.length : 0,
        estimatedSize,
        maxSize: config.MAX_SIZE,
        usagePercentage: (estimatedSize / config.MAX_SIZE) * 100,
      };
    } catch (error) {
      throw new RepositoryError("Failed to get storage information");
    }
  }
}
