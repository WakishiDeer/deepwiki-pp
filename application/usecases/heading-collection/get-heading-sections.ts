import {
  HeadingSection,
  IHeadingSectionRepository,
} from "../../../domain/heading-collection";

import { RepositoryError } from "../../../domain/shared";

/**
 * Input DTO for retrieving heading sections
 */
export interface GetHeadingSectionsInput {
  /** Optional filter by source URL */
  sourceUrl?: string;
  /** Optional filter by heading level */
  level?: number;
  /** Optional date range filter - start date */
  startDate?: Date;
  /** Optional date range filter - end date */
  endDate?: Date;
  /** Optional search text to filter by title content */
  searchText?: string;
  /** Whether to search in content HTML as well (default: false) */
  searchInContent?: boolean;
  /** Maximum number of sections to return (default: no limit) */
  limit?: number;
  /** Sort order for results */
  sortBy?: "addedAt" | "level" | "titleText" | "sourceUrl";
  /** Sort direction */
  sortOrder?: "asc" | "desc";
}

/**
 * Output DTO for retrieving heading sections
 */
export interface GetHeadingSectionsOutput {
  /** The retrieved heading sections */
  sections: HeadingSection[];
  /** Total count of sections that match the criteria (before limit) */
  totalCount: number;
  /** Indicates whether the operation was successful */
  success: true;
  /** Metadata about the query */
  metadata: {
    /** Whether any filters were applied */
    hasFilters: boolean;
    /** Whether results were limited */
    wasLimited: boolean;
    /** The applied sort criteria */
    sortBy?: string;
    sortOrder?: string;
  };
}

/**
 * Error response for retrieving heading sections
 */
export interface GetHeadingSectionsError {
  /** Indicates the operation failed */
  success: false;
  /** Error code for programmatic handling */
  errorCode: "INVALID_INPUT" | "REPOSITORY_ERROR" | "UNKNOWN_ERROR";
  /** Human-readable error message */
  message: string;
  /** Optional additional error details */
  details?: unknown;
}

/**
 * Union type for the result of retrieving heading sections
 */
export type GetHeadingSectionsResult =
  | GetHeadingSectionsOutput
  | GetHeadingSectionsError;

/**
 * Use case for retrieving heading sections from the collection
 *
 * This use case encapsulates the business logic for querying and filtering
 * heading sections from the repository. It supports various filtering and
 * sorting options to enable flexible section retrieval.
 *
 * Responsibilities:
 * - Validate input parameters
 * - Apply appropriate filtering strategies
 * - Sort and limit results as requested
 * - Handle repository errors gracefully
 * - Return structured results with metadata
 */
export class GetHeadingSectionsUseCase {
  constructor(private readonly repository: IHeadingSectionRepository) {}

