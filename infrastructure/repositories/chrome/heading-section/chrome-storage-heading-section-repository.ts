import {
  HeadingSection,
  IHeadingSectionRepository,
} from "../../../../domain/heading-collection";
import { Id, Result, RepositoryError } from "../../../../domain/shared";
import { SECTION_LIST_KEY } from "./storage-keys";
import { HeadingSectionStorageMapper } from "./storage-mapper";
import { StorageQuotaUtils } from "./quota-utils";
import { StorageValidationService } from "./validation-service";
import {
  ChromeStorageError,
  StorageQuotaExceededError,
  StorageUnavailableError,
} from "./errors";

/**
 * Chrome Storage implementation of IHeadingSectionRepository
 *
 * This repository implementation uses Chrome's storage API to persist
 * heading sections. It supports both local and sync storage modes,
 * with automatic serialization/deserialization of HeadingSection entities.
 *
 * Features:
 * - Persistent storage across browser sessions
 * - Optional sync across Chrome browsers (when using sync storage)
 * - Automatic data validation and error handling
 * - Quota management and error reporting
 */
export class ChromeStorageHeadingSectionRepository
  implements IHeadingSectionRepository
{
  private readonly storageKey = SECTION_LIST_KEY;
  private readonly useSync: boolean;

  /**
   * Creates a new ChromeStorageHeadingSectionRepository
   */
  constructor(options: { useSync?: boolean } = {}) {
    this.useSync = options.useSync ?? false; // Default to local storage for performance
  }

  /**
   * Gets the appropriate storage API based on configuration
   */
  private get storage(): chrome.storage.StorageArea {
    return StorageValidationService.getStorageArea(this.useSync);
  }

  /**
   * Retrieves all stored heading sections
   */
  async getAllSections(): Promise<HeadingSection[]> {
    try {
      console.log(
        "ChromeStorageRepository: Getting all sections from storage key:",
        this.storageKey
      );

      const result = await this.storage.get(this.storageKey);
      const sectionsData = result[this.storageKey];

      console.log("ChromeStorageRepository: Raw storage result:", result);
      console.log("ChromeStorageRepository: Sections data:", sectionsData);

      if (!sectionsData || !Array.isArray(sectionsData)) {
        console.log(
          "ChromeStorageRepository: No sections data found, returning empty array"
        );
        return [];
      }

      const deserializedSections =
        HeadingSectionStorageMapper.deserializeSections(sectionsData);
      console.log(
        `ChromeStorageRepository: Deserialized ${deserializedSections.length} sections`
      );

      return deserializedSections;
    } catch (error) {
      console.error(
        "ChromeStorageRepository: Error getting all sections:",
        error
      );
      throw new RepositoryError("Failed to retrieve sections from storage");
    }
  }

  /**
   * Retrieves a specific heading section by ID
   */
  async getSectionById(sectionId: Id): Promise<HeadingSection | null> {
    try {
      const allSections = await this.getAllSections();
      return (
        allSections.find((section) => section.sectionId === sectionId) || null
      );
    } catch (error) {
      throw new RepositoryError(
        `Failed to retrieve section with ID ${sectionId}`
      );
    }
  }

  /**
   * Adds a new heading section to storage
   */
  async addSection(section: HeadingSection): Promise<Result<void>> {
    console.log("ChromeStorageRepository: Adding section:", section);

    try {
      const existingSections = await this.getAllSections();
      console.log(
        `ChromeStorageRepository: Found ${existingSections.length} existing sections`
      );

      const updatedSections = [...existingSections, section];
      console.log(
        `ChromeStorageRepository: Will save ${updatedSections.length} sections total`
      );

      await this.saveSections(updatedSections);
      console.log("ChromeStorageRepository: Section added successfully");

      return Result.success(undefined);
    } catch (error) {
      console.error("ChromeStorageRepository: Error adding section:", error);
      return this.handleStorageError(error, "Failed to add section to storage");
    }
  }

  /**
   * Removes a heading section by ID
   */
  async removeSection(sectionId: Id): Promise<Result<boolean>> {
    console.log(
      "ChromeStorageRepository: Removing section with ID:",
      sectionId
    );

    try {
      const existingSections = await this.getAllSections();
      console.log(
        `ChromeStorageRepository: Found ${existingSections.length} existing sections`
      );

      const filteredSections = existingSections.filter(
        (s) => s.sectionId !== sectionId
      );

      if (filteredSections.length === existingSections.length) {
        console.log("ChromeStorageRepository: Section not found for removal");
        return Result.success(false); // Section not found
      }

      await this.saveSections(filteredSections);
      console.log(
        `ChromeStorageRepository: Section removed successfully. ${filteredSections.length} sections remaining`
      );

      return Result.success(true);
    } catch (error) {
      console.error("ChromeStorageRepository: Error removing section:", error);
      return this.handleStorageError(
        error,
        "Failed to remove section from storage"
      );
    }
  }

  /**
   * Removes multiple sections by IDs
   */
  async removeSections(sectionIds: Id[]): Promise<Result<number>> {
    try {
      const existingSections = await this.getAllSections();
      const idsSet = new Set(sectionIds);
      const filteredSections = existingSections.filter(
        (s) => !idsSet.has(s.sectionId || "")
      );

      const removedCount = existingSections.length - filteredSections.length;

      if (removedCount > 0) {
        await this.saveSections(filteredSections);
      }

      return Result.success(removedCount);
    } catch (error) {
      return this.handleStorageError(
        error,
        "Failed to remove sections from storage"
      );
    }
  }

  /**
   * Clears all heading sections from storage
   */
  async clearAllSections(): Promise<Result<void>> {
    try {
      await this.saveSections([]);
      return Result.success(undefined);
    } catch (error) {
      return this.handleStorageError(
        error,
        "Failed to clear all sections from storage"
      );
    }
  }

  /**
   * Finds sections by source URL
   */
  async findSectionsByUrl(sourceUrl: string): Promise<HeadingSection[]> {
    try {
      const allSections = await this.getAllSections();
      return allSections.filter((section) => section.sourceUrl === sourceUrl);
    } catch (error) {
      throw new RepositoryError(`Failed to find sections by URL: ${sourceUrl}`);
    }
  }

  /**
   * Finds sections by heading level
   */
  async findSectionsByLevel(level: number): Promise<HeadingSection[]> {
    try {
      const allSections = await this.getAllSections();
      return allSections.filter((section) => section.level === level);
    } catch (error) {
      throw new RepositoryError(`Failed to find sections by level: ${level}`);
    }
  }

  /**
   * Searches sections by title text
   */
  async searchSectionsByTitle(searchTerm: string): Promise<HeadingSection[]> {
    try {
      const allSections = await this.getAllSections();
      const lowerSearchTerm = searchTerm.toLowerCase();
      return allSections.filter((section) =>
        section.titleText.toLowerCase().includes(lowerSearchTerm)
      );
    } catch (error) {
      throw new RepositoryError(
        `Failed to search sections by title: ${searchTerm}`
      );
    }
  }

  /**
   * Gets sections with pagination
   */
  async getSectionsPage(
    offset: number,
    limit: number
  ): Promise<{
    sections: HeadingSection[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const allSections = await this.getAllSections();
      const total = allSections.length;
      const sections = allSections.slice(offset, offset + limit);
      const hasMore = offset + limit < total;

      return { sections, total, hasMore };
    } catch (error) {
      throw new RepositoryError("Failed to get sections page");
    }
  }

  /**
   * Updates an existing heading section
   */
  async updateSection(section: HeadingSection): Promise<Result<void>> {
    try {
      const existingSections = await this.getAllSections();
      const index = existingSections.findIndex(
        (s) => s.sectionId === section.sectionId
      );

      if (index === -1) {
        return Result.failure(
          new RepositoryError("Section not found for update")
        );
      }

      const updatedSections = [...existingSections];
      updatedSections[index] = section;

      await this.saveSections(updatedSections);
      return Result.success(undefined);
    } catch (error) {
      return this.handleStorageError(error, "Failed to update section");
    }
  }

  /**
   * Checks if a section exists by ID
   */
  async sectionExists(sectionId: Id): Promise<boolean> {
    try {
      const section = await this.getSectionById(sectionId);
      return section !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Gets the total count of stored sections
   */
  async getSectionCount(): Promise<number> {
    try {
      const allSections = await this.getAllSections();
      return allSections.length;
    } catch (error) {
      throw new RepositoryError("Failed to get section count");
    }
  }

  /**
   * Gets storage usage information
   */
  async getStorageInfo(): Promise<{
    sectionsCount: number;
    estimatedSize: number;
    maxSize: number;
    usagePercentage: number;
  }> {
    return StorageQuotaUtils.getStorageInfo(
      this.storage,
      this.storageKey,
      this.useSync
    );
  }

  /**
   * Validates storage integrity and repairs if necessary
   */
  async validateAndRepairStorage(): Promise<{
    isValid: boolean;
    repaired: boolean;
    errors: string[];
  }> {
    return StorageValidationService.validateAndRepairStorage(
      this.storage,
      this.storageKey
    );
  }

  /**
   * Private method to save sections to storage with validation
   */
  private async saveSections(sections: HeadingSection[]): Promise<void> {
    try {
      const serializedSections =
        HeadingSectionStorageMapper.serializeSections(sections);

      // Validate storage size before saving
      StorageQuotaUtils.validateStorageSize(serializedSections, this.useSync);

      await this.storage.set({ [this.storageKey]: serializedSections });
    } catch (error) {
      if (StorageQuotaUtils.isQuotaExceededError(error)) {
        throw new StorageQuotaExceededError(
          this.useSync ? "sync" : "local",
          0, // Size calculation could be added
          this.useSync ? 102400 : 5242880
        );
      }
      throw error;
    }
  }

  /**
   * Handles storage errors and converts them to appropriate Result types
   */
  private handleStorageError(error: any, fallbackMessage: string): Result<any> {
    if (error instanceof RepositoryError) {
      return Result.failure(error);
    }

    if (error instanceof ChromeStorageError) {
      return Result.failure(new RepositoryError(error.message));
    }

    if (StorageQuotaUtils.isQuotaExceededError(error)) {
      return Result.failure(new RepositoryError("Storage quota exceeded"));
    }

    return Result.failure(new RepositoryError(fallbackMessage));
  }
}
