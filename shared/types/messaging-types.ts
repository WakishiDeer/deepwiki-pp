/**
 * Shared types for messaging between extension components
 *
 * These types define the data transfer objects used for communication
 * without depending on application layer types.
 */

/**
 * Input data for adding a heading section via messaging
 */
export interface MessageAddHeadingSectionInput {
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
 * Input data for retrieving heading sections via messaging
 */
export interface MessageGetHeadingSectionsInput {
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
