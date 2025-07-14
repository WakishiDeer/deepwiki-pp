import {
  HeadingSection,
  IHeadingSectionRepository,
  RepositoryError,
  StorageQuotaExceededError,
  InvalidSectionError,
  createHeadingSection,
  isHeadingSection,
} from "../../../domain/heading-collection";

/**
 * Input DTO for adding a heading section
 */
export interface AddHeadingSectionInput {
  /** The heading level (1-6) */
  level: number;
  /** The heading text content */
  title: string;
  /** Optional content HTML under this heading */
  content?: string;
  /** The source URL where this heading was found */
  sourceUrl: string;
  /** Optional custom section ID (if not provided, will be auto-generated) */
  id?: string;
}

/**
 * Output DTO for adding a heading section
 */
export interface AddHeadingSectionOutput {
  /** The ID of the successfully added section */
  sectionId: string;
  /** Indicates whether the operation was successful */
  success: true;
}

/**
 * Error response for adding a heading section
 */
export interface AddHeadingSectionError {
  /** Indicates the operation failed */
  success: false;
  /** Error code for programmatic handling */
  errorCode:
    | "INVALID_INPUT"
    | "STORAGE_QUOTA_EXCEEDED"
    | "REPOSITORY_ERROR"
    | "UNKNOWN_ERROR";
  /** Human-readable error message */
  message: string;
  /** Optional additional error details */
  details?: unknown;
}

/**
 * Union type for the result of adding a heading section
 */
export type AddHeadingSectionResult =
  | AddHeadingSectionOutput
  | AddHeadingSectionError;

/**
 * Validation errors for input parameters
 */
export class InputValidationError extends Error {
  constructor(message: string, public readonly field: string) {
    super(message);
    this.name = "InputValidationError";
  }
}

/**
 * Use case for adding a heading section to the collection
 *
 * This use case encapsulates the business logic for adding a new heading section
 * to the repository. It handles validation, entity creation, and error management.
 *
 * Responsibilities:
 * - Validate input parameters
 * - Create a valid HeadingSection entity
 * - Persist the section via repository
 * - Handle and categorize errors appropriately
 * - Return structured results for UI consumption
 */
export class AddHeadingSectionUseCase {
  constructor(private readonly repository: IHeadingSectionRepository) {}

  /**
   * Executes the use case to add a heading section
   *
   * @param input - The input parameters for creating a heading section
   * @returns Promise resolving to either success or error result
   */
  async execute(
    input: AddHeadingSectionInput
  ): Promise<AddHeadingSectionResult> {
    try {
      // Step 1: Validate input
      this.validateInput(input);

      // Step 2: Create heading section entity
      const section = this.createHeadingSection(input);

      // Step 3: Check if section already exists
      // Now sectionId is always present, so this check always runs
      const exists = await this.repository.sectionExists(section.sectionId);
      if (exists) {
        return {
          success: false,
          errorCode: "INVALID_INPUT",
          message: `A section with ID '${section.sectionId}' already exists`,
          details: { duplicateId: section.sectionId },
        };
      }

      // Step 4: Persist the section
      await this.repository.addSection(section);

      // Step 5: Return success result
      return {
        success: true,
        sectionId: section.sectionId,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Validates the input parameters
   *
   * @private
   * @param input - Input to validate
   * @throws InputValidationError if validation fails
   */
  private validateInput(input: AddHeadingSectionInput): void {
    // Validate level
    if (!Number.isInteger(input.level) || input.level < 1 || input.level > 6) {
      throw new InputValidationError(
        "Heading level must be an integer between 1 and 6",
        "level"
      );
    }

    // Validate title
    if (
      !input.title ||
      typeof input.title !== "string" ||
      input.title.trim().length === 0
    ) {
      throw new InputValidationError(
        "Title must be a non-empty string",
        "title"
      );
    }

    // Validate source URL
    if (!input.sourceUrl || typeof input.sourceUrl !== "string") {
      throw new InputValidationError(
        "Source URL must be a non-empty string",
        "sourceUrl"
      );
    }

    try {
      new URL(input.sourceUrl);
    } catch {
      throw new InputValidationError(
        "Source URL must be a valid URL",
        "sourceUrl"
      );
    }

    // Validate content if provided
    if (input.content !== undefined && typeof input.content !== "string") {
      throw new InputValidationError(
        "Content must be a string if provided",
        "content"
      );
    }

    // Validate custom ID if provided
    if (
      input.id !== undefined &&
      (typeof input.id !== "string" || input.id.trim().length === 0)
    ) {
      throw new InputValidationError(
        "Custom ID must be a non-empty string if provided",
        "id"
      );
    }
  }

  /**
   * Creates a HeadingSection entity from validated input
   *
   * @private
   * @param input - Validated input parameters
   * @returns HeadingSection entity
   * @throws Error if entity creation fails
   */
  private createHeadingSection(input: AddHeadingSectionInput): HeadingSection {
    const sectionData = {
      level: input.level,
      tagName: `H${input.level}`,
      titleText: input.title.trim(),
      contentHtml:
        input.content?.trim() ||
        `<h${input.level}>${input.title.trim()}</h${input.level}>`,
      sourceUrl: input.sourceUrl,
      // Use custom ID if provided
      ...(input.id && { sectionId: input.id.trim() }),
    };

    const section = createHeadingSection(sectionData);

    // Double-check with type guard
    if (!isHeadingSection(section)) {
      throw new Error("Failed to create valid HeadingSection entity");
    }

    return section;
  }

  /**
   * Handles and categorizes errors into structured error responses
   *
   * @private
   * @param error - The error to handle
   * @returns Structured error response
   */
  private handleError(error: unknown): AddHeadingSectionError {
    // Input validation errors
    if (error instanceof InputValidationError) {
      return {
        success: false,
        errorCode: "INVALID_INPUT",
        message: error.message,
        details: { field: error.field },
      };
    }

    // Storage quota exceeded
    if (error instanceof StorageQuotaExceededError) {
      return {
        success: false,
        errorCode: "STORAGE_QUOTA_EXCEEDED",
        message:
          "Storage quota exceeded. Please remove some sections and try again.",
        details: { originalError: error.message },
      };
    }

    // Invalid section errors
    if (error instanceof InvalidSectionError) {
      return {
        success: false,
        errorCode: "INVALID_INPUT",
        message: error.message,
        details: { originalError: error.message },
      };
    }

    // Repository errors
    if (error instanceof RepositoryError) {
      return {
        success: false,
        errorCode: "REPOSITORY_ERROR",
        message: "Failed to save section to storage",
        details: { originalError: error.message, cause: error.cause },
      };
    }

    // Unknown errors
    return {
      success: false,
      errorCode: "UNKNOWN_ERROR",
      message: "An unexpected error occurred while adding the section",
      details: {
        originalError: error instanceof Error ? error.message : String(error),
      },
    };
  }
}
