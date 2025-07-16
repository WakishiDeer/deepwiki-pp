import { IDomGateway } from "../interfaces/dom-gateway.interface";
import {
  HeadingSection,
  HEADING_TAGS,
} from "../../../../domain/heading-collection";
import { ContentContainerFinder } from "../strategies/content-container-finder";
import { PageValidator } from "../strategies/page-validator";
import { HeadingExtractorService } from "../services/heading-extractor.service";
import { ButtonManagerService } from "../services/button-manager.service";
import { SPAMonitorService } from "../services/spa-monitor.service";
import { HeadingElementFinder } from "../strategies/heading-element-finder";
import { ButtonFactory } from "../factories/button.factory";

/**
 * Chrome extension DOM gateway implementation
 *
 * Integrates various services and implements the DOM gateway interface
 */
export class ChromeDomGateway implements IDomGateway {
  private readonly containerFinder: ContentContainerFinder;
  private readonly pageValidator: PageValidator;
  private readonly headingExtractor: HeadingExtractorService;
  private readonly buttonManager: ButtonManagerService;
  private readonly spaMonitor: SPAMonitorService;

  constructor() {
    // Initialize dependencies
    this.containerFinder = new ContentContainerFinder();
    this.pageValidator = new PageValidator();
    this.headingExtractor = new HeadingExtractorService();
    this.buttonManager = new ButtonManagerService(
      new HeadingElementFinder(),
      new ButtonFactory()
    );
    this.spaMonitor = new SPAMonitorService();

    console.debug(
      "DeepWiki++: ChromeDomGateway initialized with modular services"
    );
  }

  /**
   * Finds the main content container
   */
  findMainContentContainer(): Element | null {
    console.debug("DeepWiki++: Finding main content container");
    return this.containerFinder.find();
  }

  /**
   * Extracts heading sections
   */
  async extractHeadingSections(
    container: Element,
    sourceUrl: string
  ): Promise<HeadingSection[]> {
    console.debug("DeepWiki++: Extracting heading sections", {
      containerTag: container?.tagName || "null",
      sourceUrl,
    });

    if (!container) {
      console.warn("DeepWiki++: No container provided for heading extraction");
      return [];
    }

    try {
      return await this.headingExtractor.extract(container, sourceUrl);
    } catch (error) {
      console.error("DeepWiki++: Error extracting heading sections:", error);
      return [];
    }
  }

  /**
   * Inserts add buttons
   */
  insertAddButtons(
    sections: HeadingSection[],
    onButtonClick: (section: HeadingSection) => void
  ): void {
    console.debug("DeepWiki++: Inserting add buttons", {
      sectionCount: sections.length,
    });

    this.buttonManager.insertButtons(sections, onButtonClick);
  }

  /**
   * Removes all add buttons
   */
  removeAddButtons(): void {
    console.debug("DeepWiki++: Removing all add buttons");
    this.buttonManager.removeAllButtons();
  }

  /**
   * Validates if current page is a valid DeepWiki page
   */
  isValidDeepWikiPage(): boolean {
    const isValid = this.pageValidator.isValid();
    console.debug("DeepWiki++: Page validation result", { isValid });
    return isValid;
  }

  /**
   * Starts SPA monitoring
   */
  startSPAMonitoring(onButtonClick: (section: HeadingSection) => void): void {
    console.debug("DeepWiki++: Starting SPA monitoring");

    this.spaMonitor.startMonitoring(
      // Navigation change callback
      async (url: string) => {
        console.debug("DeepWiki++: Navigation change detected", { url });

        // Clear buttons
        this.removeAddButtons();

        // Wait briefly before processing new content
        setTimeout(async () => {
          await this.handlePageChange(url, onButtonClick);
        }, 500);
      },

      // Content change callback
      async (changedElement: Element) => {
        console.debug("DeepWiki++: Content change detected", {
          elementTag: changedElement.tagName,
          elementClasses: changedElement.className,
        });

        // Process content changes
        await this.handleContentChange(changedElement, onButtonClick);
      }
    );
  }

  /**
   * Stops SPA monitoring
   */
  stopSPAMonitoring(): void {
    console.debug("DeepWiki++: Stopping SPA monitoring");
    this.spaMonitor.stopMonitoring();
    this.removeAddButtons();
  }

