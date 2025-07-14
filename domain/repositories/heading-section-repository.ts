import { HeadingSection } from "../entities/heading-section";

/**
 * Repository interface for managing heading sections
 *
 * This interface defines the contract for persisting and retrieving
 * heading sections. It follows the Repository pattern and enables
 * dependency inversion by allowing different storage implementations
 * (e.g., Chrome Storage, IndexedDB, in-memory) to be used interchangeably.
 */
export interface IHeadingSectionRepository {
  /**
   * Retrieves all stored heading sections
   *
   * @returns Promise resolving to an array of all heading sections
   *          Returns empty array if no sections are stored
   */
  getAllSections(): Promise<HeadingSection[]>;

  /**
   * Adds a new heading section to the repository
   *
   * @param section - The heading section to add
   * @returns Promise that resolves when the section is successfully stored
   * @throws Error if the section cannot be stored
   */
  addSection(section: HeadingSection): Promise<void>;

  /**
   * Removes a heading section from the repository
   *
   * @param sectionId - The unique identifier of the section to remove
   * @returns Promise resolving to true if section was found and removed,
   *          false if section was not found
   */
  removeSection(sectionId: string): Promise<boolean>;

  /**
   * Removes multiple heading sections from the repository
   *
   * @param sectionIds - Array of section IDs to remove
   * @returns Promise resolving to the number of sections actually removed
   */
  removeSections(sectionIds: string[]): Promise<number>;

  /**
   * Clears all heading sections from the repository
   *
   * @returns Promise that resolves when all sections are cleared
   */
  clearAllSections(): Promise<void>;

  /**
   * Retrieves heading sections from a specific source URL
   *
   * @param sourceUrl - The URL to filter sections by
   * @returns Promise resolving to an array of sections from the specified URL
   */
  getSectionsBySourceUrl(sourceUrl: string): Promise<HeadingSection[]>;

  /**
   * Retrieves heading sections with a specific heading level
   *
   * @param level - The heading level to filter by (1-6)
   * @returns Promise resolving to an array of sections with the specified level
   */
  getSectionsByLevel(level: number): Promise<HeadingSection[]>;

  /**
   * Checks if a section with the given ID already exists
   *
   * @param sectionId - The section ID to check
   * @returns Promise resolving to true if the section exists, false otherwise
   */
  sectionExists(sectionId: string): Promise<boolean>;

  /**
   * Updates an existing heading section
   *
   * @param sectionId - The ID of the section to update
   * @param updatedSection - The updated section data
   * @returns Promise resolving to true if section was found and updated,
   *          false if section was not found
   */
  updateSection(
    sectionId: string,
    updatedSection: HeadingSection
  ): Promise<boolean>;

  /**
   * Gets the total count of stored sections
   *
   * @returns Promise resolving to the number of stored sections
   */
  getSectionCount(): Promise<number>;

  /**
   * Retrieves sections added within a specific date range
   *
   * @param startDate - The start date (inclusive)
   * @param endDate - The end date (inclusive)
   * @returns Promise resolving to sections added within the date range
   */
  getSectionsByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<HeadingSection[]>;

  /**
   * Searches for sections containing specific text in their title or content
   *
   * @param searchText - The text to search for
   * @param searchInContent - Whether to search in content HTML (default: false)
   * @returns Promise resolving to matching sections
   */
  searchSections(
    searchText: string,
    searchInContent?: boolean
  ): Promise<HeadingSection[]>;
}

/**
 * Error types that can be thrown by repository implementations
 */
export class RepositoryError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = "RepositoryError";
  }
}

export class StorageQuotaExceededError extends RepositoryError {
  constructor(message: string = "Storage quota exceeded") {
    super(message);
    this.name = "StorageQuotaExceededError";
  }
}

export class SectionNotFoundError extends RepositoryError {
  constructor(sectionId: string) {
    super(`Section with ID '${sectionId}' not found`);
    this.name = "SectionNotFoundError";
  }
}

export class InvalidSectionError extends RepositoryError {
  constructor(message: string) {
    super(`Invalid section: ${message}`);
    this.name = "InvalidSectionError";
  }
}

/**
 * Repository events that implementations can emit
 * Useful for notifying UI components of data changes
 */
export interface RepositoryEvents {
  /**
   * Emitted when a new section is added
   */
  sectionAdded: { section: HeadingSection };

  /**
   * Emitted when a section is removed
   */
  sectionRemoved: { sectionId: string };

  /**
   * Emitted when a section is updated
   */
  sectionUpdated: { section: HeadingSection };

  /**
   * Emitted when all sections are cleared
   */
  allSectionsCleared: {};

  /**
   * Emitted when storage quota is approaching or exceeded
   */
  storageQuotaWarning: { usagePercentage: number };
}

/**
 * Optional interface for repositories that support event emission
 * Implementations can extend this to provide real-time updates
 */
export interface IHeadingSectionRepositoryWithEvents
  extends IHeadingSectionRepository {
  /**
   * Adds an event listener for repository events
   *
   * @param event - The event type to listen for
   * @param listener - The callback function
   */
  addEventListener<K extends keyof RepositoryEvents>(
    event: K,
    listener: (data: RepositoryEvents[K]) => void
  ): void;

  /**
   * Removes an event listener
   *
   * @param event - The event type
   * @param listener - The callback function to remove
   */
  removeEventListener<K extends keyof RepositoryEvents>(
    event: K,
    listener: (data: RepositoryEvents[K]) => void
  ): void;
}

/**
 * Configuration options for repository implementations
 */
export interface RepositoryOptions {
  /**
   * Maximum number of sections to store
   * Implementations should enforce this limit and remove oldest sections when exceeded
   */
  maxSections?: number;

  /**
   * Whether to automatically remove duplicate sections based on content
   */
  preventDuplicates?: boolean;

  /**
   * Storage key prefix for implementations that use key-value storage
   */
  storageKeyPrefix?: string;

  /**
   * Whether to compress stored data
   */
  enableCompression?: boolean;

  /**
   * Backup interval in milliseconds
   * For implementations that support automatic backups
   */
  backupInterval?: number;
}
