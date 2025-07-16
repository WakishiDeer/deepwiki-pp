import { ChromeDomGateway } from "../../infrastructure/gateways/dom";
import { isHeadingSection } from "../../domain/heading-collection/heading-section";
import { AddHeadingSectionMessage } from "../../shared/messaging";

export default defineContentScript({
  matches: [
    "https://deepwiki.com/*",
    "https://*.deepwiki.com/*",
    "https://deepwiki.corp/*",
    "https://*.deepwiki.corp/*",
    "https://wiki.corp/*",
    "https://*.wiki.corp/*",
    // Development/test patterns
    "file://*/*", // Allow local files for testing
    "http://localhost:*/*", // Allow local development server
    "https://localhost:*/*", // Allow local development server with HTTPS
    "*://*/test-page.html", // Allow any test page
  ],
  main() {
    console.log("DeepWiki++: Content script loaded on DeepWiki");

    // Initialize DOM gateway
    const domGateway = new ChromeDomGateway();

    // Check if we're on a relevant DeepWiki page
    function isRelevantPage(): boolean {
      // For testing: allow test pages
      if (window.location.pathname.includes("test-page.html")) {
        console.log("DeepWiki++: Test page detected, allowing initialization");
        return true;
      }

      const host = location.hostname;
      if (host.endsWith("deepwiki.com") || host.endsWith("deepwiki.corp")) {
        return true;
      }
      return domGateway.isValidDeepWikiPage();
    }

    // Handle adding heading sections
    async function handleAddHeading(section: any): Promise<void> {
      try {
        console.log("DeepWiki++: Adding heading section:", section);

        if (!isHeadingSection(section)) {
          console.error("DeepWiki++: Invalid heading section:", section);
          return;
        }

        // Send message to background script with correct format
        const message: AddHeadingSectionMessage = {
          action: "addHeadingSection",
          headingSection: {
            level: section.level,
            title: section.titleText,
            content: section.contentHtml,
            sourceUrl: window.location.href,
            id: section.sectionId,
          },
        };

        console.log("DeepWiki++: Sending message to background:", message);

        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            console.error(
              "DeepWiki++: Error sending message:",
              chrome.runtime.lastError
            );
            return;
          }

          console.log("DeepWiki++: Background response:", response);

          if (response?.success) {
            console.log(
              "DeepWiki++: Heading section added successfully:",
              response.sectionId
            );
          } else {
            console.error(
              "DeepWiki++: Failed to add heading section:",
              response?.error,
              "Code:",
              response?.errorCode
            );
          }
        });
      } catch (error) {
        console.error("DeepWiki++: Error handling add heading:", error);
      }
    }

    // Initialize the extension on the page
    async function initialize(): Promise<void> {
      if (!isRelevantPage()) {
        console.log(
          "DeepWiki++: Not a relevant DeepWiki page, skipping initialization"
        );
        return;
      }

      console.log(
        "DeepWiki++: Starting initialization on DeepWiki page:",
        window.location.href
      );

      try {
        // First, find the main content container
        const contentArea = domGateway.findMainContentContainer();
        if (!contentArea) {
          console.log("DeepWiki++: No content area found on DeepWiki page");
          return;
        }

        console.log(
          "DeepWiki++: Content area found, waiting for headings to appear"
        );

        // Wait for headings to appear (handles SPA/AJAX delays)
        const headingsFound = await domGateway.waitForHeadings(contentArea);
        if (!headingsFound) {
          console.log(
            "DeepWiki++: No headings found after waiting, skipping initialization"
          );
          return;
        }

        console.log(
          "DeepWiki++: Headings detected, proceeding with initialization"
        );

        // Debug: Log page info
        console.log("DeepWiki++: Page debug info:", {
          url: window.location.href,
          title: document.title,
          contentAreaTag: contentArea.tagName,
          contentAreaClass: contentArea.className,
          contentAreaId: contentArea.id,
          allHeadings: document.querySelectorAll("h1,h2,h3,h4,h5,h6").length,
          contentAreaHeadings:
            contentArea.querySelectorAll("h1,h2,h3,h4,h5,h6").length,
        });

        // Clean up any existing buttons first
        domGateway.removeAddButtons();

        // Extract all heading sections from the content area
        const headingSections = await domGateway.extractHeadingSections(
          contentArea,
          window.location.href
        );
        console.log(
          `DeepWiki++: Found ${headingSections.length} heading sections on DeepWiki page`
        );

        // Debug: Log each heading section
        headingSections.forEach((section, index) => {
          console.log(`DeepWiki++: Section ${index}:`, {
            level: section.level,
            title: section.titleText,
            contentLength: section.contentHtml.length,
            firstFewWords: section.contentHtml.substring(0, 100) + "...",
          });
        });

        // Insert add buttons for each section
        domGateway.insertAddButtons(headingSections, handleAddHeading);

        console.log(
          `DeepWiki++: Successfully inserted buttons for ${headingSections.length} headings on DeepWiki page`
        );
      } catch (error) {
        console.error(
          "DeepWiki++: Error during DeepWiki page initialization:",
          error
        );
      }
    }

    // Handle dynamic content loading and SPA navigation
    function startMonitoring(): void {
      console.log("DeepWiki++: Starting SPA monitoring for dynamic content");

      // Use the new SPA monitoring API with a simple debounced reinitialize
      let reinitializeTimer: number | null = null;
      const debouncedReinitialize = () => {
        if (reinitializeTimer) {
          clearTimeout(reinitializeTimer);
        }
        reinitializeTimer = window.setTimeout(() => {
          console.log("DeepWiki++: Executing debounced re-initialization");
          initialize();
        }, 500);
      };

      domGateway.startSPAMonitoring(() => {
        console.log(
          "DeepWiki++: SPA navigation or content change detected, scheduling re-initialization"
        );
        debouncedReinitialize();
      });
    }

    // Stop monitoring when page unloads
    function stopMonitoring(): void {
      console.log("DeepWiki++: Stopping SPA monitoring");
      domGateway.stopSPAMonitoring();
    }

    // Start the extension
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        initialize();
        startMonitoring();
      });
    } else {
      initialize();
      startMonitoring();
    }

    // Clean up when page unloads
    window.addEventListener("beforeunload", stopMonitoring);
  },
});
