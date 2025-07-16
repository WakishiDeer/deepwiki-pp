import { HeadingSection } from "../../../../domain/heading-collection";
import { BUTTON_CONSTANTS } from "../utils/button-styles";
import { DomHelpers } from "../utils/dom-helpers";

/**
 * Heading element finder strategy class
 *
 * Finds DOM elements corresponding to HeadingSections
 */
export class HeadingElementFinder {
  private readonly sectionDataAttribute =
    BUTTON_CONSTANTS.SECTION_DATA_ATTRIBUTE;

  /**
   * Finds DOM element corresponding to a heading section
   * @param section - Target heading section to find
   * @param index - Section index
   * @returns Found element, or null if not found
   */
  find(section: HeadingSection, index: number): Element | null {
    const headingSelector = `h${section.level}`;
    const headings = DomHelpers.safeQuerySelectorAll(headingSelector);

    console.debug(
      `DeepWiki++: Looking for heading "${section.titleText}" with selector "${headingSelector}"`
    );
    console.debug(
      `DeepWiki++: Found ${headings.length} headings of level ${section.level}`
    );

    // 1. Try exact match
    const exactMatch = this.findExactMatch(headings, section, index);
    if (exactMatch) return exactMatch;

    // 2. Try normalized match
    const normalizedMatch = this.findNormalizedMatch(headings, section, index);
    if (normalizedMatch) return normalizedMatch;

    // 3. Try partial match
    const partialMatch = this.findPartialMatch(headings, section, index);
    if (partialMatch) return partialMatch;

    // 4. Try index match (fallback)
    const indexMatch = this.findIndexMatch(headings, section, index);
    if (indexMatch) return indexMatch;

    console.warn(
      `DeepWiki++: Could not find heading element for section: "${section.titleText}"`
    );
    console.warn(
      `DeepWiki++: Available headings at level ${section.level}:`,
      Array.from(headings).map((h) => h.textContent?.trim())
    );

    return null;
  }

  /**
   * Finds heading element by exact match
   */
  private findExactMatch(
    headings: NodeListOf<Element>,
    section: HeadingSection,
    index: number
  ): Element | null {
    for (const heading of headings) {
      const headingText = heading.textContent?.trim() || "";

      if (headingText === section.titleText) {
        console.debug(
          `DeepWiki++: Found exact match for "${section.titleText}"`
        );
        DomHelpers.safeSetAttribute(
          heading,
          this.sectionDataAttribute,
          index.toString()
        );
        return heading;
      }
    }
    return null;
  }

  /**
   * Finds heading element by normalized match
   */
  private findNormalizedMatch(
    headings: NodeListOf<Element>,
    section: HeadingSection,
    index: number
  ): Element | null {
    const normalizedSectionTitle = DomHelpers.normalizeText(section.titleText);

    for (const heading of headings) {
      const headingText = heading.textContent?.trim() || "";
      const normalizedHeadingText = DomHelpers.normalizeText(headingText);

      if (normalizedHeadingText === normalizedSectionTitle) {
        console.debug(
          `DeepWiki++: Found normalized match for "${section.titleText}"`
        );
        DomHelpers.safeSetAttribute(
          heading,
          this.sectionDataAttribute,
          index.toString()
        );
        return heading;
      }
    }
    return null;
  }

  /**
   * Finds heading element by partial match
   */
  private findPartialMatch(
    headings: NodeListOf<Element>,
    section: HeadingSection,
    index: number
  ): Element | null {
    for (const heading of headings) {
      const headingText = heading.textContent?.trim() || "";

      // Check for prefix, suffix, or substring matches
      if (
        headingText.startsWith(section.titleText) ||
        section.titleText.startsWith(headingText) ||
        headingText.includes(section.titleText) ||
        section.titleText.includes(headingText)
      ) {
        console.debug(
          `DeepWiki++: Found partial match for "${section.titleText}"`
        );
        DomHelpers.safeSetAttribute(
          heading,
          this.sectionDataAttribute,
          index.toString()
        );
        return heading;
      }
    }
    return null;
  }

  /**
   * Finds heading element by index match (fallback)
   */
  private findIndexMatch(
    headings: NodeListOf<Element>,
    section: HeadingSection,
    index: number
  ): Element | null {
    // Only execute if index is within range
    if (index < headings.length) {
      const fallbackHeading = headings[index];
      console.warn(
        `DeepWiki++: Using fallback heading by index: "${fallbackHeading.textContent?.trim()}"`
      );
      DomHelpers.safeSetAttribute(
        fallbackHeading,
        this.sectionDataAttribute,
        index.toString()
      );
      return fallbackHeading;
    }
    return null;
  }
}
