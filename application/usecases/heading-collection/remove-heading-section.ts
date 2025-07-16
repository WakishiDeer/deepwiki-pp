import { IHeadingSectionRepository } from "../../../domain/heading-collection";
import { RepositoryError } from "../../../domain/shared";

/**
 * Input DTO for removing a heading section
 */
export interface RemoveHeadingSectionInput {
  /** The ID of the section to remove */
  sectionId: string;
}

/**
 * Output DTO for removing a heading section
 */
export interface RemoveHeadingSectionOutput {
  /** Indicates whether the operation was successful */
  success: true;
  /** The ID of the removed section */
  removedSectionId: string;
}

/**
 * Error response for removing a heading section
 */
export interface RemoveHeadingSectionError {
  /** Indicates the operation failed */
  success: false;
  /** Error code for programmatic handling */
  errorCode:
    | "INVALID_INPUT"
    | "SECTION_NOT_FOUND"
    | "REPOSITORY_ERROR"
    | "UNKNOWN_ERROR";
  /** Human-readable error message */
  message: string;
  /** Optional additional error details */
  details?: unknown;
}

/**
 * Union type for the result of removing a heading section
 */
export type RemoveHeadingSectionResult =
  | RemoveHeadingSectionOutput
  | RemoveHeadingSectionError;

/**
 * Use case for removing a heading section from the collection
 *
 * This use case encapsulates the business logic for removing an existing heading
 * section from the repository. It handles validation, existence checking, and
 * error management.
 *
 * Responsibilities:
 * - Validate input parameters
 * - Check if section exists before attempting removal
 * - Remove the section via repository
 * - Handle and categorize errors appropriately
 * - Return structured results for UI consumption
 */
export class RemoveHeadingSectionUseCase {
  constructor(private readonly repository: IHeadingSectionRepository) {}

  /**
   * Executes the use case to remove a heading section
   *
   * @param input - The input parameters containing section ID to remove
   * @returns Promise resolving to either success or error result
   */
  async execute(
    input: RemoveHeadingSectionInput
  ): Promise<RemoveHeadingSectionResult> {
    try {
      // Step 1: Validate input
      this.validateInput(input);

      // Step 2: Check if section exists
      const existingSection = await this.repository.getSectionById(
        input.sectionId
      );
      if (!existingSection) {
        return {
          success: false,
          errorCode: "SECTION_NOT_FOUND",
          message: `Section with ID '${input.sectionId}' not found`,
        };
      }

      // Step 3: Remove the section
      const removeResult = await this.repository.removeSection(input.sectionId);

      if (!removeResult.success || !removeResult.data) {
        return {
          success: false,
          errorCode: "REPOSITORY_ERROR",
          message: "Failed to remove section from repository",
          details: removeResult.success ? undefined : removeResult.error,
        };
      }

      // Step 4: Return success result
      return {
        success: true,
        removedSectionId: input.sectionId,
      };
    } catch (error) {
      return this.handleError(error, input.sectionId);
    }
  }

  /**
   * Validates the input parameters
   *
   * @param input - The input to validate
   * @throws Error if validation fails
   */
  private validateInput(input: RemoveHeadingSectionInput): void {
    if (!input.sectionId || typeof input.sectionId !== "string") {
      throw new Error("Section ID is required and must be a string");
    }

    if (input.sectionId.trim().length === 0) {
      throw new Error("Section ID cannot be empty");
    }
  }

  /**
   * Handles and categorizes errors appropriately
   *
   * @param error - The error that occurred
   * @param sectionId - The section ID that was being processed
   * @returns Categorized error result
   */
  private handleError(
    error: unknown,
    sectionId: string
  ): RemoveHeadingSectionError {
    console.error("Error in RemoveHeadingSectionUseCase:", error);

    // Handle validation errors
    if (error instanceof Error && error.message.includes("required")) {
      return {
        success: false,
        errorCode: "INVALID_INPUT",
        message: error.message,
        details: error,
      };
    }

    // Handle repository errors
    if (error instanceof RepositoryError) {
      return {
        success: false,
        errorCode: "REPOSITORY_ERROR",
        message: `Repository error while removing section '${sectionId}': ${error.message}`,
        details: error,
      };
    }

    // Handle unknown errors
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return {
      success: false,
      errorCode: "UNKNOWN_ERROR",
      message: `Failed to remove section '${sectionId}': ${errorMessage}`,
      details: error,
    };
  }
}
