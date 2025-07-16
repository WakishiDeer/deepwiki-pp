import {
  HeadingSection,
  IHeadingSectionRepository,
  serializeHeadingSection,
  deserializeHeadingSection,
  isHeadingSection,
} from "../../domain/heading-collection";

import {
  Id,
  Result,
  RepositoryError,
  ValidationError,
} from "../../domain/shared";

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
  private readonly storageKey = "deepwiki_heading_sections";
  private readonly useSync: boolean;
  private readonly maxStorageSize: number;

  /**
   * Creates a new ChromeStorageHeadingSectionRepository
   *
   * @param options Configuration options
   */
  constructor(
    options: {
      useSync?: boolean;
      maxStorageSize?: number;
    } = {}
  ) {
    this.useSync = options.useSync ?? false; // Default to local storage for performance
    this.maxStorageSize =
      options.maxStorageSize ?? (this.useSync ? 100 * 1024 : 5 * 1024 * 1024); // 100KB for sync, 5MB for local
  }

  /**
   * Gets the appropriate storage API based on configuration
   */
  private get storage(): chrome.storage.StorageArea {
    if (!chrome?.storage) {
      throw new RepositoryError("Chrome storage API not available");
    }
    return this.useSync ? chrome.storage.sync : chrome.storage.local;
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

      const deserializedSections = this.deserializeSections(sectionsData);
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
   * Adds a new heading section to storage
   */
  async addSection(section: HeadingSection): Promise<Result<void>> {
    console.log("ChromeStorageRepository: Adding section:", section);

    if (!isHeadingSection(section)) {
      console.error(
        "ChromeStorageRepository: Invalid section provided:",
        section
      );
      return Result.failure(
        new RepositoryError("Invalid HeadingSection provided")
      );
    }

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

      if (error instanceof RepositoryError) {
        return Result.failure(error);
      }

      // Check if it's a quota exceeded error
      if (error instanceof Error && error.message.includes("QUOTA_EXCEEDED")) {
        return Result.failure(
          new RepositoryError("Storage quota exceeded while adding section")
        );
      }

      return Result.failure(
        new RepositoryError("Failed to add section to storage")
      );
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
      return Result.failure(
        new RepositoryError("Failed to remove section from storage")
      );
    }
  }

  /**
   * Removes multiple sections by IDs
   */
  async removeSections(sectionIds: string[]): Promise<Result<number>> {
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
      return Result.failure(
        new RepositoryError("Failed to remove sections from storage")
      );
    }
  }

  /**
   * Clears all sections from storage
   */
  async clearAllSections(): Promise<Result<void>> {
    console.log("ChromeStorageRepository: Clearing all sections from storage");

    try {
      await this.storage.remove(this.storageKey);
      console.log("ChromeStorageRepository: All sections cleared successfully");
      return Result.success(undefined);
    } catch (error) {
      console.error("ChromeStorageRepository: Error clearing sections:", error);
      return Result.failure(
        new RepositoryError("Failed to clear sections from storage")
      );
    }
  }

  /**
   * Retrieves a specific heading section by ID
   */
  async getSectionById(sectionId: Id): Promise<HeadingSection | null> {
    const allSections = await this.getAllSections();
    return (
      allSections.find((section) => section.sectionId === sectionId) || null
    );
  }

  /**
   * Finds sections by source URL
   */
  async findSectionsByUrl(sourceUrl: string): Promise<HeadingSection[]> {
    const allSections = await this.getAllSections();
    return allSections.filter((section) => section.sourceUrl === sourceUrl);
  }

  /**
   * Finds sections by heading level
   */
  async findSectionsByLevel(level: number): Promise<HeadingSection[]> {
    const allSections = await this.getAllSections();
    return allSections.filter((section) => section.level === level);
  }

  /**
   * Searches sections by title text
   */
  async searchSectionsByTitle(searchTerm: string): Promise<HeadingSection[]> {
    const allSections = await this.getAllSections();
    return allSections.filter((section) =>
      section.titleText.toLowerCase().includes(searchTerm.toLowerCase())
    );
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
    const allSections = await this.getAllSections();
    const total = allSections.length;
    const sections = allSections.slice(offset, offset + limit);
    const hasMore = offset + limit < total;
    return { sections, total, hasMore };
  }

  /**
   * Checks if a section exists by ID
   */
  async sectionExists(sectionId: Id): Promise<boolean> {
    const section = await this.getSectionById(sectionId);
    return section !== null;
  }

  /**
   * Updates an existing section
   */
  async updateSection(section: HeadingSection): Promise<Result<void>> {
    if (!isHeadingSection(section)) {
      return Result.failure(
        new ValidationError("Invalid HeadingSection provided for update")
      );
    }

    try {
      const existingSections = await this.getAllSections();
      const sectionIndex = existingSections.findIndex(
        (s) => s.sectionId === section.sectionId
      );

      if (sectionIndex === -1) {
        return Result.failure(new RepositoryError("Section not found"));
      }

      existingSections[sectionIndex] = section;
      await this.saveSections(existingSections);
      return Result.success(undefined);
    } catch (error) {
      return Result.failure(
        new RepositoryError("Failed to update section in storage")
      );
    }
  }

  /**
   * Gets the total count of stored sections
   */
  async getSectionCount(): Promise<number> {
    const allSections = await this.getAllSections();
    return allSections.length;
  }

  /**
   * Retrieves sections within a date range
   */
  async getSectionsByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<HeadingSection[]> {
    const allSections = await this.getAllSections();
    return allSections.filter(
      (section) => section.addedAt >= startDate && section.addedAt <= endDate
    );
  }

  /**
   * Searches sections by text content
   */
  async searchSections(
    searchText: string,
    searchInContent: boolean = false
  ): Promise<HeadingSection[]> {
    const allSections = await this.getAllSections();
    const lowerSearchText = searchText.toLowerCase();

    return allSections.filter((section) => {
      const titleMatch = section.titleText
        .toLowerCase()
        .includes(lowerSearchText);
      const contentMatch =
        searchInContent &&
        section.contentHtml.toLowerCase().includes(lowerSearchText);
      return titleMatch || contentMatch;
    });
  }

  /**
   * Saves sections to storage with quota checking
   */
  private async saveSections(sections: HeadingSection[]): Promise<void> {
    console.log(
      `ChromeStorageRepository: Saving ${sections.length} sections to storage`
    );

    const serializedSections = sections.map((section) =>
      serializeHeadingSection(section)
    );
    const dataToStore = { [this.storageKey]: serializedSections };

    console.log(
      "ChromeStorageRepository: Serialized data to store:",
      dataToStore
    );

    // Estimate storage size (rough calculation)
    const estimatedSize = JSON.stringify(dataToStore).length;
    console.log(
      `ChromeStorageRepository: Estimated data size: ${estimatedSize} bytes (max: ${this.maxStorageSize})`
    );

    if (estimatedSize > this.maxStorageSize) {
      throw new RepositoryError(
        `Data size (${estimatedSize} bytes) exceeds maximum allowed (${this.maxStorageSize} bytes)`
      );
    }

    try {
      await this.storage.set(dataToStore);
      console.log(
        "ChromeStorageRepository: Data saved to storage successfully"
      );
    } catch (error) {
      console.error("ChromeStorageRepository: Error saving to storage:", error);
      if (error instanceof Error && error.message.includes("QUOTA_EXCEEDED")) {
        throw new RepositoryError("Chrome storage quota exceeded");
      }
      throw error;
    }
  }

  /**
   * Deserializes sections from storage data
   */
  private deserializeSections(sectionsData: any[]): HeadingSection[] {
    const validSections: HeadingSection[] = [];

    for (const sectionData of sectionsData) {
      try {
        const section = deserializeHeadingSection(sectionData);
        if (isHeadingSection(section)) {
          validSections.push(section);
        } else {
          console.warn(
            "Invalid section data found in storage, skipping:",
            sectionData
          );
        }
      } catch (error) {
        console.warn(
          "Failed to deserialize section, skipping:",
          sectionData,
          error
        );
      }
    }

    return validSections;
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
    try {
      const result = await this.storage.get(this.storageKey);
      const sectionsData = result[this.storageKey] || [];
      const estimatedSize = JSON.stringify(sectionsData).length;

      return {
        sectionsCount: Array.isArray(sectionsData) ? sectionsData.length : 0,
        estimatedSize,
        maxSize: this.maxStorageSize,
        usagePercentage: (estimatedSize / this.maxStorageSize) * 100,
      };
    } catch (error) {
      throw new RepositoryError("Failed to get storage information");
    }
  }

  /**
   * Validates storage integrity and repairs if necessary
   */
  async validateAndRepairStorage(): Promise<{
    isValid: boolean;
    repaired: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    let repaired = false;

    try {
      const result = await this.storage.get(this.storageKey);
      const sectionsData = result[this.storageKey];

      if (sectionsData === undefined) {
        return { isValid: true, repaired: false, errors: [] };
      }

      if (!Array.isArray(sectionsData)) {
        errors.push("Storage data is not an array");
        await this.storage.set({ [this.storageKey]: [] });
        repaired = true;
        return { isValid: false, repaired, errors };
      }

      const validSections: any[] = [];
      for (let i = 0; i < sectionsData.length; i++) {
        try {
          const section = deserializeHeadingSection(sectionsData[i]);
          if (isHeadingSection(section)) {
            validSections.push(serializeHeadingSection(section));
          } else {
            errors.push(`Invalid section at index ${i}`);
          }
        } catch (error) {
          errors.push(`Failed to deserialize section at index ${i}: ${error}`);
        }
      }

      if (validSections.length !== sectionsData.length) {
        await this.storage.set({ [this.storageKey]: validSections });
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
}
