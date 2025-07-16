import {
  HeadingSection,
  HeadingParser,
} from "../../../../domain/heading-collection";
import { DomHelpers } from "../utils/dom-helpers";

/**
 * Heading extraction service
 *
 * Extracts heading sections from container elements
 */
export class HeadingExtractorService {
  private parser: HeadingParser;

  constructor() {
    this.parser = new HeadingParser();
  }

  /**
   * Extracts heading sections from specified container
   * @param container - Container element to search
   * @param sourceUrl - Source page URL
   * @returns Array of extracted heading sections
   */
  async extract(
    container: Element,
    sourceUrl: string
  ): Promise<HeadingSection[]> {
    try {
      console.debug("DeepWiki++: Starting heading extraction", {
        containerTag: container.tagName,
        containerClasses: container.className,
        sourceUrl,
      });

      // Container validation
      if (!this.isValidContainer(container)) {
        console.warn("DeepWiki++: Invalid container for heading extraction");
        return [];
      }

      // Pre-check heading elements
      const headingElements = this.findHeadingElements(container);
      if (headingElements.length === 0) {
        console.warn("DeepWiki++: No heading elements found in container");
        return [];
      }

      console.debug(
        `DeepWiki++: Found ${headingElements.length} heading elements`
      );

      // Extract using HeadingParser
      const result = await this.parser.parseFromContainer(container, sourceUrl);

      console.log(
        `DeepWiki++: Successfully extracted ${result.sections.length} heading sections`
      );

      // Validate and filter results
      const validSections = this.validateAndFilterSections(result.sections);

      console.log(
        `DeepWiki++: ${validSections.length} valid sections after filtering`
      );

      return validSections;
    } catch (error) {
      console.error("DeepWiki++: Failed to extract heading sections:", error);
      return [];
    }
  }

  /**
   * Validates if container is suitable for heading extraction
   */
  private isValidContainer(container: Element): boolean {
    // Basic validation
    if (!container || !container.textContent) {
      return false;
    }

    // Check for minimum content
    const textLength = container.textContent.trim().length;
    if (textLength < 50) {
      console.debug("DeepWiki++: Container has insufficient text content", {
        textLength,
      });
      return false;
    }

    // Check for heading elements
    const headings = this.findHeadingElements(container);
    if (headings.length === 0) {
      console.debug("DeepWiki++: Container has no heading elements");
      return false;
    }

    return true;
  }

  /**
   * Finds heading elements within container
   */
  private findHeadingElements(container: Element): Element[] {
    const headings = DomHelpers.safeQuerySelectorAll(
      "h1,h2,h3,h4,h5,h6",
      container
    );
    return Array.from(headings).filter((heading) =>
      this.isValidHeading(heading)
    );
  }

  /**
   * Validates if heading element is valid
   */
  private isValidHeading(heading: Element): boolean {
    const text = heading.textContent?.trim();

    // Exclude empty headings
    if (!text) {
      return false;
    }

    // Exclude very short headings (e.g., table of contents numbers only)
    if (text.length < 2) {
      return false;
    }

    // Exclude headings with only numbers
    if (/^\d+\.?$/.test(text)) {
      return false;
    }

    // Exclude hidden headings
    const style = window.getComputedStyle(heading);
    if (style.display === "none" || style.visibility === "hidden") {
      return false;
    }

    return true;
  }

  /**
   * Validates and filters extracted heading sections
   */
  private validateAndFilterSections(
    sections: HeadingSection[]
  ): HeadingSection[] {
    const validSections: HeadingSection[] = [];
    const seenTitles = new Set<string>();

    for (const section of sections) {
      // Basic validation
      if (!this.isValidSection(section)) {
        console.debug(
          `DeepWiki++: Skipping invalid section: "${section.titleText}"`
        );
        continue;
      }

      // Duplicate check
      const normalizedTitle = DomHelpers.normalizeText(section.titleText);
      if (seenTitles.has(normalizedTitle)) {
        console.debug(
          `DeepWiki++: Skipping duplicate section: "${section.titleText}"`
        );
        continue;
      }

      seenTitles.add(normalizedTitle);
      validSections.push(section);
    }

    return validSections;
  }

  /**
   * Validates if heading section is valid
   */
  private isValidSection(section: HeadingSection): boolean {
    // Required fields check
    if (!section.titleText || !section.sourceUrl) {
      return false;
    }

    // Title text validation
    const trimmedTitle = section.titleText.trim();
    if (trimmedTitle.length < 2) {
      return false;
    }

    // Level validation
    if (section.level < 1 || section.level > 6) {
      return false;
    }

    // Exclusion pattern check
    if (this.shouldExcludeSection(section)) {
      return false;
    }

    return true;
  }

  /**
   * Determines if section should be excluded
   */
  private shouldExcludeSection(section: HeadingSection): boolean {
    const title = section.titleText.toLowerCase().trim();

    // Common exclusion patterns
    const excludePatterns = [
      /^table\s+of\s+contents?$/i,
      /^toc$/i,
      /^contents?$/i,
      /^index$/i,
      /^references?$/i,
      /^bibliography$/i,
      /^footnotes?$/i,
      /^see\s+also$/i,
      /^\d+\.?\s*$/, // Numbers only
      /^[#\-\*\+\s]+$/, // Symbols only
    ];

    return excludePatterns.some((pattern) => pattern.test(title));
  }

  /**
   * Calculates section quality score (for future enhancement)
   */
  private calculateSectionQuality(section: HeadingSection): number {
    let score = 0;

    // Score based on title length
    const titleLength = section.titleText.trim().length;
    if (titleLength >= 5 && titleLength <= 100) {
      score += 10;
    }

    // Score based on content length
    const contentLength = section.contentHtml?.trim().length || 0;
    if (contentLength > 50) {
      score += 10;
    }

    // Score based on hierarchy level (h2-h4 is optimal)
    if (section.level >= 2 && section.level <= 4) {
      score += 5;
    }

    return score;
  }

  /**
   * Gets parser instance (for testing)
   */
  getParser(): HeadingParser {
    return this.parser;
  }

  /**
   * Sets custom parser (for testing)
   */
  setParser(parser: HeadingParser): void {
    this.parser = parser;
  }
}
