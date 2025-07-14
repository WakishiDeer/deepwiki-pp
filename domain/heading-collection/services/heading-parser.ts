import {
  HeadingSection,
  createHeadingSection,
} from "../entities/heading-section";
import {
  HEADING_SELECTOR,
  getHeadingLevelFromTag,
} from "../constants/heading-constants";

/**
 * Configuration options for the HeadingParser
 */
export interface HeadingParserOptions {
  /**
   * CSS selector for the main content container
   * If not provided, will attempt to auto-detect or fall back to document.body
   */
  contentSelector?: string;

  /**
   * Whether to include the heading element itself in the content HTML
   * Default: true
   */
  includeHeadingInContent?: boolean;

  /**
   * Maximum content length to include (in characters)
   * Used to prevent extremely large sections. If not set, no limit is applied.
   */
  maxContentLength?: number;
}

/**
 * Result of parsing heading sections from a document
 */
export interface HeadingParseResult {
  /**
   * Array of successfully parsed heading sections
   */
  sections: HeadingSection[];

  /**
   * Any warnings or non-fatal errors encountered during parsing
   */
  warnings: string[];

  /**
   * The content container element that was used for parsing
   */
  contentContainer: Element | null;
}

/**
 * Service for parsing heading sections from DOM documents
 *
 * This service implements the core logic for extracting heading sections
 * from DeepWiki pages. It identifies headings and their associated content,
 * following the hierarchical structure of the document.
 */
export class HeadingParser {
  private readonly options: Required<HeadingParserOptions>;

  constructor(options: HeadingParserOptions = {}) {
    this.options = {
      contentSelector:
        options.contentSelector || this.getDefaultContentSelector(),
      includeHeadingInContent: options.includeHeadingInContent ?? true,
      maxContentLength: options.maxContentLength || 50000, // 50KB default limit
    };
  }

  /**
   * Parses heading sections from the current document
   *
   * @param sourceUrl - The URL of the source document
   * @returns Promise resolving to the parse result
   */
  async parseFromDocument(sourceUrl?: string): Promise<HeadingParseResult> {
    const url = sourceUrl || window.location.href;
    return this.parseFromElement(document, url);
  }

