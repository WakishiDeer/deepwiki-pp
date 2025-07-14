import { IHeadingSectionRepository } from "../../../domain/heading-collection";
import { RepositoryError } from "../../../domain/shared";

/**
 * Input DTO for clearing all heading sections
 */
export interface ClearAllHeadingSectionsInput {
  // No specific input required for clearing all sections
  // This interface is kept for consistency and future extensibility
}

/**
 * Output DTO for clearing all heading sections
 */
export interface ClearAllHeadingSectionsOutput {
  /** Indicates whether the operation was successful */
  success: true;
  /** The number of sections that were cleared */
  clearedCount: number;
}

/**
 * Error response for clearing all heading sections
 */
export interface ClearAllHeadingSectionsError {
  /** Indicates the operation failed */
  success: false;
  /** Error code for programmatic handling */
  errorCode: "REPOSITORY_ERROR" | "UNKNOWN_ERROR";
  /** Human-readable error message */
  message: string;
  /** Optional additional error details */
  details?: unknown;
}

/**
 * Union type for the result of clearing all heading sections
 */
export type ClearAllHeadingSectionsResult =
  | ClearAllHeadingSectionsOutput
  | ClearAllHeadingSectionsError;

/**
 * Use case for clearing all heading sections from the collection
 *
 * This use case encapsulates the business logic for removing all heading
 * sections from the repository. It handles counting existing sections before
 * clearing and provides feedback on the operation.
 *
 * Responsibilities:
 * - Count existing sections for reporting
 * - Clear all sections via repository
 * - Handle and categorize errors appropriately
 * - Return structured results for UI consumption
 */
export class ClearAllHeadingSectionsUseCase {
  constructor(private readonly repository: IHeadingSectionRepository) {}

  /**
   * Executes the use case to clear all heading sections
   *
   * @param input - Optional input parameters (currently unused but kept for consistency)
   * @returns Promise resolving to either success or error result
   */
  async execute(
    input: ClearAllHeadingSectionsInput = {}
  ): Promise<ClearAllHeadingSectionsResult> {
    try {
      // Step 1: Get count of sections before clearing for reporting
      const sectionsBeforeClear = await this.repository.getAllSections();
      const countBeforeClear = sectionsBeforeClear.length;

      // Step 2: Clear all sections
      const clearResult = await this.repository.clearAllSections();

      if (!clearResult.success) {
        return {
          success: false,
          errorCode: "REPOSITORY_ERROR",
          message: "Failed to clear sections from repository",
          details: clearResult.error,
        };
      }

      // Step 3: Return success result with count
      return {
        success: true,
        clearedCount: countBeforeClear,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Handles and categorizes errors appropriately
   *
   * @param error - The error that occurred
   * @returns Categorized error result
   */
  private handleError(error: unknown): ClearAllHeadingSectionsError {
    console.error("Error in ClearAllHeadingSectionsUseCase:", error);

    // Handle repository errors
    if (error instanceof RepositoryError) {
      return {
        success: false,
        errorCode: "REPOSITORY_ERROR",
        message: `Repository error while clearing sections: ${error.message}`,
        details: error,
      };
    }

    // Handle unknown errors
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return {
      success: false,
      errorCode: "UNKNOWN_ERROR",
      message: `Failed to clear all sections: ${errorMessage}`,
      details: error,
    };
  }
}
