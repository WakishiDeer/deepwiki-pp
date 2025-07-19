import { HeadingSection } from "../../../../domain/heading-collection";

/**
 * Main interface for DOM operations
 *
 * This interface provides abstraction for DOM operations to ensure
 * testability and implementation flexibility.
 */
export interface IDomGateway {
  /**
   * Finds the main content container on the page
   * @returns Found container element, or null if not found
   */
  findMainContentContainer(): Element | null;

  /**
   * Extracts heading sections from the specified container
   * @param container - Target container element to search in
   * @param sourceUrl - Source page URL
   * @returns Array of extracted heading sections
   */
  extractHeadingSections(
    container: Element,
    sourceUrl: string
  ): Promise<HeadingSection[]>;

  /**
   * Inserts add buttons next to heading elements
   * @param sections - Target heading sections
   * @param onButtonClick - Callback for button click events
   */
  insertAddButtons(
    sections: HeadingSection[],
    onButtonClick: (section: HeadingSection) => void
  ): void;

  /**
   * Removes all inserted add buttons
   */
  removeAddButtons(): void;

  /**
   * Validates whether the current page is a valid DeepWiki page
   * @returns True if the page is valid
   */
  isValidDeepWikiPage(): boolean;

  /**
   * Gets debug information about the current page
   * @returns Page information including URL, title, heading count, etc.
   */
  getPageInfo(): {
    url: string;
    title: string;
    headingCount: number;
    contentContainer: string | null;
    isValidPage: boolean;
  };

  /**
   * Waits for heading elements to appear in the container
   * Uses MutationObserver to monitor dynamic content loading in SPAs
   * @param container - The container element to monitor
   * @param timeout - Maximum wait time in milliseconds (default: 10000)
   * @returns Promise that resolves when headings are found or timeout is reached
   */
  waitForHeadings(container: Element, timeout?: number): Promise<boolean>;

  /**
   * Schedules initialization with debouncing to handle rapid DOM changes
   * @param container - Target container element
   * @param sourceUrl - Source page URL
   * @param onButtonClick - Callback for button click events
   * @param delay - Debounce delay in milliseconds (default: 500)
   */
  scheduleInitialization(
    container: Element,
    sourceUrl: string,
    onButtonClick: (section: HeadingSection) => void,
    delay?: number
  ): void;

  /**
   * Starts SPA monitoring
   * @param onButtonClick - Callback for button click events
   */
  startSPAMonitoring(onButtonClick: (section: HeadingSection) => void): void;

  /**
   * Stops SPA monitoring
   */
  stopSPAMonitoring(): void;

  /**
   * Waits for content stabilization including Mermaid diagrams
   * @param container - Container element to monitor
   * @returns Promise that resolves when content is stable
   */
  waitForContentStabilization(container: Element): Promise<void>;
}
