/**
 * Heading Section Domain Entity
 * Consolidated implementation with entity, factory, validation, and serialization
 */

import { ValidationError, Id, HtmlContent, Url, generateId } from "../shared";

/**
 * Constants for heading section collection feature
 */
export const HEADING_TAGS: ReadonlyArray<string> = [
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
] as const;

export const MIN_HEADING_LEVEL = 1;
export const MAX_HEADING_LEVEL = 6;

export const HEADING_SELECTOR = HEADING_TAGS.map((tag) =>
  tag.toLowerCase()
).join(",");

/**
 * Domain entity representing a heading section extracted from a DeepWiki page
 */
export interface HeadingSection {
  readonly level: number;
  readonly tagName: string;
  readonly titleText: string;
  readonly contentHtml: HtmlContent;
  readonly sourceUrl: Url;
  readonly addedAt: Date;
  readonly sectionId: Id;
}

/**
 * Factory function to create a new HeadingSection instance
 */
export function createHeadingSection(params: {
  level: number;
  tagName: string;
  titleText: string;
  contentHtml: HtmlContent;
  sourceUrl: Url;
  sectionId?: Id;
}): HeadingSection {
  // Validation
  validateHeadingLevel(params.level);
  validateTagName(params.tagName, params.level);
  validateRequiredFields(params);

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
    typeof obj.sectionId === "string"
  );
}

/**
 * Serializes a HeadingSection for storage or transmission
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
 */
export function deserializeHeadingSection(data: any): HeadingSection {
  if (!data || typeof data !== "object") {
    throw new ValidationError(
      "Invalid data for HeadingSection deserialization"
    );
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
      throw new ValidationError(`Missing required field: ${field}`);
    }
  }

  // Validate field types
  if (
    typeof data.level !== "number" ||
    !Number.isInteger(data.level) ||
    data.level < 1 ||
    data.level > 6
  ) {
    throw new ValidationError(`Invalid level: ${data.level}`);
  }

  if (typeof data.sectionId !== "string" || !data.sectionId.trim()) {
    throw new ValidationError(`Invalid sectionId: ${data.sectionId}`);
  }

  // Parse date
  const addedAt = new Date(data.addedAt);
  if (isNaN(addedAt.getTime())) {
    throw new ValidationError(`Invalid date: ${data.addedAt}`);
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

/**
 * Validates if a given level number is a valid heading level
 */
export function isValidHeadingLevel(level: number): boolean {
  return level >= MIN_HEADING_LEVEL && level <= MAX_HEADING_LEVEL;
}

/**
 * Extracts heading level number from a heading tag name
 */
export function getHeadingLevelFromTag(tagName: string): number | null {
  const match = tagName.toUpperCase().match(/^H([1-6])$/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Creates a heading tag name from a level number
 */
export function createHeadingTag(level: number): string {
  if (!isValidHeadingLevel(level)) {
    throw new ValidationError(`Invalid heading level: ${level}`);
  }
  return `H${level}`;
}

// Private validation functions
function validateHeadingLevel(level: number): void {
  if (!isValidHeadingLevel(level)) {
    throw new ValidationError(
      `Invalid heading level: ${level}. Must be between ${MIN_HEADING_LEVEL} and ${MAX_HEADING_LEVEL}`
    );
  }
}

function validateTagName(tagName: string, level: number): void {
  const expectedTag = `H${level}`;
  if (tagName.toUpperCase() !== expectedTag) {
    throw new ValidationError(
      `Tag name ${tagName} doesn't match level ${level}. Expected ${expectedTag}`
    );
  }
}

function validateRequiredFields(params: {
  titleText: string;
  contentHtml: string;
  sourceUrl: string;
}): void {
  if (!params.titleText?.trim()) {
    throw new ValidationError("Title text is required");
  }
  if (!params.contentHtml?.trim()) {
    throw new ValidationError("Content HTML is required");
  }
  if (!params.sourceUrl?.trim()) {
    throw new ValidationError("Source URL is required");
  }

  // Basic URL validation
  try {
    new URL(params.sourceUrl);
  } catch {
    throw new ValidationError(`Invalid source URL: ${params.sourceUrl}`);
  }
}

function generateUniqueSectionId(params: {
  sourceUrl: string;
  level: number;
  titleText: string;
}): string {
  try {
    const url = new URL(params.sourceUrl);
    const hostname = url.hostname
      .replace(/^www\./, "")
      .replace(/[^\w-]/g, "-")
      .toLowerCase();

    const titleSlug = params.titleText
      .trim()
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 30);

    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);

    return `${hostname}-h${params.level}-${titleSlug}-${timestamp}-${random}`;
  } catch (error) {
    const fallbackSlug = params.sourceUrl
      .replace(/[^\w-]/g, "-")
      .substring(0, 20);
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);

    return `${fallbackSlug}-h${params.level}-${timestamp}-${random}`;
  }
}
