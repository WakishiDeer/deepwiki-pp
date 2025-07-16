/**
 * Content script for DeepWiki++ heading section collection
 *
 * This content script runs on web pages and provides functionality
 * for extracting and collecting heading sections. It communicates
 * with the background script and side panel to enable seamless
 * section collection from any wiki page.
 */

import {
  HeadingParser,
  HeadingParseResult,
} from "../../domain/heading-collection/heading-parser";
import { HeadingSection } from "../../domain/heading-collection/heading-section";
import { AddHeadingSectionInput } from "../../application/usecases/heading-collection";
import { Message } from "../../shared/messaging";

/**
 * Configuration for the content script
 */
interface ContentScriptConfig {
  /** Whether to auto-collect sections on page load */
  autoCollect: boolean;
  /** Minimum heading level to collect */
  minLevel: number;
  /** Maximum heading level to collect */
  maxLevel: number;
  /** Whether to show visual indicators on headings */
  showIndicators: boolean;
}

/**
 * Content script class for heading section collection
 */
class HeadingSectionContentScript {
  private parser: HeadingParser;
  private config: ContentScriptConfig;
  private isEnabled: boolean = false;
  private collectedSections: Set<string> = new Set();

  constructor() {
    this.config = {
      autoCollect: false,
      minLevel: 1,
      maxLevel: 6,
      showIndicators: true,
    };

    this.parser = new HeadingParser({
      includeHeadingInContent: true,
      maxContentLength: 10000, // 10KB limit for content scripts
    });

    this.initialize();
  }