  /**
   * Executes the use case to retrieve heading sections
   *
   * @param input - The filtering and sorting parameters
   * @returns Promise resolving to either success or error result
   */
  async execute(
    input: GetHeadingSectionsInput = {}
  ): Promise<GetHeadingSectionsResult> {
    try {
      // Step 1: Validate input
      this.validateInput(input);

      // Step 2: Retrieve sections based on filters
      let sections = await this.retrieveFilteredSections(input);

      // Step 3: Get total count before limiting
      const totalCount = sections.length;

      // Step 4: Apply sorting
      sections = this.applySorting(sections, input.sortBy, input.sortOrder);

      // Step 5: Apply limit if specified
      const wasLimited =
        input.limit !== undefined && sections.length > input.limit;
      if (input.limit !== undefined) {
        sections = sections.slice(0, input.limit);
      }

      // Step 6: Prepare metadata
      const hasFilters = this.hasAnyFilters(input);
      const metadata = {
        hasFilters,
        wasLimited,
        sortBy: input.sortBy,
        sortOrder: input.sortOrder,
      };

      // Step 7: Return success result
      return {
        success: true,
        sections,
        totalCount,
        metadata,
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
   * @throws Error if validation fails
   */
  private validateInput(input: GetHeadingSectionsInput): void {
    // Validate level if provided
    if (input.level !== undefined) {
      if (
        !Number.isInteger(input.level) ||
        input.level < 1 ||
        input.level > 6
      ) {
        throw new Error("Heading level must be an integer between 1 and 6");
      }
    }

    // Validate source URL if provided
    if (input.sourceUrl !== undefined) {
      if (
        typeof input.sourceUrl !== "string" ||
        input.sourceUrl.trim().length === 0
      ) {
        throw new Error("Source URL must be a non-empty string");
      }
      try {
        new URL(input.sourceUrl);
      } catch {
        throw new Error("Source URL must be a valid URL");
      }
    }

    // Validate date range if provided
    if (input.startDate !== undefined && !(input.startDate instanceof Date)) {
      throw new Error("Start date must be a Date object");
    }
    if (input.endDate !== undefined && !(input.endDate instanceof Date)) {
      throw new Error("End date must be a Date object");
    }
    if (input.startDate && input.endDate && input.startDate > input.endDate) {
      throw new Error("Start date must be before or equal to end date");
    }

    // Validate search text if provided
    if (
      input.searchText !== undefined &&
      typeof input.searchText !== "string"
    ) {
      throw new Error("Search text must be a string");
    }

    // Validate limit if provided
    if (input.limit !== undefined) {
      if (!Number.isInteger(input.limit) || input.limit < 1) {
        throw new Error("Limit must be a positive integer");
      }
    }

    // Validate sort parameters
    if (input.sortBy !== undefined) {
      const validSortFields = ["addedAt", "level", "titleText", "sourceUrl"];
      if (!validSortFields.includes(input.sortBy)) {
        throw new Error(
          `Sort field must be one of: ${validSortFields.join(", ")}`
        );
      }
    }
    if (input.sortOrder !== undefined) {
      if (!["asc", "desc"].includes(input.sortOrder)) {
        throw new Error('Sort order must be either "asc" or "desc"');
      }
    }
  }

  /**
   * Retrieves sections applying the specified filters
   *
   * @private
   * @param input - Filter parameters
   * @returns Promise resolving to filtered sections
   */
  private async retrieveFilteredSections(
    input: GetHeadingSectionsInput
  ): Promise<HeadingSection[]> {
    let sections: HeadingSection[];

    // Use repository's optimized filtering when possible
    if (input.sourceUrl) {
      sections = await this.repository.findSectionsByUrl(input.sourceUrl);
    } else if (input.level) {
      sections = await this.repository.findSectionsByLevel(input.level);
    } else if (input.startDate && input.endDate) {
      // Date range filtering: Get all sections and filter in-memory for now
      const allSections = await this.repository.getAllSections();
      sections = allSections.filter(
        (section) =>
          section.addedAt >= input.startDate! &&
          section.addedAt <= input.endDate!
      );
    } else if (input.searchText) {
      // Text search: Use the repository method if available, otherwise get all and filter
      sections = await this.repository.searchSectionsByTitle(input.searchText);
    } else {
      // No specific filters, get all sections
      sections = await this.repository.getAllSections();
    }

    // Apply additional client-side filters if multiple criteria are specified
    sections = this.applyAdditionalFilters(sections, input);

    return sections;
  }

  /**
   * Applies additional client-side filters for complex criteria
   *
   * @private
   * @param sections - Sections to filter
   * @param input - Filter criteria
   * @returns Filtered sections
   */
  private applyAdditionalFilters(
    sections: HeadingSection[],
    input: GetHeadingSectionsInput
  ): HeadingSection[] {
    let filtered = sections;

    // Apply source URL filter if not already applied at repository level
    if (input.sourceUrl && !this.wasRepositoryFiltered("sourceUrl", input)) {
      filtered = filtered.filter(
        (section) => section.sourceUrl === input.sourceUrl
      );
    }

    // Apply level filter if not already applied at repository level
    if (input.level && !this.wasRepositoryFiltered("level", input)) {
      filtered = filtered.filter((section) => section.level === input.level);
    }

    // Apply date range filter if not already applied at repository level
    if (
      (input.startDate || input.endDate) &&
      !this.wasRepositoryFiltered("dateRange", input)
    ) {
      filtered = filtered.filter((section) => {
        if (input.startDate && section.addedAt < input.startDate) return false;
        if (input.endDate && section.addedAt > input.endDate) return false;
        return true;
      });
    }

    // Apply search filter if not already applied at repository level
    if (input.searchText && !this.wasRepositoryFiltered("search", input)) {
      const searchTerm = input.searchText.toLowerCase();
      filtered = filtered.filter((section) => {
        const titleMatch = section.titleText.toLowerCase().includes(searchTerm);
        const contentMatch =
          input.searchInContent &&
          section.contentHtml.toLowerCase().includes(searchTerm);
        return titleMatch || contentMatch;
      });
    }

    return filtered;
  }

  /**
   * Determines if a specific filter was already applied at the repository level
   *
   * @private
   * @param filterType - The type of filter to check
   * @param input - The input parameters
   * @returns true if the filter was applied at repository level
   */
  private wasRepositoryFiltered(
    filterType: string,
    input: GetHeadingSectionsInput
  ): boolean {
    // Simple heuristic: if only one main filter is specified,
    // assume it was handled at repository level
    const filterCount = [
      input.sourceUrl,
      input.level,
      input.startDate && input.endDate,
      input.searchText,
    ].filter(Boolean).length;

    if (filterCount !== 1) return false;

    switch (filterType) {
      case "sourceUrl":
        return !!input.sourceUrl;
      case "level":
        return !!input.level;
      case "dateRange":
        return !!(input.startDate && input.endDate);
      case "search":
        return !!input.searchText;
      default:
        return false;
    }
  }

  /**
   * Applies sorting to the sections
   *
   * @private
   * @param sections - Sections to sort
   * @param sortBy - Field to sort by
   * @param sortOrder - Sort direction
   * @returns Sorted sections
   */
  private applySorting(
    sections: HeadingSection[],
    sortBy?: string,
    sortOrder: "asc" | "desc" = "desc"
  ): HeadingSection[] {
    if (!sortBy) {
      // Default sort by addedAt descending (newest first)
      return [...sections].sort(
        (a, b) => b.addedAt.getTime() - a.addedAt.getTime()
      );
    }

    return [...sections].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "addedAt":
          comparison = a.addedAt.getTime() - b.addedAt.getTime();
          break;
        case "level":
          comparison = a.level - b.level;
          break;
        case "titleText":
          comparison = a.titleText.localeCompare(b.titleText);
          break;
        case "sourceUrl":
          comparison = a.sourceUrl.localeCompare(b.sourceUrl);
          break;
        default:
          return 0;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  }

  /**
   * Checks if any filters are applied in the input
   *
   * @private
   * @param input - Input parameters to check
   * @returns true if any filters are applied
   */
  private hasAnyFilters(input: GetHeadingSectionsInput): boolean {
    return !!(
      input.sourceUrl ||
      input.level ||
      input.startDate ||
      input.endDate ||
      input.searchText ||
      input.limit
    );
  }

  /**
   * Handles and categorizes errors into structured error responses
   *
   * @private
   * @param error - The error to handle
   * @returns Structured error response
   */
  private handleError(error: unknown): GetHeadingSectionsError {
    // Input validation errors
    if (error instanceof Error && error.message.includes("must be")) {
      return {
        success: false,
        errorCode: "INVALID_INPUT",
        message: error.message,
      };
    }

    // Repository errors
    if (error instanceof RepositoryError) {
      return {
        success: false,
        errorCode: "REPOSITORY_ERROR",
        message: "Failed to retrieve sections from storage",
        details: { originalError: (error as Error).message },
      };
    }

    // Unknown errors
    return {
      success: false,
      errorCode: "UNKNOWN_ERROR",
      message: "An unexpected error occurred while retrieving sections",
      details: {
        originalError: error instanceof Error ? error.message : String(error),
      },
    };
  }
}
