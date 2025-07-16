/**
 * Repository interface for heading sections
 */

import { HeadingSection } from "./heading-section";
import { Id, Result } from "../shared";

export interface IHeadingSectionRepository {
  /**
   * Retrieves all stored heading sections
   */
  getAllSections(): Promise<HeadingSection[]>;

  /**
   * Retrieves a specific heading section by ID
   */
  getSectionById(sectionId: Id): Promise<HeadingSection | null>;

  /**
   * Adds a new heading section to the repository
   */
  addSection(section: HeadingSection): Promise<Result<void>>;

  /**
   * Removes a heading section from the repository
   */
  removeSection(sectionId: Id): Promise<Result<boolean>>;

  /**
   * Removes multiple heading sections from the repository
   */
  removeSections(sectionIds: Id[]): Promise<Result<number>>;

  /**
   * Clears all heading sections from the repository
   */
  clearAllSections(): Promise<Result<void>>;

  /**
   * Finds sections by source URL
   */
  findSectionsByUrl(sourceUrl: string): Promise<HeadingSection[]>;

  /**
   * Finds sections by heading level
   */
  findSectionsByLevel(level: number): Promise<HeadingSection[]>;

  /**
   * Searches sections by title text
   */
  searchSectionsByTitle(searchTerm: string): Promise<HeadingSection[]>;

  /**
   * Gets sections with pagination
   */
  getSectionsPage(
    offset: number,
    limit: number
  ): Promise<{
    sections: HeadingSection[];
    total: number;
    hasMore: boolean;
  }>;

  /**
   * Updates an existing heading section
   */
  updateSection(section: HeadingSection): Promise<Result<void>>;

  /**
   * Checks if a section exists by ID
   */
  sectionExists(sectionId: Id): Promise<boolean>;

  /**
   * Gets the total count of stored sections
   */
  getSectionCount(): Promise<number>;
}
