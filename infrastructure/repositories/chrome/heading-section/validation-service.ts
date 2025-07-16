import {
  serializeHeadingSection,
  isHeadingSection,
} from "../../../../domain/heading-collection";
import { RepositoryError } from "../../../../domain/shared";
import { HeadingSectionStorageMapper } from "./storage-mapper";

/**
 * Service for validating and repairing Chrome storage data integrity
 */
export class StorageValidationService {
  /**
   * Validates storage integrity and repairs if necessary
   */
  static async validateAndRepairStorage(
    storage: chrome.storage.StorageArea,
    storageKey: string
  ): Promise<{
    isValid: boolean;
    repaired: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    let repaired = false;

    try {
      const result = await storage.get(storageKey);
      const sectionsData = result[storageKey];

      // No data is valid
      if (sectionsData === undefined) {
        return { isValid: true, repaired: false, errors: [] };
      }

      // Check if data is in array format
      if (!HeadingSectionStorageMapper.isValidStorageData(sectionsData)) {
        errors.push("Storage data is not in valid format");
        await storage.set({ [storageKey]: [] });
        repaired = true;
        return { isValid: false, repaired, errors };
      }

      // Validate and repair individual sections
      const validSections: any[] = [];
      const originalCount = sectionsData.length;

      for (let i = 0; i < sectionsData.length; i++) {
        try {
          const section = HeadingSectionStorageMapper.deserializeSections([
            sectionsData[i],
          ])[0];
          if (section && isHeadingSection(section)) {
            validSections.push(serializeHeadingSection(section));
          } else {
            errors.push(`Invalid section at index ${i}`);
          }
        } catch (error) {
          errors.push(`Failed to validate section at index ${i}: ${error}`);
        }
      }

      // Repair if some sections were invalid
      if (validSections.length !== originalCount) {
        await storage.set({ [storageKey]: validSections });
        repaired = true;
      }

      return {
        isValid: errors.length === 0,
        repaired,
        errors,
      };
    } catch (error) {
      errors.push(`Storage validation failed: ${error}`);
      return { isValid: false, repaired: false, errors };
    }
  }

  /**
   * Checks if Chrome storage API is available
   */
  static isStorageAvailable(): boolean {
    return typeof chrome !== "undefined" && chrome.storage !== undefined;
  }

  /**
   * Gets the appropriate storage area based on configuration
   */
  static getStorageArea(useSync: boolean): chrome.storage.StorageArea {
    if (!this.isStorageAvailable()) {
      throw new RepositoryError("Chrome storage API not available");
    }
    return useSync ? chrome.storage.sync : chrome.storage.local;
  }
}
