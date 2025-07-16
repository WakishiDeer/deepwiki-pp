/**
 * Interface for content finding
 *
 * Defines strategies for finding main content areas within pages
 */
export interface IContentFinder {
  /**
   * Finds the main content container
   * @returns Found container, or null if not found
   */
  find(): Element | null;

  /**
   * Validates whether an element is a valid content container
   * @param element - Element to validate
   * @returns True if valid
   */
  isValidContainer?(element: Element): boolean;
}
