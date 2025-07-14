/**
 * Domain entity representing a heading section extracted from a DeepWiki page
 *
 * A heading section consists of a heading element and all content that belongs to it,
 * up to the next heading of the same or higher level. This entity captures both
 * the structural information and the content itself for collection and display purposes.
 */
export interface HeadingSection {
  /**
   * The heading level as a number (1-6 corresponding to H1-H6)
   * Used for determining hierarchy and styling in the UI
   */
  readonly level: number;

  /**
   * The HTML tag name of the heading (e.g., "H1", "H2", "H3")
   * Derived from level but stored for convenience and consistency
   */
  readonly tagName: string;

  /**
   * The text content of the heading element
   * This is the visible title text without any HTML markup
   */
  readonly titleText: string;

  /**
   * The complete HTML content of this section
   * Includes the heading element itself and all content up to the next
   * heading of the same or higher level. This preserves the original
   * formatting and structure of the content.
   */
  readonly contentHtml: string;

  /**
   * The URL of the source page where this section was extracted from
   * Used for reference, navigation back to source, and preventing duplicates
   */
  readonly sourceUrl: string;

  /**
   * Timestamp when this section was added to the collection
   * Used for sorting and organizing sections chronologically
   */
  readonly addedAt: Date;

  /**
   * Unique identifier for this section
   * Always generated to ensure uniqueness across collections
   */
  readonly sectionId: string;
}

/**
 * Generates a unique section ID based on content and timestamp
 * @private
 */
function generateUniqueSectionId(params: {
  sourceUrl: string;
  level: number;
  titleText: string;
}): string {
  try {
    const url = new URL(params.sourceUrl);
    const hostname = url.hostname
      .replace(/^www\./, "") // Remove www prefix
      .replace(/[^\w-]/g, "-") // Replace non-alphanumeric with hyphen
      .toLowerCase();

    // Create URL-safe slug from title
    const titleSlug = params.titleText
      .trim()
      .toLowerCase()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
      .substring(0, 30); // Limit length

    // Add timestamp and random component for absolute uniqueness
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);

    return `${hostname}-h${params.level}-${titleSlug}-${timestamp}-${random}`;
  } catch (error) {
    // Fallback for invalid URLs
    const fallbackSlug = params.sourceUrl
      .replace(/[^\w-]/g, "-")
      .substring(0, 20);
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);

    return `${fallbackSlug}-h${params.level}-${timestamp}-${random}`;
  }
}

/**
 * Factory function to create a new HeadingSection instance
 * Provides validation and ensures all required fields are properly set
 *
 * @param params - The parameters to create a heading section
 * @returns A new HeadingSection instance
 * @throws Error if validation fails
 */
export function createHeadingSection(params: {
  level: number;
  tagName: string;
  titleText: string;
  contentHtml: string;
  sourceUrl: string;
  sectionId?: string;
}): HeadingSection {
  // Validate heading level
  if (!Number.isInteger(params.level) || params.level < 1 || params.level > 6) {
    throw new Error(
      `Invalid heading level: ${params.level}. Must be an integer between 1 and 6.`
    );
  }

  // Validate that tagName matches level
  const expectedTagName = `H${params.level}`;
  if (params.tagName.toUpperCase() !== expectedTagName) {
    throw new Error(
      `Tag name "${params.tagName}" does not match level ${params.level}. Expected "${expectedTagName}".`
    );
  }

  // Validate required string fields
  if (!params.titleText.trim()) {
    throw new Error("titleText cannot be empty");
  }

  if (!params.contentHtml.trim()) {
    throw new Error("contentHtml cannot be empty");
  }

  if (!params.sourceUrl.trim()) {
    throw new Error("sourceUrl cannot be empty");
  }

  // Validate URL format
  try {
    new URL(params.sourceUrl);
  } catch {
    throw new Error(`Invalid sourceUrl format: ${params.sourceUrl}`);
  }

  // Generate or validate sectionId
  const sectionId =
    params.sectionId?.trim() ||
    generateUniqueSectionId({
      sourceUrl: params.sourceUrl,
      level: params.level,
      titleText: params.titleText.trim(),
    });

  return {
    level: params.level,
    tagName: params.tagName.toUpperCase(),
    titleText: params.titleText.trim(),
    contentHtml: params.contentHtml,
    sourceUrl: params.sourceUrl,
    addedAt: new Date(),
    sectionId: sectionId,
  };
}

/**
 * Type guard to check if an object is a valid HeadingSection
 * Useful for runtime validation of data from storage or network
 *
 * @param obj - The object to check
 * @returns true if the object is a valid HeadingSection
 */
export function isHeadingSection(obj: any): obj is HeadingSection {
  return (
    obj !== null &&
    obj !== undefined &&
    typeof obj === "object" &&
    typeof obj.level === "number" &&
    obj.level >= 1 &&
    obj.level <= 6 &&
    typeof obj.tagName === "string" &&
    typeof obj.titleText === "string" &&
    typeof obj.contentHtml === "string" &&
    typeof obj.sourceUrl === "string" &&
    obj.addedAt instanceof Date &&
    typeof obj.sectionId === "string" // Now required
  );
}

/**
 * Serializes a HeadingSection for storage or transmission
 * Converts Date objects to ISO strings for JSON compatibility
 *
 * @param section - The HeadingSection to serialize
 * @returns A serializable object
 */
export function serializeHeadingSection(
  section: HeadingSection
): Record<string, any> {
  return {
    level: section.level,
    tagName: section.tagName,
    titleText: section.titleText,
    contentHtml: section.contentHtml,
    sourceUrl: section.sourceUrl,
    addedAt: section.addedAt.toISOString(),
    sectionId: section.sectionId,
  };
}

/**
 * Deserializes a HeadingSection from stored data
 * Converts ISO date strings back to Date objects
 *
 * @param data - The serialized data
 * @returns A HeadingSection instance
 * @throws Error if deserialization fails
 */
export function deserializeHeadingSection(data: any): HeadingSection {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid data for HeadingSection deserialization");
  }

  // Validate required fields
  const requiredFields = [
    "level",
    "tagName",
    "titleText",
    "contentHtml",
    "sourceUrl",
    "addedAt",
    "sectionId",
  ];
  for (const field of requiredFields) {
    if (!(field in data)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate field types
  if (
    typeof data.level !== "number" ||
    !Number.isInteger(data.level) ||
    data.level < 1 ||
    data.level > 6
  ) {
    throw new Error(`Invalid level: ${data.level}`);
  }

  if (typeof data.sectionId !== "string" || !data.sectionId.trim()) {
    throw new Error(`Invalid sectionId: ${data.sectionId}`);
  }

  // Parse date
  const addedAt = new Date(data.addedAt);
  if (isNaN(addedAt.getTime())) {
    throw new Error(`Invalid date: ${data.addedAt}`);
  }

  return {
    level: data.level,
    tagName: data.tagName,
    titleText: data.titleText,
    contentHtml: data.contentHtml,
    sourceUrl: data.sourceUrl,
    addedAt: addedAt,
    sectionId: data.sectionId,
  };
}
