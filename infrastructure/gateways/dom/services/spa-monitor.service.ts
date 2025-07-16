import { ISPAMonitor } from "../interfaces/spa-monitor.interface";
import { DomHelpers } from "../utils/dom-helpers";

/**
 * SPA monitoring service
 *
 * Uses History API and MutationObserver to monitor
 * SPA navigation and dynamic content changes
 */
export class SPAMonitorService implements ISPAMonitor {
  private mutationObserver: MutationObserver | null = null;
  private navigationCallbacks: ((url: string) => void)[] = [];
  private contentCallbacks: ((container: Element) => void)[] = [];
  private isActive = false;
  private lastUrl = "";
  private debounceTimer: number | null = null;
  private originalPushState: typeof history.pushState | null = null;
  private originalReplaceState: typeof history.replaceState | null = null;

  /**
   * Starts monitoring
   */
  startMonitoring(
    onNavigationChange: (url: string) => void,
    onContentChange: (container: Element) => void
  ): void {
    if (this.isActive) {
      console.debug("DeepWiki++: SPA monitoring already active");
      return;
    }

    this.navigationCallbacks.push(onNavigationChange);
    this.contentCallbacks.push(onContentChange);
    this.lastUrl = window.location.href;
    this.isActive = true;

    // Setup navigation monitoring
    this.setupNavigationMonitoring();

    // Setup content change monitoring
    this.setupContentMonitoring();

    console.debug("DeepWiki++: SPA monitoring started");
  }

  /**
   * Stops monitoring
   */
  stopMonitoring(): void {
    if (!this.isActive) return;

    // Stop MutationObserver
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    // Clear timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    // Restore History API
    this.restoreHistoryMethods();

    // Remove popstate event listener
    window.removeEventListener("popstate", this.handlePopState);

    // clear callback
    this.navigationCallbacks = [];
    this.contentCallbacks = [];
    this.isActive = false;

    console.debug("DeepWiki++: SPA monitoring stopped");
  }

  /**
   * Checks if monitoring is active
   */
  isMonitoring(): boolean {
    return this.isActive;
  }

  /**
   * Waits for element to appear
   */
  async waitForElement(
    container: Element,
    selector: string,
    timeout = 10000
  ): Promise<boolean> {
    if (DomHelpers.safeQuerySelector(selector, container)) {
      return true;
    }

    return new Promise((resolve) => {
      let timeoutId: number;

      const observer = new MutationObserver((mutations) => {
        if (DomHelpers.safeQuerySelector(selector, container)) {
          clearTimeout(timeoutId);
          observer.disconnect();
          resolve(true);
        }
      });

      observer.observe(container, {
        childList: true,
        subtree: true,
      });

      timeoutId = window.setTimeout(() => {
        observer.disconnect();
        resolve(false);
      }, timeout);
    });
  }

  /**
   * Sets up navigation monitoring
   */
  private setupNavigationMonitoring(): void {
    // Wrap History API
    this.wrapHistoryMethods();

    // Listen for popstate events
    window.addEventListener("popstate", this.handlePopState);
  }

  /**
   * Wraps History API methods
   */
  private wrapHistoryMethods(): void {
    // Save original methods
    this.originalPushState = history.pushState.bind(history);
    this.originalReplaceState = history.replaceState.bind(history);

    const handleNavigation = () => {
      setTimeout(() => this.checkNavigationChange(), 100);
    };

    history.pushState = (...args) => {
      this.originalPushState!.apply(history, args);
      handleNavigation();
    };

    history.replaceState = (...args) => {
      this.originalReplaceState!.apply(history, args);
      handleNavigation();
    };
  }

  /**
   * Restores History API
   */
  private restoreHistoryMethods(): void {
    if (this.originalPushState) {
      history.pushState = this.originalPushState;
      this.originalPushState = null;
    }

    if (this.originalReplaceState) {
      history.replaceState = this.originalReplaceState;
      this.originalReplaceState = null;
    }
  }

  /**
   * Handles popstate events
   */
  private handlePopState = (): void => {
    this.checkNavigationChange();
  };

  /**
   * Check if navigation changes
   */
  private checkNavigationChange(): void {
    const currentUrl = window.location.href;
    if (currentUrl !== this.lastUrl) {
      this.lastUrl = currentUrl;
      console.debug("DeepWiki++: Navigation change detected", { currentUrl });

      // Execute callbacks
      this.navigationCallbacks.forEach((callback) => {
        try {
          callback(currentUrl);
        } catch (error) {
          console.error("DeepWiki++: Navigation callback error:", error);
        }
      });
    }
  }

  /**
   * Sets up content change monitoring
   */
  private setupContentMonitoring(): void {
    const targetNode = document.body;

    this.mutationObserver = new MutationObserver((mutations) => {
      // Debounce processing
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      this.debounceTimer = window.setTimeout(() => {
        const significantChange = this.detectSignificantChange(mutations);
        if (significantChange) {
          console.debug("DeepWiki++: Significant content change detected");

          // Execute callbacks
          this.contentCallbacks.forEach((callback) => {
            try {
              callback(significantChange);
            } catch (error) {
              console.error("DeepWiki++: Content callback error:", error);
            }
          });
        }
      }, 200);
    });

    this.mutationObserver.observe(targetNode, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    });
  }

  /**
   * Detects significant changes
   */
  private detectSignificantChange(mutations: MutationRecord[]): Element | null {
    for (const mutation of mutations) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;

            // Detect significant element changes
            if (this.isSignificantElement(element)) {
              return element;
            }

            // Check for significant changes in child elements
            const significantChild = this.findSignificantChildElement(element);
            if (significantChild) {
              return significantChild;
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * Determines if element represents a significant change
   */
  private isSignificantElement(element: Element): boolean {
    const contentSelectors = [
      ".markdown-body",
      "article",
      ".prose",
      "main",
      "[role='main']",
    ];

    for (const selector of contentSelectors) {
      if (element.matches?.(selector)) {
        return true;
      }
    }

    if (element.matches?.("h1,h2,h3,h4,h5,h6")) {
      return true;
    }

    return DomHelpers.hasValidContent(element, 2, 50);
  }

  /**
   * Searches for significant child elements
   */
  private findSignificantChildElement(element: Element): Element | null {
    // Check child elements containing headings
    const headings = DomHelpers.safeQuerySelectorAll(
      "h1,h2,h3,h4,h5,h6",
      element
    );
    if (headings.length > 0) {
      return element;
    }

    // Check child elements containing markdown content
    const markdownElements = DomHelpers.safeQuerySelectorAll(
      ".markdown-body, article, .prose",
      element
    );
    if (markdownElements.length > 0) {
      return markdownElements[0];
    }

    return null;
  }

  /**
   * Wait for loading content
   */
  async waitForDynamicContent(
    container: Element,
    expectedMinHeadings = 2,
    timeout = 5000
  ): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const headings = DomHelpers.safeQuerySelectorAll(
        "h1,h2,h3,h4,h5,h6",
        container
      );

      if (headings.length >= expectedMinHeadings) {
        // Wait a moment for content to stabilize
        await new Promise((resolve) => setTimeout(resolve, 100));
        return true;
      }

      // Wait for 100ms before checking again
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return false;
  }
}
