import { HEADING_SELECTORS } from "./selectors.constants";

/**
 * DOM operation helper functions
 */
export class DomHelpers {
  /**
   * Normalizes text by removing extra whitespace
   * @param text - Text to normalize
   * @returns Normalized text
   */
  static normalizeText(text: string): string {
    return text.replace(/\s+/g, " ").trim();
  }

  /**
   * Validates whether an element has sufficient content
   * @param element - Element to validate
   * @param minHeadingCount - Minimum heading count (default: 3)
   * @param minTextLength - Minimum text length (default: 30)
   * @returns True if valid
   */
  static hasValidContent(
    element: Element,
    minHeadingCount = 3,
    minTextLength = 30
  ): boolean {
    const headings = element.querySelectorAll(HEADING_SELECTORS.join(","));
    const textLength = (element.textContent ?? "").trim().length;

    return (
      headings.length >= minHeadingCount ||
      (headings.length > 0 && textLength >= minTextLength)
    );
  }

  /**
   * Safely inserts an element
   * @param parent - Parent element
   * @param newElement - Element to insert
   * @param referenceElement - Reference element (insert after this)
   * @returns True if insertion succeeded
   */
  static safeInsertElement(
    parent: Node,
    newElement: Node,
    referenceElement?: Node
  ): boolean {
    try {
      if (referenceElement && referenceElement.nextSibling) {
        parent.insertBefore(newElement, referenceElement.nextSibling);
      } else {
        parent.appendChild(newElement);
      }
      return true;
    } catch (error) {
      console.error("DeepWiki++: Failed to insert element:", error);
      return false;
    }
  }

  /**
   * Safely removes an element
   * @param element - Element to remove
   * @returns True if removal succeeded
   */
  static safeRemoveElement(element: Element): boolean {
    try {
      element.remove();
      return true;
    } catch (error) {
      console.error("DeepWiki++: Failed to remove element:", error);
      return false;
    }
  }

  /**
   * Safely queries for elements matching a selector
   * @param selector - CSS selector
   * @param container - Search container (default: document)
   * @returns Found element, or null if not found
   */
  static safeQuerySelector(
    selector: string,
    container: Element | Document = document
  ): Element | null {
    try {
      return container.querySelector(selector);
    } catch (error) {
      console.error(`DeepWiki++: Invalid selector "${selector}":`, error);
      return null;
    }
  }

  /**
   * Safely queries for all elements matching a selector
   * @param selector - CSS selector
   * @param container - Search container (default: document)
   * @returns NodeList of found elements
   */
  static safeQuerySelectorAll(
    selector: string,
    container: Element | Document = document
  ): NodeListOf<Element> {
    try {
      return container.querySelectorAll(selector);
    } catch (error) {
      console.error(`DeepWiki++: Invalid selector "${selector}":`, error);
      return document.querySelectorAll(""); // Return empty NodeList
    }
  }

  /**
   * Safely sets an attribute on an element
   * @param element - Target element
   * @param attribute - Attribute name
   * @param value - Attribute value
   * @returns True if setting succeeded
   */
  static safeSetAttribute(
    element: Element,
    attribute: string,
    value: string
  ): boolean {
    try {
      element.setAttribute(attribute, value);
      return true;
    } catch (error) {
      console.error("DeepWiki++: Failed to set attribute:", error);
      return false;
    }
  }

  /**
   * Safely removes an attribute from an element
   * @param element - Target element
   * @param attribute - Attribute name
   * @returns True if removal succeeded
   */
  static safeRemoveAttribute(element: Element, attribute: string): boolean {
    try {
      element.removeAttribute(attribute);
      return true;
    } catch (error) {
      console.error("DeepWiki++: Failed to remove attribute:", error);
      return false;
    }
  }
}