  /**
   * Initializes the content script
   */
  private async initialize(): Promise<void> {
    try {
      // Load configuration from storage
      await this.loadConfiguration();

      // Set up message listeners
      this.setupMessageListeners();

      // Set up DOM event listeners
      this.setupDOMListeners();

      // Wait for DOM to be ready
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
          this.performInitialSetup();
        });
      } else {
        this.performInitialSetup();
      }

      this.isEnabled = true;
      console.log("DeepWiki++ content script initialized");
    } catch (error) {
      console.error("Failed to initialize content script:", error);
    }
  }

  /**
   * Performs initial setup after DOM is ready
   */
  private async performInitialSetup(): Promise<void> {
    try {
      // Inject visual indicators if enabled
      if (this.config.showIndicators) {
        await this.injectVisualIndicators();
      }

      // Auto-collect if enabled
      if (this.config.autoCollect) {
        await this.collectAllSections();
      }
    } catch (error) {
      console.error("Failed to perform initial setup:", error);
    }
  }

  /**
   * Injects visual indicators (+ buttons) next to headings
   */
  private async injectVisualIndicators(): Promise<void> {
    try {
      const contentRoot = this.identifyMainContent();
      const headingElements = contentRoot.querySelectorAll("h1,h2,h3,h4,h5,h6");

      headingElements.forEach((heading, index) => {
        if (heading instanceof HTMLElement) {
          // Add data attribute for identification
          heading.setAttribute("data-dwpp-index", index.toString());

          // Create and inject add button
          const addButton = this.createAddButton(heading, index);
          this.injectAddButton(heading, addButton);
        }
      });

      console.log(`Injected ${headingElements.length} heading indicators`);
    } catch (error) {
      console.error("Failed to inject visual indicators:", error);
    }
  }

  /**
   * Identifies the main content area of the page
   */
  private identifyMainContent(): Element {
    // TODO: Verify DeepWiki's main content area selector
    const selectors = [
      "main",
      '[role="main"]',
      "#content",
      "#main-content",
      ".main-content",
      ".content",
      "article",
      ".wiki-content",
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

  /**
   * Creates an add button for a heading element
   */
  private createAddButton(heading: HTMLElement, index: number): HTMLElement {
    const button = document.createElement("button");
    button.className = "dwpp-add-button";
    button.innerHTML = "＋";
    button.title = `Collect this section: ${heading.textContent}`;
    button.setAttribute("data-dwpp-index", index.toString());
    button.setAttribute("data-dwpp-level", heading.tagName.slice(1));

    // Apply basic styling
    Object.assign(button.style, {
      marginLeft: "8px",
      padding: "2px 6px",
      fontSize: "12px",
      border: "1px solid #ccc",
      borderRadius: "3px",
      backgroundColor: "#f9f9f9",
      color: "#333",
      cursor: "pointer",
      display: "inline-block",
      verticalAlign: "middle",
    });

    // Add click handler
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.collectHeadingSection(heading as HTMLHeadingElement);
    });

    // Add hover effects
    button.addEventListener("mouseenter", () => {
      button.style.backgroundColor = "#e9e9e9";
      button.style.borderColor = "#999";
    });

    button.addEventListener("mouseleave", () => {
      button.style.backgroundColor = "#f9f9f9";
      button.style.borderColor = "#ccc";
    });

    return button;
  }

  /**
   * Injects the add button next to a heading element
   */
  private injectAddButton(heading: HTMLElement, button: HTMLElement): void {
    try {
      // Check if button already exists
      if (heading.querySelector(".dwpp-add-button")) {
        return;
      }

      // Insert button as next sibling or append to heading
      if (heading.nextSibling) {
        heading.parentNode?.insertBefore(button, heading.nextSibling);
      } else {
        heading.appendChild(button);
      }
    } catch (error) {
      console.error("Failed to inject add button:", error);
    }
  }

  /**
   * Loads configuration from Chrome storage
   */
  private async loadConfiguration(): Promise<void> {
    try {
      const result = await chrome.storage.sync.get("headingCollectionConfig");
      if (result.headingCollectionConfig) {
        this.config = { ...this.config, ...result.headingCollectionConfig };
      }
    } catch (error) {
      console.warn("Failed to load configuration, using defaults:", error);
    }
  }

  /**
   * Sets up message listeners for communication with other extension parts
   */
  private setupMessageListeners(): void {
    chrome.runtime.onMessage.addListener(
      (
        request: any,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response: any) => void
      ) => {
        this.handleMessage(request, sender, sendResponse);
        return true; // Will respond asynchronously
      }
    );
  }

  /**
   * Handles incoming messages from background script or side panel
   */
  private async handleMessage(
    request: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      switch (request.action) {
        case "collectAllSections":
          const sections = await this.collectAllSections();
          sendResponse({ success: true, sections: sections.length });
          break;

        case "collectSection":
          const section = await this.collectSectionBySelector(request.selector);
          sendResponse({ success: true, collected: !!section });
          break;

        case "highlightSections":
          this.highlightCollectableSections(request.highlight !== false);
          sendResponse({ success: true });
          break;

        case "getPageInfo":
          const info = await this.getPageInfo();
          sendResponse({ success: true, info });
          break;

        case "updateConfig":
          this.config = { ...this.config, ...request.config };
          await this.saveConfiguration();
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: "Unknown action" });
      }
    } catch (error) {
      console.error("Error handling message:", error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Sets up DOM event listeners for user interaction
   */
  private setupDOMListeners(): void {
    // Click handler for collecting sections
    document.addEventListener("click", this.handleClick.bind(this), true);

    // Keyboard shortcuts
    document.addEventListener("keydown", this.handleKeydown.bind(this));

    // Right-click context menu support
    document.addEventListener("contextmenu", this.handleContextMenu.bind(this));
  }

  /**
   * Handles click events for section collection
   */
  private handleClick(event: MouseEvent): void {
    if (!this.isEnabled || !event.ctrlKey) return;

    const target = event.target as Element;
    const headingElement = this.findNearestHeading(target);

    if (headingElement) {
      event.preventDefault();
      event.stopPropagation();
      this.collectHeadingSection(headingElement);
    }
  }

  /**
   * Handles keyboard shortcuts
   */
  private handleKeydown(event: KeyboardEvent): void {
    if (!this.isEnabled) return;

    // Ctrl+Shift+C: Collect all sections
    if (event.ctrlKey && event.shiftKey && event.key === "C") {
      event.preventDefault();
      this.collectAllSections();
    }

    // Ctrl+Shift+H: Toggle heading highlights
    if (event.ctrlKey && event.shiftKey && event.key === "H") {
      event.preventDefault();
      this.toggleHeadingHighlights();
    }
  }

  /**
   * Handles context menu events
   */
  private handleContextMenu(event: MouseEvent): void {
    const target = event.target as Element;
    const headingElement = this.findNearestHeading(target);

    if (headingElement) {
      // Store the heading element for potential collection via context menu
      (window as any).deepwikiSelectedHeading = headingElement;
    }
  }

  /**
   * Collects all heading sections from the current page
   */
  private async collectAllSections(): Promise<HeadingSection[]> {
    try {
      console.log("Collecting all heading sections...");

      const parseResult = await this.parser.parseFromDocument(
        window.location.href
      );

      if (parseResult.warnings.length > 0) {
        console.warn("Parsing warnings:", parseResult.warnings);
      }

      const collectedSections: HeadingSection[] = [];

      for (const section of parseResult.sections) {
        if (this.shouldCollectSection(section)) {
          const success = await this.sendSectionToBackground(section);
          if (success) {
            collectedSections.push(section);
            this.markSectionAsCollected(section);
          }
        }
      }

      this.showCollectionNotification(
        `Collected ${collectedSections.length} sections`
      );
      return collectedSections;
    } catch (error) {
      console.error("Failed to collect sections:", error);
      this.showCollectionNotification("Failed to collect sections", "error");
      return [];
    }
  }

  /**
   * Collects a specific heading section by CSS selector
   */
  private async collectSectionBySelector(
    selector: string
  ): Promise<HeadingSection | null> {
    try {
      const element = document.querySelector(selector) as HTMLHeadingElement;
      if (!element || !this.isHeadingElement(element)) {
        return null;
      }

      return await this.collectHeadingSection(element);
    } catch (error) {
      console.error("Failed to collect section by selector:", error);
      return null;
    }
  }

  /**
   * Collects a heading section from a specific heading element
   */
  private async collectHeadingSection(
    headingElement: HTMLHeadingElement
  ): Promise<HeadingSection | null> {
    try {
      // Parse all sections and find the one that matches our heading element
      const parseResult = await this.parser.parseFromDocument(
        window.location.href
      );

      if (parseResult.warnings.length > 0) {
        console.warn("Parsing warnings:", parseResult.warnings);
      }

      // Find the section that corresponds to our heading element
      const section = parseResult.sections.find((s) => {
        // Try to match by title text and approximate position
        return s.titleText === headingElement.textContent?.trim();
      });

      if (!section) {
        throw new Error("Could not find matching section for heading element");
      }

      if (!this.shouldCollectSection(section)) {
        this.showCollectionNotification(
          "Section does not meet collection criteria",
          "warning"
        );
        return null;
      }

      const success = await this.sendSectionToBackground(section);
      if (success) {
        this.markSectionAsCollected(section);
        this.showCollectionNotification(`Collected: ${section.titleText}`);
        return section;
      } else {
        throw new Error("Failed to save section");
      }
    } catch (error) {
      console.error("Failed to collect heading section:", error);
      this.showCollectionNotification(
        `Failed to collect section: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
      return null;
    }
  }

  /**
   * Sends a heading section to the background script for storage
   */
  private async sendSectionToBackground(
    section: HeadingSection
  ): Promise<boolean> {
    try {
      const input: AddHeadingSectionInput = {
        level: section.level,
        title: section.titleText,
        content: section.contentHtml,
        sourceUrl: section.sourceUrl,
        id: section.sectionId,
      };

      const response = await chrome.runtime.sendMessage({
        action: "addHeadingSection",
        headingSection: input,
      });

      return response.success === true;
    } catch (error) {
      console.error("Failed to send section to background:", error);
      return false;
    }
  }

  /**
   * Checks if a section should be collected based on configuration
   */
  private shouldCollectSection(section: HeadingSection): boolean {
    // Check level range
    if (
      section.level < this.config.minLevel ||
      section.level > this.config.maxLevel
    ) {
      return false;
    }

    // Check if already collected
    if (this.collectedSections.has(section.sectionId || section.titleText)) {
      return false;
    }

    // Check content length
    if (section.contentHtml.length === 0) {
      return false;
    }

    return true;
  }

  /**
   * Marks a section as collected to prevent duplicates
   */
  private markSectionAsCollected(section: HeadingSection): void {
    this.collectedSections.add(section.sectionId || section.titleText);
  }

  /**
   * Highlights all collectable heading sections on the page
   */
  private async highlightCollectableSections(
    highlight: boolean = true
  ): Promise<void> {
    // Find all heading elements using a simple selector
    const headingElements = Array.from(
      document.querySelectorAll("h1, h2, h3, h4, h5, h6")
    ).filter((el) => el instanceof HTMLElement) as HTMLElement[];

    headingElements.forEach((element) => {
      if (highlight) {
        element.style.outline = "2px dashed #4CAF50";
        element.style.cursor = "pointer";
        element.title = "Ctrl+Click to collect this section";
      } else {
        element.style.outline = "";
        element.style.cursor = "";
        element.title = "";
      }
    });
  }

  /**
   * Toggles heading highlights on/off
   */
  private toggleHeadingHighlights(): void {
    const firstHeading = document.querySelector(
      "h1, h2, h3, h4, h5, h6"
    ) as HTMLElement;
    const isHighlighted = firstHeading?.style.outline.includes("dashed");
    this.highlightCollectableSections(!isHighlighted);
  }

  /**
   * Finds the nearest heading element to a target element
   */
  private findNearestHeading(target: Element): HTMLHeadingElement | null {
    // Check if target itself is a heading
    if (this.isHeadingElement(target)) {
      return target as HTMLHeadingElement;
    }

    // Check parent elements
    let parent = target.parentElement;
    while (parent) {
      if (this.isHeadingElement(parent)) {
        return parent as HTMLHeadingElement;
      }
      parent = parent.parentElement;
    }

    // Check following siblings
    let sibling = target.nextElementSibling;
    while (sibling) {
      if (this.isHeadingElement(sibling)) {
        return sibling as HTMLHeadingElement;
      }
      sibling = sibling.nextElementSibling;
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
   * Gets information about the current page
   */
  private async getPageInfo(): Promise<any> {
    // Find heading elements using simple selector
    const headingElements = Array.from(
      document.querySelectorAll("h1, h2, h3, h4, h5, h6")
    );

    return {
      url: window.location.href,
      title: document.title,
      headingCount: headingElements.length,
      headingLevels: [
        ...new Set(headingElements.map((h) => parseInt(h.tagName.charAt(1)))),
      ].sort(),
      collectedCount: this.collectedSections.size,
    };
  }

  /**
   * Saves configuration to Chrome storage
   */
  private async saveConfiguration(): Promise<void> {
    try {
      await chrome.storage.sync.set({ headingCollectionConfig: this.config });
    } catch (error) {
      console.error("Failed to save configuration:", error);
    }
  }

  /**
   * Shows a notification to the user about collection status
   */
  private showCollectionNotification(
    message: string,
    type: "success" | "warning" | "error" = "success"
  ): void {
    // Create a temporary notification element
    const notification = document.createElement("div");
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${
        type === "error"
          ? "#f44336"
          : type === "warning"
          ? "#ff9800"
          : "#4CAF50"
      };
      color: white;
      padding: 12px 16px;
      border-radius: 4px;
      z-index: 10000;
      font-family: Arial, sans-serif;
      font-size: 14px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      max-width: 300px;
      word-wrap: break-word;
    `;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
}

// Initialize the content script when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new HeadingSectionContentScript();
  });
} else {
  new HeadingSectionContentScript();
}
