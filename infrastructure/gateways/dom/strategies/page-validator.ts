import { DEEPWIKI_SELECTORS } from "../utils/selectors.constants";
import { DomHelpers } from "../utils/dom-helpers";

/**
 * Page validation strategy class
 *
 * Determines whether the current page is a valid DeepWiki page
 */
export class PageValidator {
  /**
   * Validates whether the current page is a valid DeepWiki page
   * @returns True if the page is valid
   */
  isValid(): boolean {
    // URL validation
    if (!this.isValidUrl()) {
      console.debug("DeepWiki++: Invalid URL for DeepWiki page");
      return false;
    }

    // DOM structure validation
    if (!this.hasValidDomStructure()) {
      console.debug("DeepWiki++: Invalid DOM structure for DeepWiki page");
      return false;
    }

    // Content validation
    if (!this.hasValidContent()) {
      console.debug("DeepWiki++: Insufficient content for DeepWiki page");
      return false;
    }

    console.debug("DeepWiki++: Valid DeepWiki page detected");
    return true;
  }

  /**
   * Validates whether the URL matches valid DeepWiki patterns
   */
  private isValidUrl(): boolean {
    const url = window.location.href;

    // Check DeepWiki URL patterns
    // Example: https://deepwiki.example.com/repo/owner/name
    const deepWikiPatterns = [
      /deepwiki/i,
      /codebase.*wiki/i,
      /wiki.*codebase/i,
      // Add other patterns as needed
    ];

    return deepWikiPatterns.some((pattern) => pattern.test(url));
  }

  /**
   * Validates whether the DOM structure matches valid DeepWiki page structure
   */
  private hasValidDomStructure(): boolean {
    // Check for DeepWiki-specific elements
    const hasRepoPage =
      DomHelpers.safeQuerySelector(DEEPWIKI_SELECTORS.REPO_PAGE) !== null;
    const hasMarkdownBody =
      DomHelpers.safeQuerySelector(DEEPWIKI_SELECTORS.MARKDOWN_BODY) !== null;
    const hasArticle =
      DomHelpers.safeQuerySelector(DEEPWIKI_SELECTORS.ARTICLE) !== null;

    // Consider valid if any characteristic element exists
    return hasRepoPage || hasMarkdownBody || hasArticle;
  }

  /**
   * Validates whether the page has sufficient content
   */
  private hasValidContent(): boolean {
    // Check for existence of heading elements
    const headings = DomHelpers.safeQuerySelectorAll("h1,h2,h3,h4,h5,h6");

    if (headings.length === 0) {
      return false;
    }

    // Check for sufficient text content
    const textContent = document.body.textContent?.trim() || "";
    const hasEnoughText = textContent.length > 100;

    // Check for code blocks or pre elements (characteristics of technical documentation)
    const codeElements = DomHelpers.safeQuerySelectorAll(
      "code, pre, .highlight"
    );
    const hasCodeContent = codeElements.length > 0;

    return hasEnoughText && (headings.length >= 2 || hasCodeContent);
  }

  /**
   * Validates whether the page is currently loading
   */
  isLoading(): boolean {
    // Check for presence of loading indicators
    const loadingSelectors = [
      ".loading",
      ".spinner",
      "[data-loading]",
      ".skeleton",
    ];

    return loadingSelectors.some(
      (selector) => DomHelpers.safeQuerySelector(selector) !== null
    );
  }

  /**
   * Validates whether the page may be dynamically updated
   */
  isDynamic(): boolean {
    // Check for SPA-specific elements or libraries
    const spaIndicators = [
      "[data-reactroot]",
      "[data-vue-root]",
      ".next-app",
      "[ng-app]",
    ];

    return (
      spaIndicators.some(
        (selector) => DomHelpers.safeQuerySelector(selector) !== null
      ) || this.hasHistoryApi()
    );
  }

  /**
   * Checks whether History API is being used
   */
  private hasHistoryApi(): boolean {
    // Detect History API usage for simple detection method
    // This is a simplified detection approach
    return typeof window.history?.pushState === "function";
  }
}
