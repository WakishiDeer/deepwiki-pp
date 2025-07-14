/**
 * Heading Parser Service
 * Handles parsing of heading sections from DOM elements
 */

import {
  HeadingSection,
  createHeadingSection,
  HEADING_SELECTOR,
  getHeadingLevelFromTag,
} from "./heading-section";
import { ParseError, HtmlContent } from "../shared";

export interface HeadingParserOptions {
  contentSelector?: string;
  includeHeadingInContent?: boolean;
  maxContentLength?: number;
}

export interface HeadingParseResult {
  sections: HeadingSection[];
  warnings: string[];
  contentContainer: Element | null;
}

/**
 * Service for parsing heading sections from DOM
 */
export class HeadingParser {
  private readonly options: Required<HeadingParserOptions>;

  constructor(options: HeadingParserOptions = {}) {
    this.options = {
      contentSelector: options.contentSelector || "",
      includeHeadingInContent: options.includeHeadingInContent ?? true,
      maxContentLength: options.maxContentLength ?? 50000,
    };
  }

  /**
   * Parse all heading sections from the current document
   */
  parseFromDocument(sourceUrl: string): HeadingParseResult {
    const contentContainer = this.findContentContainer();
    if (!contentContainer) {
      throw new ParseError("No content container found");
    }

    return this.parseFromContainer(contentContainer, sourceUrl);
  }

  /**
   * Parse heading sections from a specific container element
   */
  parseFromContainer(
    container: Element,
    sourceUrl: string
  ): HeadingParseResult {
    const headings = container.querySelectorAll(HEADING_SELECTOR);
    const sections: HeadingSection[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < headings.length; i++) {
      const heading = headings[i] as HTMLElement;

      try {
        const section = this.parseHeadingSection(heading, container, sourceUrl);
        sections.push(section);
      } catch (error) {
        warnings.push(
          `Failed to parse heading ${i + 1}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    return {
      sections,
      warnings,
      contentContainer: container,
    };
  }

  /**
   * Parse a single heading section
   */
  private parseHeadingSection(
    heading: HTMLElement,
    container: Element,
    sourceUrl: string
  ): HeadingSection {
    const level = getHeadingLevelFromTag(heading.tagName);
    if (level === null) {
      throw new ParseError(`Invalid heading tag: ${heading.tagName}`);
    }

    const titleText = this.extractTitleText(heading);
    const contentHtml = this.extractSectionContent(heading, container);

    return createHeadingSection({
      level,
      tagName: heading.tagName,
      titleText,
      contentHtml,
      sourceUrl,
    });
  }

  /**
   * Extract clean title text from heading element
   */
  private extractTitleText(heading: HTMLElement): string {
    return heading.textContent?.trim() || "";
  }

  /**
   * Extract section content HTML including the heading and subsequent content
   */
  private extractSectionContent(
    heading: HTMLElement,
    container: Element
  ): HtmlContent {
    const content: Element[] = [];

    if (this.options.includeHeadingInContent) {
      content.push(heading.cloneNode(true) as Element);
    }

    // Find all elements between this heading and the next heading of same or higher level
    let current = heading.nextElementSibling;
    const headingLevel = getHeadingLevelFromTag(heading.tagName)!;

    while (current) {
      // Check if we've reached another heading of same or higher level
      const currentLevel = getHeadingLevelFromTag(current.tagName);
      if (currentLevel !== null && currentLevel <= headingLevel) {
        break;
      }

      content.push(current.cloneNode(true) as Element);
      current = current.nextElementSibling;
    }

    // Convert to HTML string
    const tempDiv = document.createElement("div");
    content.forEach((element) => tempDiv.appendChild(element));
    let html = tempDiv.innerHTML;

    // Apply content length limit
    if (
      this.options.maxContentLength &&
      html.length > this.options.maxContentLength
    ) {
      html = html.substring(0, this.options.maxContentLength) + "...";
    }

    return html;
  }

  /**
   * Find the main content container in the document
   */
  private findContentContainer(): Element | null {
    if (this.options.contentSelector) {
      return document.querySelector(this.options.contentSelector);
    }

    // Try common content selectors
    const selectors = [
      "main",
      '[role="main"]',
      ".content",
      ".main-content",
      "#content",
      "#main",
      "article",
      ".article",
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
    }

    // Fallback to body
    return document.body;
  }
}