  /**
   * Handles page changes
   */
  private async handlePageChange(
    url: string,
    onButtonClick: (section: HeadingSection) => void
  ): Promise<void> {
    try {
      // Check page validity
      if (!this.isValidDeepWikiPage()) {
        console.debug(
          "DeepWiki++: Page is not a valid DeepWiki page, skipping initialization"
        );
        return;
      }

      // Find content container
      const container = this.findMainContentContainer();
      if (!container) {
        console.warn("DeepWiki++: No content container found after navigation");
        return;
      }

      // Initialize page
      await this.initializePage(container, url, onButtonClick);
    } catch (error) {
      console.error("DeepWiki++: Error handling page change:", error);
    }
  }

  /**
   * Handles content changes
   */
  private async handleContentChange(
    changedElement: Element,
    onButtonClick: (section: HeadingSection) => void
  ): Promise<void> {
    try {
      // Check if changed element is significant
      if (!this.isSignificantContentChange(changedElement)) {
        console.debug(
          "DeepWiki++: Content change is not significant, skipping"
        );
        return;
      }

      // Re-search content container
      const container = this.findMainContentContainer();
      if (!container || !this.isValidDeepWikiPage()) {
        console.debug("DeepWiki++: Invalid state after content change");
        return;
      }

      // Re-initialize page
      await this.initializePage(container, window.location.href, onButtonClick);
    } catch (error) {
      console.error("DeepWiki++: Error handling content change:", error);
    }
  }

  /**
   * Determines if content change is significant
   */
  private isSignificantContentChange(element: Element): boolean {
    // Check if heading elements are included
    const hasHeadings = element.querySelector("h1,h2,h3,h4,h5,h6") !== null;

    // Check if it's a large content block
    const hasSignificantContent = (element.textContent?.length || 0) > 100;

    // Check if it's markdown content
    const isMarkdownContent =
      element.matches?.(".markdown-body, article, .prose") || false;

    return hasHeadings || (hasSignificantContent && isMarkdownContent);
  }

  /**
   * Initializes the page
   */
  private async initializePage(
    container: Element,
    sourceUrl: string,
    onButtonClick: (section: HeadingSection) => void
  ): Promise<void> {
    try {
      console.debug("DeepWiki++: Initializing page", { sourceUrl });

      // Wait for headings to appear
      const hasHeadings = await this.spaMonitor.waitForElement(
        container,
        "h1,h2,h3,h4,h5,h6",
        5000
      );

      if (!hasHeadings) {
        console.warn("DeepWiki++: No headings found after waiting");
        return;
      }

      // Wait for dynamic content to fully load
      await this.waitForContentStabilization(container);

      // Extract heading sections
      const sections = await this.extractHeadingSections(container, sourceUrl);

      if (sections.length === 0) {
        console.warn("DeepWiki++: No valid sections extracted");
        return;
      }

      // Remove existing buttons before inserting new ones
      this.removeAddButtons();
      this.insertAddButtons(sections, onButtonClick);

      console.log(
        `DeepWiki++: Page initialized successfully with ${sections.length} sections`
      );
    } catch (error) {
      console.error("DeepWiki++: Error initializing page:", error);
    }
  }

