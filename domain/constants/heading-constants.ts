/**
 * Constants for heading section collection feature
 * Defines all supported heading tag levels for consistent processing
 */

/**
 * List of all heading tags that should be processed (H1 through H6)
 * Used for DOM querying and level validation throughout the application
 */
export const HEADING_TAGS: ReadonlyArray<string> = [
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
] as const;

/**
 * Minimum heading level (H1)
 */
export const MIN_HEADING_LEVEL = 1;

/**
 * Maximum heading level (H6)
 */
export const MAX_HEADING_LEVEL = 6;

/**
 * CSS selector string for querying all heading elements
 * Constructed from HEADING_TAGS for consistency
 */
export const HEADING_SELECTOR = HEADING_TAGS.map((tag) =>
  tag.toLowerCase()
).join(",");

/**
 * Validates if a given level number is a valid heading level
 * @param level - The heading level to validate
 * @returns true if the level is between 1 and 6 (inclusive)
 */
export function isValidHeadingLevel(level: number): boolean {
  return level >= MIN_HEADING_LEVEL && level <= MAX_HEADING_LEVEL;
}

/**
 * Extracts heading level number from a heading tag name
 * @param tagName - The HTML tag name (e.g., "H1", "H2")
 * @returns The numeric level (1-6) or null if invalid
 */
export function getHeadingLevelFromTag(tagName: string): number | null {
  const normalizedTag = tagName.toUpperCase();
  if (!HEADING_TAGS.includes(normalizedTag)) {
    return null;
  }

  const level = parseInt(normalizedTag.slice(1), 10);
  return isValidHeadingLevel(level) ? level : null;
}

/**
 * Converts a heading level number to its corresponding tag name
 * @param level - The heading level (1-6)
 * @returns The tag name (e.g., "H1", "H2") or null if invalid
 */
export function getTagNameFromLevel(level: number): string | null {
  return isValidHeadingLevel(level) ? `H${level}` : null;
}
