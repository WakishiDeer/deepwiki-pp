import { IContentFinder } from "../interfaces/content-finder.interface";
import { CONTENT_SELECTORS } from "../utils/selectors.constants";
import { DomHelpers } from "../utils/dom-helpers";

/**
 * Content container finder strategy class
 *
 * Tries multiple selectors in priority order to find
 * the optimal content container
 */
export class ContentContainerFinder implements IContentFinder {
  private readonly minHeadingCount = 3;
  private readonly minTextLength = 30;

  /**
   * Finds the main content container
   * @returns Found container, or null if not found
   */
  find(): Element | null {
    // Try selectors in priority order
    for (const selector of CONTENT_SELECTORS) {
      const container = DomHelpers.safeQuerySelector(selector);
      if (container && this.isValidContainer(container)) {
        console.debug(
          `DeepWiki++: Found content container using selector: ${selector}`
        );
        return container;
      }
    }

    // Fallback: Find element with sufficient content
    const fallbackContainer = this.findFallbackContainer();
    if (fallbackContainer) {
      console.warn(
        "DeepWiki++: Using fallback container",
        fallbackContainer.tagName
      );
      return fallbackContainer;
    }

    console.warn(
      "DeepWiki++: No suitable content container found, using document.body"
    );
    return document.body;
  }

  /**
   * Validates whether a container is valid
   * @param element - Element to validate
   * @returns True if valid
   */
  isValidContainer(element: Element): boolean {
    const isValid = DomHelpers.hasValidContent(
      element,
      this.minHeadingCount,
      this.minTextLength
    );

    console.debug("DeepWiki++: Content container validation", {
      selector: element.tagName,
      headingCount: element.querySelectorAll("h1,h2,h3,h4,h5,h6").length,
      textLength: (element.textContent ?? "").trim().length,
      isValid,
    });

    return isValid;
  }

  /**
   * Finds a fallback container
   * @returns Found container, or null if not found
   */
  private findFallbackContainer(): Element | null {
    // Find elements with sufficient content among all elements
    const candidates = DomHelpers.safeQuerySelectorAll("main, article, div");

    for (const candidate of candidates) {
      if (this.isValidContainer(candidate)) {
        return candidate;
      }
    }

    return null;
  }
}