  /**
   * Parses heading sections from a specific element or document
   *
   * @param rootElement - The root element to parse from
   * @param sourceUrl - The URL of the source document
   * @returns Promise resolving to the parse result
   */
  async parseFromElement(
    rootElement: Document | Element,
    sourceUrl: string
  ): Promise<HeadingParseResult> {
    const warnings: string[] = [];
    const sections: HeadingSection[] = [];

    try {
      // Find the main content container
      const contentContainer = this.findContentContainer(rootElement);
      if (!contentContainer) {
        warnings.push(
          "Could not find main content container, using document body"
        );
      }

      const container = contentContainer || rootElement;

      // Find all heading elements within the content container
      const headingElements = this.findHeadingElements(container);

      console.debug(
        `DeepWiki++: Found ${headingElements.length} heading elements in container`
      );

      if (headingElements.length === 0) {
        warnings.push("No heading elements found in the content");
        console.warn("DeepWiki++: No heading elements found in the content");
        return { sections, warnings, contentContainer };
      }

      // Log found headings for debugging
      headingElements.forEach((heading, index) => {
        console.debug(
          `DeepWiki++: Heading ${index}: ${
            heading.tagName
          } - "${heading.textContent?.trim()}"`
        );
      });

      // Process each heading element
      for (let i = 0; i < headingElements.length; i++) {
        try {
          const headingElement = headingElements[i];
          const section = await this.parseHeadingSection(
            headingElement,
            headingElements,
            i,
            sourceUrl
          );

          if (section) {
            sections.push(section);
            console.debug(
              `DeepWiki++: Successfully parsed section: "${section.titleText}"`
            );
          }
        } catch (error) {
          const errorMessage = `Failed to parse heading at index ${i}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`;
          warnings.push(errorMessage);
          console.warn("DeepWiki++: " + errorMessage);
        }
      }

      return { sections, warnings, contentContainer };
    } catch (error) {
      warnings.push(
        `Parsing failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return { sections, warnings, contentContainer: null };
    }
  }

  /**
   * Finds the main content container element
   * Attempts to locate the primary content area of a DeepWiki page
   */
  private findContentContainer(
    rootElement: Document | Element
  ): Element | null {
    // TODO: Update this selector based on actual DeepWiki page structure
    // Current implementation tries common content selectors
    const selectors = [
      this.options.contentSelector,
      "main",
      '[role="main"]',
      ".main-content",
      ".content",
      "#content",
      ".wiki-content",
      ".page-content",
      "article",
    ].filter(Boolean);

    for (const selector of selectors) {
      try {
        const element = rootElement.querySelector(selector);
        if (element) {
          return element;
        }
      } catch (error) {
        // Invalid selector, continue
      }
    }

    return null;
  }

  /**
   * Gets the default content selector based on common patterns
   */
  private getDefaultContentSelector(): string {
    // TODO: Replace with actual DeepWiki content selector after investigation
    return 'main, [role="main"], .main-content, .content, #content';
  }

  /**
   * Finds all heading elements within the container
   */
  private findHeadingElements(container: Document | Element): Element[] {
    const headings = Array.from(container.querySelectorAll(HEADING_SELECTOR));

    console.debug(
      `DeepWiki++: HeadingParser found ${headings.length} headings using selector "${HEADING_SELECTOR}"`
    );

    // Sort by document order to ensure proper hierarchy processing
    const sortedHeadings = headings.sort((a, b) => {
      const comparison = a.compareDocumentPosition(b);
      if (comparison & Node.DOCUMENT_POSITION_FOLLOWING) {
        return -1;
      } else if (comparison & Node.DOCUMENT_POSITION_PRECEDING) {
        return 1;
      }
      return 0;
    });

    // Log each heading for debugging
    sortedHeadings.forEach((heading, index) => {
      console.debug(
        `DeepWiki++: Heading ${index}: ${
          heading.tagName
        } - "${heading.textContent?.trim().substring(0, 50)}${
          (heading.textContent?.trim().length || 0) > 50 ? "..." : ""
        }"`
      );
    });

    return sortedHeadings;
  }

  /**
   * Parses a single heading section
   */
  private async parseHeadingSection(
    headingElement: Element,
    allHeadings: Element[],
    currentIndex: number,
    sourceUrl: string
  ): Promise<HeadingSection | null> {
    const level = getHeadingLevelFromTag(headingElement.tagName);
    if (level === null) {
      throw new Error(`Invalid heading tag: ${headingElement.tagName}`);
    }

    const titleText = this.extractTitleText(headingElement);
    if (!titleText.trim()) {
      throw new Error("Heading element has no text content");
    }

    const contentHtml = this.extractSectionContent(
      headingElement,
      allHeadings,
      currentIndex,
      level
    );

    if (!contentHtml.trim()) {
      throw new Error("Section has no content");
    }

    const sectionId = this.generateSectionId(headingElement, currentIndex);

    return createHeadingSection({
      level,
      tagName: headingElement.tagName,
      titleText,
      contentHtml,
      sourceUrl,
      sectionId,
    });
  }

  /**
   * Extracts the text content from a heading element
   */
  private extractTitleText(headingElement: Element): string {
    // Use textContent to get clean text without markup
    return headingElement.textContent?.trim() || "";
  }

  /**
   * Extracts the content of a heading section
   * Includes the heading and all content until the next heading of same or higher level
   */
  private extractSectionContent(
    headingElement: Element,
    allHeadings: Element[],
    currentIndex: number,
    currentLevel: number
  ): string {
    const sectionNodes: Element[] = [];

    // Always include the heading element itself if configured to do so
    if (this.options.includeHeadingInContent) {
      sectionNodes.push(headingElement);
    }

    // Find the next sibling element to start collecting content
    let currentNode: Element | null = headingElement.nextElementSibling;

    // Determine the boundary for this section
    const nextHeading = this.findNextRelevantHeading(
      allHeadings,
      currentIndex,
      currentLevel
    );

    // Collect all nodes until we reach the next heading or end of container
    while (currentNode) {
      // Stop if we've reached the next heading of same or higher level
      if (nextHeading && currentNode === nextHeading) {
        break;
      }

      // Stop if this node is a heading of same or higher level
      if (this.isHeadingElement(currentNode)) {
        const nodeLevel = getHeadingLevelFromTag(currentNode.tagName);
        if (nodeLevel !== null && nodeLevel <= currentLevel) {
          break;
        }
      }

      sectionNodes.push(currentNode);
      currentNode = currentNode.nextElementSibling;
    }

    // Convert collected nodes to HTML string
    return this.nodesToHtmlString(sectionNodes);
  }

  /**
   * Finds the next heading that should terminate the current section
   */
  private findNextRelevantHeading(
    allHeadings: Element[],
    currentIndex: number,
    currentLevel: number
  ): Element | null {
    for (let i = currentIndex + 1; i < allHeadings.length; i++) {
      const heading = allHeadings[i];
      const level = getHeadingLevelFromTag(heading.tagName);

      if (level !== null && level <= currentLevel) {
        return heading;
      }
    }

    return null;
  }

  /**
   * Checks if an element is a heading element
   */
  private isHeadingElement(element: Element): boolean {
    return /^H[1-6]$/i.test(element.tagName);
  }

  /**
   * Converts an array of DOM elements to an HTML string
   */
  private nodesToHtmlString(nodes: Element[]): string {
    if (nodes.length === 0) {
      return "";
    }

    // Create a temporary container to hold the nodes
    const tempContainer = document.createElement("div");

    // Clone and append each node to preserve the original DOM
    nodes.forEach((node) => {
      const clonedNode = node.cloneNode(true) as Element;
      tempContainer.appendChild(clonedNode);
    });

    let htmlString = tempContainer.innerHTML;

    // Apply content length limit if specified
    if (
      this.options.maxContentLength &&
      htmlString.length > this.options.maxContentLength
    ) {
      htmlString =
        htmlString.substring(0, this.options.maxContentLength) + "...";
    }

    return htmlString;
  }

  /**
   * Generates a unique section ID for the heading
   */
  private generateSectionId(headingElement: Element, index: number): string {
    // Try to use existing ID if available
    if (headingElement.id) {
      return headingElement.id;
    }

    // Generate based on heading text and index
    const titleText = this.extractTitleText(headingElement);
    const slugified = titleText
      .toLowerCase()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .substring(0, 50); // Limit length

    return `section-${index}-${slugified}`;
  }
}

/**
 * Convenience function to create a HeadingParser with default options
 * and parse the current document
 *
 * @param options - Optional parser configuration
 * @returns Promise resolving to the parse result
 */
export async function parseCurrentDocument(
  options?: HeadingParserOptions
): Promise<HeadingParseResult> {
  const parser = new HeadingParser(options);
  return parser.parseFromDocument();
}

/**
 * Convenience function to parse heading sections from an HTML string
 * Useful for testing or parsing content from other sources
 *
 * @param htmlString - The HTML content to parse
 * @param sourceUrl - The URL to associate with the content
 * @param options - Optional parser configuration
 * @returns Promise resolving to the parse result
 */
export async function parseFromHtmlString(
  htmlString: string,
  sourceUrl: string,
  options?: HeadingParserOptions
): Promise<HeadingParseResult> {
  // Create a temporary document fragment
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");

  const headingParser = new HeadingParser(options);
  return headingParser.parseFromElement(doc, sourceUrl);
}