  /**
   * Waits for content stabilization
   */
  private async waitForContentStabilization(container: Element): Promise<void> {
    // Monitor content changes at short intervals
    let lastHeadingCount = 0;
    let stableCount = 0;
    const requiredStableChecks = 3;
    const checkInterval = 200;
    const maxWaitTime = 2000;

    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const currentHeadingCount =
        container.querySelectorAll("h1,h2,h3,h4,h5,h6").length;

      if (currentHeadingCount === lastHeadingCount && currentHeadingCount > 0) {
        stableCount++;
        if (stableCount >= requiredStableChecks) {
          console.debug("DeepWiki++: Content appears stable", {
            headingCount: currentHeadingCount,
            waitTime: Date.now() - startTime,
          });
          break;
        }
      } else {
        stableCount = 0;
        lastHeadingCount = currentHeadingCount;
      }

      await new Promise((resolve) => setTimeout(resolve, checkInterval));
    }
  }

  /**
   * Gets current button count (for debugging)
   */
  getButtonCount(): number {
    return this.buttonManager.getButtonCount();
  }

  /**
   * Checks if SPA monitoring is active (for debugging)
   */
  isSPAMonitoringActive(): boolean {
    return this.spaMonitor.isMonitoring();
  }

  /**
   * Gets service status (for debugging)
   */
  getServiceStatus(): {
    buttonCount: number;
    isMonitoring: boolean;
    isValidPage: boolean;
  } {
    return {
      buttonCount: this.getButtonCount(),
      isMonitoring: this.isSPAMonitoringActive(),
      isValidPage: this.isValidDeepWikiPage(),
    };
  }

  /**
   * Gets debug information about the current page
   */
  getPageInfo(): {
    url: string;
    title: string;
    headingCount: number;
    contentContainer: string | null;
    isValidPage: boolean;
  } {
    const container = this.findMainContentContainer();
    const headings = container
      ? container.querySelectorAll(
          HEADING_TAGS.map((tag) => tag.toLowerCase()).join(",")
        )
      : [];

    return {
      url: window.location.href,
      title: document.title,
      headingCount: headings.length,
      contentContainer: container?.tagName || null,
      isValidPage: this.isValidDeepWikiPage(),
    };
  }

  /**
   * Waits for heading elements to appear in the container
   * Uses MutationObserver to monitor dynamic content loading in SPAs
   */
  waitForHeadings(
    container: Element,
    timeout: number = 10000
  ): Promise<boolean> {
    return new Promise((resolve) => {
      // Check if headings already exist
      const existingHeadings = container.querySelectorAll(
        HEADING_TAGS.map((tag) => tag.toLowerCase()).join(",")
      );

      if (existingHeadings.length > 0) {
        console.debug(
          `DeepWiki++: Found ${existingHeadings.length} existing headings`
        );
        resolve(true);
        return;
      }

      console.debug("DeepWiki++: No headings found, starting MutationObserver");

      let timeoutId: number;
      const observer = new MutationObserver((mutations) => {
        let headingsFound = false;

        for (const mutation of mutations) {
          if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
            // Check if any added nodes contain heading elements
            for (const node of mutation.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;

                // Check if the node itself is a heading
                if (HEADING_TAGS.includes(element.tagName)) {
                  headingsFound = true;
                  break;
                }

                // Check if the node contains headings
                const headings = element.querySelectorAll?.(
                  HEADING_TAGS.map((tag) => tag.toLowerCase()).join(",")
                );

                if (headings && headings.length > 0) {
                  headingsFound = true;
                  break;
                }
              }
            }

            if (headingsFound) break;
          }
        }

        if (headingsFound) {
          console.debug("DeepWiki++: Headings detected via MutationObserver");
          clearTimeout(timeoutId);
          observer.disconnect();
          resolve(true);
        }
      });

      // Start observing
      observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false,
      });

      // Set timeout
      timeoutId = window.setTimeout(() => {
        console.warn("DeepWiki++: Timeout waiting for headings");
        observer.disconnect();
        resolve(false);
      }, timeout);
    });
  }

  /**
   * Debounced initialization to prevent excessive re-processing
   */
  private initializationDebounceTimer: number | null = null;

  /**
   * Schedules initialization with debouncing to handle rapid DOM changes
   */
  scheduleInitialization(
    container: Element,
    sourceUrl: string,
    onButtonClick: (section: HeadingSection) => void,
    delay: number = 500
  ): void {
    if (this.initializationDebounceTimer) {
      clearTimeout(this.initializationDebounceTimer);
    }

    this.initializationDebounceTimer = window.setTimeout(async () => {
      try {
        console.debug("DeepWiki++: Running debounced initialization");

        // Wait for headings to appear
        const headingsFound = await this.waitForHeadings(container, 5000);

        if (!headingsFound) {
          console.warn("DeepWiki++: No headings found after waiting");
          return;
        }

        // Extract and process sections
        const sections = await this.extractHeadingSections(
          container,
          sourceUrl
        );

        if (sections.length === 0) {
          console.warn("DeepWiki++: No valid sections extracted");
          return;
        }

        // Insert buttons
        this.insertAddButtons(sections, onButtonClick);

        console.log(
          `DeepWiki++: Successfully initialized with ${sections.length} sections`
        );
      } catch (error) {
        console.error(
          "DeepWiki++: Error during debounced initialization:",
          error
        );
      }
    }, delay);
  }
}
